import type Stripe from "stripe";
import { referralAuthorizationRequiredUntil } from "@/lib/referral-deadlines";
import { calculatePartnerInvoiceAmounts, calculateReferralCommission, calculateReferralServiceFee, isCommissionType } from "@/lib/referrals";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { syncRestaurantBillingDetails } from "@/lib/stripe-billing-details";
import { checkoutTaxAmount } from "@/lib/stripe-tax";

export async function finalizeReferralAuthorization(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent.latest_charge"],
  });
  if (session.metadata?.kind !== "REFERRAL_AUTHORIZATION") return { status: "ignored" as const };

  const offerId = session.metadata.offerId;
  if (!offerId) throw new Error("Missing referral offer metadata");
  const paymentIntent = session.payment_intent as Stripe.PaymentIntent | null;
  if (!paymentIntent || paymentIntent.status !== "requires_capture") {
    return { status: "processing" as const };
  }

  const offer = await prisma.referralOffer.findUnique({
    where: { id: offerId },
    include: {
      restaurant: { select: { id: true, userId: true } },
      group: { include: { payment: true } },
    },
  });
  if (!offer) throw new Error("Referral offer not found");

  const billingDetails = await syncRestaurantBillingDetails(session, offer.restaurantId);
  if (!billingDetails.complete) {
    await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => undefined);
    return { status: "fiscal_required" as const, restaurantId: offer.restaurantId };
  }

  if (
    offer.group.acceptedRestaurantId === offer.restaurantId
    && offer.group.payment?.stripePaymentIntentId === paymentIntent.id
  ) {
    return { status: "accepted" as const, restaurantId: offer.restaurantId };
  }

  const type = isCommissionType(offer.commissionType) ? offer.commissionType : "TOTAL";
  const amounts = calculateReferralCommission({
    guests: offer.group.guests,
    commissionType: type,
    commissionAmount: Number(offer.commissionAmount),
    platformFeePercent: Number(offer.platformFeePercent),
  });
  const serviceFee = calculateReferralServiceFee(amounts.gross);
  const taxAmount = checkoutTaxAmount(session) / 100;
  const partnerInvoice = calculatePartnerInvoiceAmounts({
    partnerNet: amounts.partnerNet,
    grossCommission: amounts.gross,
    serviceFee,
    taxAmount,
  });
  const expectedSubtotalCents = Math.round((amounts.gross + serviceFee) * 100);
  if (
    session.amount_subtotal !== expectedSubtotalCents
    || session.currency?.toLowerCase() !== "eur"
    || session.automatic_tax?.status !== "complete"
  ) {
    await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => undefined);
    throw new Error("Referral authorization amount mismatch");
  }

  const charge = typeof paymentIntent.latest_charge === "string" || !paymentIntent.latest_charge
    ? null
    : paymentIntent.latest_charge as Stripe.Charge;
  const cardDetails = charge?.payment_method_details?.card as ({ capture_before?: number }) | undefined;
  const authorizationExpiresAt = cardDetails?.capture_before
    ? new Date(cardDetails.capture_before * 1000)
    : new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
  if (authorizationExpiresAt < referralAuthorizationRequiredUntil(offer.group.desiredDate)) {
    await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => undefined);
    return { status: "authorization_too_short" as const, restaurantId: offer.restaurantId };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const claim = await tx.referralGroup.updateMany({
        where: {
          id: offer.groupId,
          status: "OPEN",
          acceptedRestaurantId: null,
          desiredDate: { gt: new Date() },
        },
        data: {
          status: "BOOKED",
          acceptedRestaurantId: offer.restaurantId,
          commissionType: offer.commissionType,
          commissionAmount: offer.commissionAmount,
          platformFeePercent: offer.platformFeePercent,
          contactRevealedAt: new Date(),
        },
      });
      if (claim.count !== 1) throw new Error("GROUP_ALREADY_ACCEPTED");

      const reservation = await tx.reservation.create({
        data: {
          restaurantId: offer.restaurantId,
          customerName: offer.group.customerName || `Grupo ${offer.group.publicCode}`,
          phone: offer.group.customerPhone || "CONTACT_PENDING",
          email: offer.group.customerEmail || null,
          date: offer.group.desiredDate,
          guests: offer.group.guests,
          status: "CONFIRMED",
          source: "PARTNER_NETWORK",
          notes: [
            `Referência MesaLink Partner ${offer.group.publicCode}.`,
            `${offer.group.adults ?? Math.max(1, offer.group.guests - (offer.group.children || 0))} adultos${offer.group.children > 0 ? ` e ${offer.group.children} crianças` : ""}.`,
            offer.group.area ? `Zona pedida: ${offer.group.area}.` : "",
            offer.group.notes || "",
          ].filter(Boolean).join(" "),
        },
      });

      await Promise.all([
        tx.referralGroup.update({ where: { id: offer.groupId }, data: { reservationId: reservation.id } }),
        tx.referralOffer.update({ where: { id: offer.id }, data: { status: "ACCEPTED", respondedAt: new Date() } }),
        tx.referralOffer.updateMany({ where: { groupId: offer.groupId, id: { not: offer.id }, status: "PENDING" }, data: { status: "CLOSED", respondedAt: new Date() } }),
        tx.referralPayment.create({
          data: {
            groupId: offer.groupId,
            partnerId: offer.group.partnerId,
            grossCommission: amounts.gross,
            platformFee: amounts.platformFee,
            partnerNet: amounts.partnerNet,
            serviceFee,
            taxAmount,
            taxCountry: session.customer_details?.address?.country || null,
            partnerInvoiceBase: partnerInvoice.base,
            partnerInvoiceTax: partnerInvoice.tax,
            partnerInvoiceTotal: partnerInvoice.total,
            status: "AUTHORIZED",
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: charge?.id || null,
            stripeInvoiceId: typeof session.invoice === "string" ? session.invoice : session.invoice?.id || null,
            authorizedAt: new Date(),
            authorizationExpiresAt,
          },
        }),
      ]);
    });
  } catch (error) {
    if (error instanceof Error && error.message === "GROUP_ALREADY_ACCEPTED") {
      await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => undefined);
      return { status: "unavailable" as const };
    }
    throw error;
  }

  if (session.customer && offer.restaurant.userId) {
    await prisma.subscription.updateMany({
      where: { userId: offer.restaurant.userId, stripeCustomerId: null },
      data: { stripeCustomerId: session.customer.toString() },
    });
  }

  return { status: "accepted" as const, restaurantId: offer.restaurantId };
}
