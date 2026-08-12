import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function transferPartnerCommission(paymentId: string) {
  const payment = await prisma.referralPayment.findUnique({
    where: { id: paymentId },
    include: { partner: true },
  });
  if (!payment) throw new Error("Pagamento não encontrado.");
  if (payment.stripeTransferId) return payment;
  if (payment.status !== "CAPTURED_AWAITING_PAYOUT" && payment.status !== "TRANSFER_FAILED") {
    throw new Error("Este pagamento ainda não está pronto para transferência.");
  }
  if (!payment.stripeChargeId || !payment.partner.stripeAccountId || !payment.partner.stripeOnboardingComplete) {
    throw new Error("Falta a cobrança Stripe ou o IBAN verificado do parceiro.");
  }
  if (!payment.partnerInvoiceUrl || payment.partnerInvoiceStatus !== "VERIFIED") {
    throw new Error("A fatura do parceiro ainda não foi verificada pelo MesaLink.");
  }

  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(Number(payment.partnerNet) * 100),
      currency: payment.currency.toLowerCase(),
      destination: payment.partner.stripeAccountId,
      transfer_group: `REFERRAL_${payment.groupId}`,
      source_transaction: payment.stripeChargeId,
      metadata: { referralPaymentId: payment.id, referralGroupId: payment.groupId },
    }, { idempotencyKey: `weekly_partner_transfer_${payment.id}` });

    await prisma.$transaction([
      prisma.referralPayment.update({
        where: { id: payment.id },
        data: { status: "TRANSFERRED", stripeTransferId: transfer.id, transferredAt: new Date(), lastError: null },
      }),
      prisma.referralGroup.update({ where: { id: payment.groupId }, data: { status: "PAID" } }),
    ]);
  } catch (error) {
    await prisma.referralPayment.update({
      where: { id: payment.id },
      data: { status: "TRANSFER_FAILED", failedAt: new Date(), lastError: error instanceof Error ? error.message.slice(0, 500) : "Transfer failed" },
    });
    throw error;
  }
  return payment;
}
