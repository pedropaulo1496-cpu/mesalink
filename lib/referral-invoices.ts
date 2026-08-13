import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { MESALINK_SERVICE_TAX_CODE } from "@/lib/stripe-tax";

export async function issueCapturedReferralInvoice(paymentId: string) {
  const payment = await prisma.referralPayment.findUnique({
    where: { id: paymentId },
    include: {
      group: {
        select: {
          publicCode: true,
          platformFeePercent: true,
          actualGuests: true,
          guests: true,
          acceptedRestaurantId: true,
          acceptedRestaurant: {
            select: { user: { select: { subscription: { select: { stripeCustomerId: true } } } } },
          },
        },
      },
    },
  });
  if (!payment?.stripePaymentIntentId) {
    throw new Error("Faltam os dados Stripe para emitir a fatura do grupo.");
  }
  if (payment.stripeInvoiceId && (payment.stripeInvoicePdfUrl || payment.stripeInvoiceUrl)) return payment;

  const checkout = payment.stripeCheckoutSessionId
    ? await stripe.checkout.sessions.retrieve(payment.stripeCheckoutSessionId)
    : null;
  const checkoutCustomerId = typeof checkout?.customer === "string" ? checkout.customer : checkout?.customer?.id;
  const customerId = checkoutCustomerId || payment.group.acceptedRestaurant?.user?.subscription?.stripeCustomerId;
  if (!customerId) throw new Error("O pagamento do grupo não tem cliente Stripe associado.");

  const metadata = {
    kind: "REFERRAL_AUTHORIZATION",
    referralGroupId: payment.groupId,
    restaurantId: payment.group.acceptedRestaurantId || "",
    referralPaymentId: payment.id,
    paymentIntentId: payment.stripePaymentIntentId,
  };
  const currency = payment.currency.toLowerCase();
  let invoice = await stripe.invoices.create({
    customer: customerId,
    currency,
    collection_method: "send_invoice",
    days_until_due: 1,
    auto_advance: false,
    automatic_tax: { enabled: true },
    pending_invoice_items_behavior: "exclude",
    description: `Serviço MesaLink Partners · reserva ${payment.group.publicCode}`,
    custom_fields: [{ name: "Grupo", value: payment.group.publicCode }],
    footer: "Documento emitido automaticamente. A comissão líquida do parceiro é documentada separadamente pelo parceiro.",
    metadata,
  }, { idempotencyKey: `referral_invoice_v2_${payment.id}` });

  const platformCents = Math.round(Number(payment.platformFee) * 100);
  const serviceCents = Math.round(Number(payment.serviceFee) * 100);
  if (platformCents > 0) {
    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id,
      amount: platformCents,
      currency,
      description: `Taxa MesaLink de ${Number(payment.group.platformFeePercent || 7)}% · reserva ${payment.group.publicCode}`,
      tax_behavior: "exclusive",
      tax_code: MESALINK_SERVICE_TAX_CODE,
      metadata,
    }, { idempotencyKey: `referral_invoice_platform_v2_${payment.id}` });
  }
  if (serviceCents > 0) {
    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id,
      amount: serviceCents,
      currency,
      description: "Proteção, reserva e processamento MesaLink",
      tax_behavior: "exclusive",
      tax_code: MESALINK_SERVICE_TAX_CODE,
      metadata,
    }, { idempotencyKey: `referral_invoice_service_v2_${payment.id}` });
  }

  invoice = await stripe.invoices.finalizeInvoice(invoice.id, {}, { idempotencyKey: `referral_invoice_finalize_v2_${payment.id}` });
  if (invoice.status === "open") {
    invoice = await stripe.invoices.pay(invoice.id, {
      paid_out_of_band: true,
    }, { idempotencyKey: `referral_invoice_payment_v2_${payment.id}` });
  }

  return prisma.referralPayment.update({
    where: { id: payment.id },
    data: {
      stripeInvoiceId: invoice.id,
      stripeInvoiceUrl: invoice.hosted_invoice_url || null,
      stripeInvoicePdfUrl: invoice.invoice_pdf || null,
    },
  });
}
