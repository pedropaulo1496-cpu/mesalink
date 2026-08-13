import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendReservationConfirmationEmail } from "@/lib/send-reservation-confirmation-email";
import { stripe } from "@/lib/stripe";
import { publicCustomerOrigin } from "@/lib/public-links";

export async function createReservationCheckout(paymentId: string, slug: string) {
  const payment = await prisma.reservationPayment.findUnique({
    where: { id: paymentId },
    include: {
      restaurant: true,
      reservation: { include: { experience: true, experienceAddOns: true } },
    },
  });
  if (!payment?.restaurant.paymentsStripeAccountId || !payment.restaurant.paymentsStripeOnboardingComplete) {
    throw new Error("Restaurant Stripe account is not ready");
  }
  if (payment.stripeCheckoutSessionId) {
    const existing = await stripe.checkout.sessions.retrieve(payment.stripeCheckoutSessionId).catch(() => null);
    if (existing?.status === "open" && existing.url) return existing.url;
    if (existing?.payment_status === "paid") return null;
  }

  const baseUrl = publicCustomerOrigin();
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
    quantity: 1,
    price_data: {
      currency: payment.currency.toLowerCase(),
      unit_amount: Math.round(Number(payment.baseAmount) * 100),
      tax_behavior: "inclusive",
      product_data: {
        name: payment.kind === "EXPERIENCE"
          ? payment.reservation.experience?.title || "Experiência"
          : payment.kind === "MENU_DEPOSIT"
            ? `Entrada · ${payment.reservation.experience?.title || payment.restaurant.name}`
            : `Depósito · ${payment.restaurant.name}`,
        description: payment.kind === "EXPERIENCE"
          ? `${payment.reservation.guests} pessoa(s) · preço final definido pelo restaurante`
          : payment.kind === "MENU_DEPOSIT"
            ? `${payment.reservation.guests} pessoa(s) · entrada descontada no valor do menu`
            : `${payment.reservation.guests} pessoa(s) · descontado na conta final`,
      },
    },
  }];
  for (const addOn of payment.kind === "EXPERIENCE" ? payment.reservation.experienceAddOns : []) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: payment.currency.toLowerCase(),
        unit_amount: Math.round(Number(addOn.totalAmount) * 100),
        tax_behavior: "inclusive",
        product_data: { name: addOn.nameSnapshot, description: addOn.quantity > 1 ? `${addOn.quantity} unidades` : "Extra da experiência" },
      },
    });
  }
  if (Number(payment.serviceFee) > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: payment.currency.toLowerCase(),
        unit_amount: Math.round(Number(payment.serviceFee) * 100),
        tax_behavior: "inclusive",
        product_data: { name: "Serviço de reserva MesaLink", description: "Processamento seguro e confirmação automática" },
      },
    });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: payment.reservation.email || undefined,
    billing_address_collection: "auto",
    locale: "auto",
    line_items: lineItems,
    success_url: `${baseUrl}/reserve/${encodeURIComponent(slug)}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/reserve/${encodeURIComponent(slug)}?error=payment`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    metadata: {
      kind: "RESERVATION_COMMERCE",
      reservationPaymentId: payment.id,
      reservationId: payment.reservationId,
      restaurantId: payment.restaurantId,
    },
    payment_intent_data: {
      application_fee_amount: Math.round(Number(payment.applicationFee) * 100),
      transfer_data: { destination: payment.restaurant.paymentsStripeAccountId },
      metadata: {
        kind: "RESERVATION_COMMERCE",
        reservationPaymentId: payment.id,
        reservationId: payment.reservationId,
        restaurantId: payment.restaurantId,
      },
    },
  }, { idempotencyKey: `reservation_checkout_${payment.id}_${payment.updatedAt.getTime()}` });

  await prisma.reservationPayment.update({
    where: { id: payment.id },
    data: { stripeCheckoutSessionId: checkout.id, status: "CHECKOUT_CREATED", expiresAt: new Date((checkout.expires_at || Math.floor(Date.now() / 1000) + 1800) * 1000), lastError: null },
  });
  if (!checkout.url) throw new Error("Stripe Checkout URL missing");
  return checkout.url;
}

