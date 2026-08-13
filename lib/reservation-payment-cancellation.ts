import { createBenefitCardCode } from "@/lib/referrals";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function settleReservationCancellation(reservationId: string, options?: { forceRefund?: boolean; noShow?: boolean }) {
  const payment = await prisma.reservationPayment.findUnique({
    where: { reservationId },
    include: {
      reservation: { include: { experience: true, restaurant: true } },
    },
  });
  if (!payment || payment.status !== "PAID" || !payment.stripePaymentIntentId) return "NONE" as const;

  if (options?.noShow) {
    await prisma.reservationPayment.update({ where: { id: payment.id }, data: { status: "FORFEITED" } });
    return "FORFEITED" as const;
  }

  const cancellationHours = payment.reservation.experience?.cancellationHours
    ?? payment.reservation.restaurant?.noShowCancellationHours
    ?? 24;
  const cutoff = new Date(payment.reservation.date.getTime() - cancellationHours * 60 * 60 * 1000);
  const refundable = Boolean(options?.forceRefund || new Date() <= cutoff);
  const refundableAmount = Number(payment.baseAmount) + Number(payment.addOnsAmount);

  if (refundable && refundableAmount > 0) {
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: Math.round(refundableAmount * 100),
      reverse_transfer: true,
      metadata: { kind: "RESERVATION_CANCELLATION", reservationId, reservationPaymentId: payment.id },
    }, { idempotencyKey: `reservation_refund_${payment.id}` });
    await prisma.reservationPayment.update({
      where: { id: payment.id },
      data: { status: Number(payment.serviceFee) > 0 ? "PARTIALLY_REFUNDED" : "REFUNDED", stripeRefundId: refund.id, refundedAmount: refundableAmount, refundedAt: new Date(), lastError: null },
    });
    return "REFUNDED" as const;
  }

  if (payment.reservation.restaurant?.noShowCreditOnLateCancellation && payment.reservation.customerId && refundableAmount > 0) {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6);
    await prisma.marketingPromoCard.create({
      data: {
        publicCode: createBenefitCardCode(),
        restaurantId: payment.restaurantId,
        customerId: payment.reservation.customerId,
        title: "Crédito de reserva",
        description: `Crédito emitido após o cancelamento da reserva de ${payment.reservation.date.toLocaleDateString("pt-PT", { timeZone: "Europe/Lisbon" })}.`,
        benefitType: "FIXED",
        value: refundableAmount,
        terms: "Utilização única. Não convertível em dinheiro. A taxa de serviço da reserva original não está incluída.",
        template: "GOLD",
        expiresAt,
        status: "ACTIVE",
      },
    });
    await prisma.reservationPayment.update({ where: { id: payment.id }, data: { status: "CREDIT_ISSUED" } });
    return "CREDIT" as const;
  }

  await prisma.reservationPayment.update({ where: { id: payment.id }, data: { status: "FORFEITED" } });
  return "FORFEITED" as const;
}
