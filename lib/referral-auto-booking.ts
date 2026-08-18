import type Stripe from "stripe";
import { getReferralCapacity } from "@/lib/referral-availability";
import { referralAuthorizationRequiredUntil } from "@/lib/referral-deadlines";
import { blockRestaurantReferralPayments } from "@/lib/referral-payment-health";
import { calculatePartnerInvoiceAmounts, calculateReferralCommission, calculateReferralServiceFee, isCommissionType } from "@/lib/referrals";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { MESALINK_SERVICE_TAX_CODE } from "@/lib/stripe-tax";

export class InstantReferralBookingError extends Error {
  constructor(public code: "UNAVAILABLE" | "CAPACITY" | "PAYMENT" | "AUTHORIZATION_TOO_SHORT" | "FISCAL") {
    super(code);
  }
}

export async function finalizeInstantReferralBooking(offerId: string) {
  const offer = await prisma.referralOffer.findUnique({
    where: { id: offerId },
    include: {
      group: true,
      restaurant: {
        select: {
          id: true,
          name: true,
          slug: true,
          referralAutoAcceptEnabled: true,
          referralPaymentMethodId: true,
          referralPaymentBlockedAt: true,
          referralDefaultDailyCapacity: true,
          billingLegalName: true,
          billingTaxId: true,
          billingAddressLine1: true,
          billingPostalCode: true,
          billingCity: true,
          billingCountry: true,
          user: { select: { subscription: { select: { stripeCustomerId: true } } } },
        },
      },
    },
  });
  if (!offer || offer.group.status !== "OPEN" || offer.group.desiredDate <= new Date()) throw new InstantReferralBookingError("UNAVAILABLE");

  const isDemo = offer.restaurant.slug.includes("demo") || offer.group.publicCode.startsWith("DEMO-");
  if (!isDemo && (!offer.restaurant.referralAutoAcceptEnabled || offer.restaurant.referralPaymentBlockedAt)) throw new InstantReferralBookingError("UNAVAILABLE");
  const type = isCommissionType(offer.commissionType) ? offer.commissionType : "TOTAL";
  const amounts = calculateReferralCommission({
    guests: offer.group.guests,
    commissionType: type,
    commissionAmount: Number(offer.commissionAmount),
    platformFeePercent: Number(offer.platformFeePercent),
  });
  const serviceFee = calculateReferralServiceFee(amounts.gross);

  if (isDemo) {
    return commitReservation({ offerId, paymentIntent: null, taxAmount: 0, serviceFee, amounts, isDemo: true });
  }

  const customerId = offer.restaurant.user?.subscription?.stripeCustomerId;
  const paymentMethodId = offer.restaurant.referralPaymentMethodId;
  if (!customerId || !paymentMethodId) throw new InstantReferralBookingError("PAYMENT");
  if (!offer.restaurant.billingLegalName || !offer.restaurant.billingAddressLine1 || !offer.restaurant.billingPostalCode || !offer.restaurant.billingCity || !offer.restaurant.billingCountry || !offer.restaurant.billingTaxId) {
    throw new InstantReferralBookingError("FISCAL");
  }

  let taxCalculation: Stripe.Tax.Calculation;
  try {
    taxCalculation = await stripe.tax.calculations.create({
      currency: "eur",
      customer: customerId,
      line_items: [
        { amount: Math.round(amounts.gross * 100), quantity: 1, reference: `commission_${offer.groupId}`, tax_behavior: "exclusive", tax_code: MESALINK_SERVICE_TAX_CODE },
        { amount: Math.round(serviceFee * 100), quantity: 1, reference: `service_${offer.groupId}`, tax_behavior: "exclusive", tax_code: MESALINK_SERVICE_TAX_CODE },
      ],
    });
  } catch (error) {
    console.error("Referral automatic tax calculation failed", error);
    throw new InstantReferralBookingError("FISCAL");
  }

  let paymentIntent: Stripe.PaymentIntent;
  try {
    const baseParams: Stripe.PaymentIntentCreateParams = {
      amount: taxCalculation.amount_total,
      currency: "eur",
      customer: customerId,
      payment_method: paymentMethodId,
      payment_method_types: ["card"],
      confirm: true,
      off_session: true,
      error_on_requires_action: true,
      capture_method: "manual",
      description: `Garantia da reserva Partner ${offer.group.publicCode}`,
      transfer_group: `REFERRAL_${offer.groupId}`,
      metadata: { kind: "REFERRAL_AUTHORIZATION", offerId: offer.id, referralGroupId: offer.groupId, restaurantId: offer.restaurantId, automatic: "true" },
      hooks: { inputs: { tax: { calculation: taxCalculation.id! } } },
      expand: ["latest_charge"],
    };
    try {
      paymentIntent = await stripe.paymentIntents.create({
        ...baseParams,
        payment_method_options: { card: { request_extended_authorization: "if_available" } },
      }, { idempotencyKey: `referral_auto_${offer.id}_extended` });
    } catch (error) {
      const stripeError = error as { code?: string; message?: string };
      if (stripeError.code !== "payment_intent_invalid_parameter" || !stripeError.message?.includes("not eligible")) throw error;
      paymentIntent = await stripe.paymentIntents.create(baseParams, { idempotencyKey: `referral_auto_${offer.id}_standard` });
    }
  } catch (error) {
    console.error("Referral automatic authorization failed", error);
    await blockRestaurantReferralPayments(offer.restaurantId, "O cartão não permitiu garantir uma nova comissão Partner.");
    throw new InstantReferralBookingError("PAYMENT");
  }
  if (paymentIntent.status !== "requires_capture") {
    await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => undefined);
    await blockRestaurantReferralPayments(offer.restaurantId, "O cartão deixou de permitir garantir novas comissões Partner.");
    throw new InstantReferralBookingError("PAYMENT");
  }

  const charge = typeof paymentIntent.latest_charge === "string" || !paymentIntent.latest_charge ? null : paymentIntent.latest_charge as Stripe.Charge;
  const card = charge?.payment_method_details?.card as ({ capture_before?: number }) | undefined;
  const authorizationExpiresAt = card?.capture_before ? new Date(card.capture_before * 1000) : new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
  if (authorizationExpiresAt < referralAuthorizationRequiredUntil(offer.group.desiredDate)) {
    await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => undefined);
    throw new InstantReferralBookingError("AUTHORIZATION_TOO_SHORT");
  }

  try {
    return await commitReservation({
      offerId,
      paymentIntent,
      taxAmount: taxCalculation.tax_amount_exclusive / 100,
      serviceFee,
      amounts,
      isDemo: false,
      authorizationExpiresAt,
    });
  } catch (error) {
    await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => undefined);
    throw error;
  }
}