export async function settleReservationCheckoutSession(sessionOrId: Stripe.Checkout.Session | string) {
  const session = typeof sessionOrId === "string"
    ? await stripe.checkout.sessions.retrieve(sessionOrId, { expand: ["payment_intent.latest_charge"] })
    : sessionOrId;
  if (session.metadata?.kind !== "RESERVATION_COMMERCE" || session.payment_status !== "paid") return null;

  const payment = await prisma.reservationPayment.findUnique({
    where: { stripeCheckoutSessionId: session.id },
    include: { reservation: { include: { restaurant: true } } },
  });
  if (!payment) throw new Error("Reservation payment not found");
  const expectedSubtotal = Math.round(Number(payment.totalAmount) * 100);
  if (session.amount_subtotal !== expectedSubtotal || session.currency?.toUpperCase() !== payment.currency.toUpperCase()) {
    await prisma.reservationPayment.update({ where: { id: payment.id }, data: { status: "REVIEW", lastError: "Checkout amount mismatch" } });
    throw new Error("Reservation checkout amount mismatch");
  }

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!paymentIntentId) throw new Error("Missing reservation payment intent");
  const paymentIntent = typeof session.payment_intent === "object" && session.payment_intent
    ? session.payment_intent as Stripe.PaymentIntent
    : await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge"] });
  const chargeId = typeof paymentIntent.latest_charge === "string" ? paymentIntent.latest_charge : paymentIntent.latest_charge?.id;
  const settledRevenue = payment.kind === "EXPERIENCE"
    ? Number(payment.baseAmount) + Number(payment.addOnsAmount)
    : payment.kind === "MENU_DEPOSIT"
      ? Number(payment.reservation.estimatedRevenue || payment.reservation.guests * Number(payment.reservation.restaurant?.averageTicket || 25))
      : payment.reservation.guests * Number(payment.reservation.restaurant?.averageTicket || 25);

  if (payment.status !== "PAID") {
    await prisma.$transaction(async (tx) => {
      await tx.reservationPayment.update({
        where: { id: payment.id },
        data: { status: "PAID", stripePaymentIntentId: paymentIntentId, stripeChargeId: chargeId || null, paidAt: new Date(), lastError: null },
      });
      await tx.reservation.update({
        where: { id: payment.reservationId },
        data: {
          status: payment.confirmationStatus,
          estimatedRevenue: settledRevenue,
        },
      });
      if (payment.offerCode) {
        await tx.marketingPromoCard.updateMany({
          where: { publicCode: payment.offerCode, reservationId: payment.reservationId, status: "HELD" },
          data: { status: "REDEEMED", redeemedAt: new Date() },
        });
      }
      const action = await tx.marketingAction.findFirst({
        where: {
          restaurantId: payment.restaurantId,
          customerId: payment.reservation.customerId,
          status: { in: ["SENT", "OPENED", "CLICKED", "BOOKED"] },
          ...(payment.marketingTrackingToken ? { trackingToken: payment.marketingTrackingToken } : {}),
        },
        orderBy: { sentAt: "desc" },
        select: { id: true },
      });
      if (action) {
        await tx.marketingAction.update({
          where: { id: action.id },
          data: {
            status: "CONVERTED",
            bookedAt: new Date(),
            convertedAt: new Date(),
            reservationId: payment.reservationId,
            estimatedRevenue: settledRevenue,
          },
        });
      }
    });
  }

  await sendReservationConfirmationEmail(payment.reservationId);
  return payment.reservationId;
}

export async function expireReservationCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.metadata?.kind !== "RESERVATION_COMMERCE") return;
  const payment = await prisma.reservationPayment.findUnique({ where: { stripeCheckoutSessionId: session.id } });
  if (!payment || payment.status === "PAID") return;
  await prisma.$transaction([
    prisma.reservationPayment.update({ where: { id: payment.id }, data: { status: "EXPIRED", lastError: "Checkout expired" } }),
    prisma.reservation.update({ where: { id: payment.reservationId }, data: { status: "CANCELLED", cancelledBy: "PAYMENT_EXPIRED" } }),
    prisma.marketingPromoCard.updateMany({ where: { reservationId: payment.reservationId, status: "HELD" }, data: { status: "ACTIVE", reservationId: null } }),
  ]);
}

export async function releaseExpiredReservationPayments(restaurantId: string) {
  const expired = await prisma.reservationPayment.findMany({
    where: {
      restaurantId,
      status: { in: ["PENDING", "CHECKOUT_CREATED"] },
      expiresAt: { lte: new Date() },
    },
    select: { id: true, reservationId: true },
    take: 100,
  });
  if (!expired.length) return 0;
  const reservationIds = expired.map((payment) => payment.reservationId);
  await prisma.$transaction([
    prisma.reservationPayment.updateMany({ where: { id: { in: expired.map((payment) => payment.id) } }, data: { status: "EXPIRED", lastError: "Checkout expired" } }),
    prisma.reservation.updateMany({ where: { id: { in: reservationIds }, status: "PENDING_PAYMENT" }, data: { status: "CANCELLED", cancelledBy: "PAYMENT_EXPIRED" } }),
    prisma.marketingPromoCard.updateMany({ where: { reservationId: { in: reservationIds }, status: "HELD" }, data: { status: "ACTIVE", reservationId: null } }),
  ]);
  return expired.length;
}