async function commitReservation({
  offerId,
  paymentIntent,
  taxAmount,
  serviceFee,
  amounts,
  isDemo,
  authorizationExpiresAt,
}: {
  offerId: string;
  paymentIntent: Stripe.PaymentIntent | null;
  taxAmount: number;
  serviceFee: number;
  amounts: { gross: number; platformFee: number; partnerNet: number };
  isDemo: boolean;
  authorizationExpiresAt?: Date;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const offer = await tx.referralOffer.findUnique({
      where: { id: offerId },
      include: { group: true, restaurant: { select: { name: true, referralDefaultDailyCapacity: true } } },
    });
    if (!offer || offer.group.status !== "OPEN") throw new InstantReferralBookingError("UNAVAILABLE");
    const capacity = await getReferralCapacity(tx, offer.restaurantId, offer.group.desiredDate, isDemo ? Math.max(80, offer.restaurant.referralDefaultDailyCapacity) : offer.restaurant.referralDefaultDailyCapacity);
    if (capacity.remaining < offer.group.guests) throw new InstantReferralBookingError("CAPACITY");

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
          `Reserva imediata MesaLink Partner ${offer.group.publicCode}.`,
          `${offer.group.adults ?? Math.max(1, offer.group.guests - (offer.group.children || 0))} adultos${offer.group.children > 0 ? ` e ${offer.group.children} crianças` : ""}.`,
          offer.group.notes || "",
        ].filter(Boolean).join(" "),
      },
    });
    const partnerInvoice = calculatePartnerInvoiceAmounts({ partnerNet: amounts.partnerNet, grossCommission: amounts.gross, serviceFee, taxAmount });
    const charge = paymentIntent && typeof paymentIntent.latest_charge !== "string" ? paymentIntent.latest_charge as Stripe.Charge | null : null;
    await Promise.all([
      tx.referralGroup.update({
        where: { id: offer.groupId },
        data: {
          status: "BOOKED",
          acceptedRestaurantId: offer.restaurantId,
          reservationId: reservation.id,
          contactRevealedAt: new Date(),
          commissionType: offer.commissionType,
          commissionAmount: offer.commissionAmount,
          platformFeePercent: offer.platformFeePercent,
        },
      }),
      tx.referralOffer.update({ where: { id: offer.id }, data: { status: "ACCEPTED", respondedAt: new Date() } }),
      tx.referralPayment.create({
        data: {
          groupId: offer.groupId,
          partnerId: offer.group.partnerId,
          grossCommission: amounts.gross,
          platformFee: amounts.platformFee,
          partnerNet: amounts.partnerNet,
          serviceFee,
          taxAmount,
          taxCountry: null,
          partnerInvoiceBase: partnerInvoice.base,
          partnerInvoiceTax: partnerInvoice.tax,
          partnerInvoiceTotal: partnerInvoice.total,
          status: isDemo ? "DEMO" : "AUTHORIZED",
          stripePaymentIntentId: paymentIntent?.id || null,
          stripeChargeId: charge?.id || null,
          authorizedAt: new Date(),
          authorizationExpiresAt: authorizationExpiresAt || null,
        },
      }),
    ]);
    return { groupId: offer.groupId, publicCode: offer.group.publicCode, restaurantId: offer.restaurantId, restaurantName: offer.restaurant.name, reservationId: reservation.id, customerName: reservation.customerName, guests: reservation.guests, date: reservation.date };
  }, { isolationLevel: "Serializable" });
  const { notifyRestaurantReservation } = await import("@/lib/hq-notifications");
  await notifyRestaurantReservation({ restaurantId: result.restaurantId, customerName: result.customerName, guests: result.guests, date: result.date, source: "PARTNER_NETWORK" })
    .catch((error) => console.error("Partner reservation push failed", error));
  return result;
}
