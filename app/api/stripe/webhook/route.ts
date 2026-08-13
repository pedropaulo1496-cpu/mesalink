import { headers } from "next/headers";
import Stripe from "stripe";
import { getAiCreditPack, grantPurchasedAiCredits, revokeRefundedAiCredits, type AiCreditPackId } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { recordSalesCommission } from "@/lib/sales-commissions";
import { finalizeReferralAuthorization } from "@/lib/referral-authorization";
import { blockRestaurantReferralPayments } from "@/lib/referral-payment-health";
import { calculatePartnerInvoiceAmounts } from "@/lib/referrals";
import { syncRestaurantBillingDetails, syncUserRestaurantBillingDetails } from "@/lib/stripe-billing-details";
import {
  handleDomainChargeDispute,
  handleDomainChargeRefund,
  markDomainCheckoutFailure,
  settleDomainCheckout,
} from "@/lib/domain-orders";

type Product = "ESSENTIALS" | "GROWTH";

function getPriceMonthly(product: Product) {
  return product === "GROWTH" ? 75 : 55;
}

function subscriptionStatus(status: Stripe.Subscription.Status) {
  if (status === "active" || status === "trialing") return "ACTIVE";
  if (status === "canceled" || status === "incomplete_expired") return "CANCELED";
  return "PAST_DUE";
}

function subscriptionProduct(subscription: Stripe.Subscription): Product | null {
  const metadataProduct = subscription.metadata?.product;
  if (metadataProduct === "ESSENTIALS" || metadataProduct === "GROWTH") return metadataProduct;
  const priceId = subscription.items.data[0]?.price.id;
  if (priceId && [process.env.STRIPE_PRICE_GROWTH_MONTHLY, process.env.STRIPE_PRICE_GROWTH_YEARLY].includes(priceId)) return "GROWTH";
  if (priceId && [process.env.STRIPE_PRICE_ESSENTIALS_MONTHLY, process.env.STRIPE_PRICE_ESSENTIALS_YEARLY].includes(priceId)) return "ESSENTIALS";
  return null;
}

async function settleAiCreditSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;
  const userId = session.metadata?.userId;
  const pack = getAiCreditPack(session.metadata?.packId);
  if (!userId || !pack) throw new Error("Invalid AI credit checkout metadata");
  if (session.amount_subtotal !== pack.priceCents || session.currency?.toLowerCase() !== "eur") {
    throw new Error("AI credit checkout amount mismatch");
  }
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!paymentIntentId) throw new Error("Missing AI credit payment intent");
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const chargeId = typeof paymentIntent.latest_charge === "string" ? paymentIntent.latest_charge : paymentIntent.latest_charge?.id;
  if (!chargeId) throw new Error("Missing AI credit charge");

  await grantPurchasedAiCredits({
    userId,
    packId: pack.id as AiCreditPackId,
    checkoutSessionId: session.id,
    paymentIntentId,
    chargeId,
  });

  if (session.customer) {
    await prisma.subscription.updateMany({
      where: { userId, stripeCustomerId: null },
      data: { stripeCustomerId: session.customer.toString() },
    });
  }

  await recordSalesCommission({
    userId,
    sourceType: "AI_CREDITS",
    sourceId: session.id,
    description: `Créditos IA · ${pack.label}`,
    grossCents: session.amount_total || pack.priceCents,
    currency: session.currency || "eur",
  });
}

async function settlePlanInvoiceCommission(invoice: Stripe.Invoice) {
  if (invoice.amount_paid <= 0) return;
  const subscriptionDetails = invoice.parent?.subscription_details;
  const metadataUserId = subscriptionDetails?.metadata?.userId;
  const stripeSubscriptionId = typeof subscriptionDetails?.subscription === "string"
    ? subscriptionDetails.subscription
    : subscriptionDetails?.subscription?.id;
  const stripeCustomerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

  const subscription = metadataUserId
    ? await prisma.subscription.findUnique({ where: { userId: metadataUserId }, select: { userId: true, plan: true } })
    : await prisma.subscription.findFirst({
        where: {
          OR: [
            ...(stripeSubscriptionId ? [{ stripeSubscriptionId }] : []),
            ...(stripeCustomerId ? [{ stripeCustomerId }] : []),
          ],
        },
        select: { userId: true, plan: true },
      });
  const userId = metadataUserId || subscription?.userId;
  if (!userId) return;

  await recordSalesCommission({
    userId,
    sourceType: "PLAN",
    sourceId: invoice.id,
    description: `Plano MesaLink ${subscription?.plan || ""}`.trim(),
    grossCents: invoice.amount_paid,
    currency: invoice.currency,
    earnedAt: new Date(invoice.created * 1000),
  });
}

async function settleReferralInvoice(invoice: Stripe.Invoice) {
  if (invoice.metadata?.kind !== "REFERRAL_AUTHORIZATION" || !invoice.metadata.referralGroupId) return;
  await prisma.referralPayment.updateMany({
    where: { groupId: invoice.metadata.referralGroupId },
    data: {
      stripeInvoiceId: invoice.id,
      stripeInvoiceUrl: invoice.hosted_invoice_url || null,
      stripeInvoicePdfUrl: invoice.invoice_pdf || null,
    },
  });
}

async function transferReferralPayment(paymentId: string) {
  const payment = await prisma.referralPayment.findUnique({
    where: { id: paymentId },
  });

  if (!payment || payment.stripeTransferId || ["REFUNDED", "TRANSFERRED", "PAID"].includes(payment.status)) return;
  await prisma.referralPayment.update({
    where: { id: paymentId },
    data: {
      status: "CAPTURED_AWAITING_PAYOUT",
      capturedAt: payment.capturedAt || new Date(),
      payoutDueAt: payment.payoutDueAt || nextWeeklyPayout(),
      lastError: null,
    },
  });
}

function nextWeeklyPayout() {
  const date = new Date();
  const days = ((8 - date.getUTCDay()) % 7) || 7;
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(9, 0, 0, 0);
  return date;
}

async function settleReferralSession(session: Stripe.Checkout.Session) {
  const referralPaymentId = session.metadata?.referralPaymentId;
  if (!referralPaymentId) throw new Error("Missing referral metadata");

  const payment = await prisma.referralPayment.findUnique({ where: { id: referralPaymentId } });
  if (!payment) throw new Error("Referral payment not found");
  if (["TRANSFERRED", "REFUNDED"].includes(payment.status)) return;

  if (session.payment_status !== "paid") {
    await prisma.referralPayment.update({
      where: { id: payment.id },
      data: { status: "PAYMENT_PROCESSING", lastError: null },
    });
    return;
  }

  const expectedSubtotal = Math.round((Number(payment.grossCommission) + Number(payment.serviceFee)) * 100);
  if (session.amount_subtotal !== expectedSubtotal || session.currency?.toUpperCase() !== payment.currency.toUpperCase()) {
    await prisma.referralPayment.update({
      where: { id: payment.id },
      data: { status: "PAYMENT_REVIEW", lastError: "Checkout amount or currency mismatch." },
    });
    throw new Error("Referral checkout amount mismatch");
  }

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id;
  if (!paymentIntentId) throw new Error("Missing referral payment intent");

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const chargeId = typeof paymentIntent.latest_charge === "string"
    ? paymentIntent.latest_charge
    : paymentIntent.latest_charge?.id;
  if (!chargeId) throw new Error("Missing referral charge");
  const taxAmount = (session.total_details?.amount_tax || 0) / 100;
  const partnerInvoice = calculatePartnerInvoiceAmounts({
    partnerNet: Number(payment.partnerNet),
    grossCommission: Number(payment.grossCommission),
    serviceFee: Number(payment.serviceFee),
    taxAmount,
  });

  await prisma.referralPayment.update({
    where: { id: payment.id },
    data: {
      status: "PAID_TRANSFER_PENDING",
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      stripeChargeId: chargeId,
      taxAmount,
      taxCountry: session.customer_details?.address?.country || null,
      partnerInvoiceBase: partnerInvoice.base,
      partnerInvoiceTax: partnerInvoice.tax,
      partnerInvoiceTotal: partnerInvoice.total,
      paidAt: new Date(),
      lastError: null,
    },
  });

  await transferReferralPayment(payment.id);
}

async function markReferralPaymentFailure(session: Stripe.Checkout.Session, status: string) {
  const referralPaymentId = session.metadata?.referralPaymentId;
  if (!referralPaymentId) return;
  const payment = await prisma.referralPayment.findUnique({
    where: { id: referralPaymentId },
    select: { group: { select: { acceptedRestaurantId: true } } },
  });
  await prisma.referralPayment.updateMany({
    where: { id: referralPaymentId, status: { notIn: ["TRANSFERRED", "REFUNDED"] } },
    data: {
      status,
      failedAt: new Date(),
      lastError: status === "PAYMENT_FAILED" ? "O pagamento não foi concluído pelo Stripe." : null,
      ...(status === "PENDING" ? { stripeCheckoutSessionId: null } : {}),
    },
  });
  if (status === "PAYMENT_FAILED" && payment?.group.acceptedRestaurantId) {
    await blockRestaurantReferralPayments(payment.group.acceptedRestaurantId, "Existe uma comissão Partner que o cartão não conseguiu pagar.");
  }
}

async function handleReferralRefund(charge: Stripe.Charge) {
  const payment = await prisma.referralPayment.findFirst({
    where: {
      OR: [
        { stripeChargeId: charge.id },
        ...(typeof charge.payment_intent === "string" ? [{ stripePaymentIntentId: charge.payment_intent }] : []),
      ],
    },
  });
  if (!payment || charge.amount <= 0) return;

  const refunds = await stripe.refunds.list({ charge: charge.id, limit: 100 });
  const attendanceAdjustmentCents = refunds.data
    .filter((refund) => refund.metadata?.kind === "REFERRAL_ATTENDANCE_ADJUSTMENT")
    .reduce((total, refund) => total + refund.amount, 0);
  const grossRefundedCents = Math.max(0, charge.amount_refunded - attendanceAdjustmentCents);
  if (grossRefundedCents === 0) {
    await prisma.referralPayment.update({
      where: { id: payment.id },
      data: { refundedAmount: charge.amount_refunded / 100 },
    });
    return;
  }
  const partnerPayoutCents = Math.round(Number(payment.partnerInvoiceTotal || payment.partnerNet) * 100);
  const collectedAfterAttendanceAdjustment = Math.max(1, charge.amount - attendanceAdjustmentCents);
  const desiredReversalCents = Math.min(
    partnerPayoutCents,
    Math.round((grossRefundedCents / collectedAfterAttendanceAdjustment) * partnerPayoutCents),
  );
  const alreadyReversedCents = Math.round(Number(payment.reversedAmount) * 100);
  const reversalDelta = Math.max(0, desiredReversalCents - alreadyReversedCents);

  if (payment.stripeTransferId && reversalDelta > 0) {
    await stripe.transfers.createReversal(
      payment.stripeTransferId,
      {
        amount: reversalDelta,
        metadata: { referralPaymentId: payment.id, stripeChargeId: charge.id },
      },
      { idempotencyKey: `referral_reversal_${payment.id}_${grossRefundedCents}` },
    );
  }

  const fullyRefunded = grossRefundedCents >= collectedAfterAttendanceAdjustment;
  await prisma.$transaction([
    prisma.referralPayment.update({
      where: { id: payment.id },
      data: {
        status: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED",
        refundedAmount: charge.amount_refunded / 100,
        reversedAmount: desiredReversalCents / 100,
        refundedAt: new Date(),
        lastError: null,
      },
    }),
    prisma.referralGroup.update({
      where: { id: payment.groupId },
      data: { status: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED" },
    }),
  ]);
}

async function handleChargeDispute(dispute: Stripe.Dispute) {
  const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge.id;
  const charge = await stripe.charges.retrieve(chargeId);
  await revokeRefundedAiCredits({ chargeId, refundedCents: charge.amount, totalCents: charge.amount });

  const payment = await prisma.referralPayment.findUnique({ where: { stripeChargeId: chargeId } });
  if (!payment) return;
  const partnerNetCents = Math.round(Number(payment.partnerInvoiceTotal || payment.partnerNet) * 100);
  const reversedCents = Math.round(Number(payment.reversedAmount) * 100);
  const reversalDelta = Math.max(0, partnerNetCents - reversedCents);

  if (payment.stripeTransferId && reversalDelta > 0) {
    await stripe.transfers.createReversal(
      payment.stripeTransferId,
      { amount: reversalDelta, metadata: { referralPaymentId: payment.id, stripeDisputeId: dispute.id } },
      { idempotencyKey: `referral_dispute_${payment.id}_${dispute.id}` },
    );
  }

  await prisma.$transaction([
    prisma.referralPayment.update({
      where: { id: payment.id },
      data: {
        status: "DISPUTED",
        reversedAmount: partnerNetCents / 100,
        failedAt: new Date(),
        lastError: `Pagamento contestado no Stripe (${dispute.id}).`,
      },
    }),
    prisma.referralGroup.update({ where: { id: payment.groupId }, data: { status: "DISPUTED" } }),
  ]);
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");
  if (!signature) return new Response("No signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    console.error("Stripe webhook signature error", error);
    return new Response("Webhook Error", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.kind === "REFERRAL_AUTHORIZATION") {
        await finalizeReferralAuthorization(session.id);
        return new Response("OK");
      }
      if (session.metadata?.kind === "AI_CREDITS") {
        if (session.metadata.userId) await syncUserRestaurantBillingDetails(session, session.metadata.userId);
        await settleAiCreditSession(session);
        return new Response("OK");
      }
      if (session.metadata?.kind === "REFERRAL_COMMISSION") {
        await settleReferralSession(session);
        return new Response("OK");
      }
      if (session.metadata?.kind === "CUSTOM_DOMAIN") {
        if (session.metadata.restaurantId) await syncRestaurantBillingDetails(session, session.metadata.restaurantId);
        await settleDomainCheckout(session);
        if (session.customer && session.metadata.userId) {
          await prisma.subscription.updateMany({
            where: { userId: session.metadata.userId, stripeCustomerId: null },
            data: { stripeCustomerId: session.customer.toString() },
          });
        }
        if (session.metadata.userId && session.amount_total) {
          await recordSalesCommission({
            userId: session.metadata.userId,
            sourceType: "CUSTOM_DOMAIN",
            sourceId: session.id,
            description: `Domínio próprio · ${session.metadata.domain || "MesaLink"}`,
            grossCents: session.amount_total,
            currency: session.currency || "eur",
          });
        }
        return new Response("OK");
      }

      if (event.type === "checkout.session.completed") {
        const userId = session.metadata?.userId;
        const product = session.metadata?.product as Product | undefined;
        if (!userId || !product) return new Response("Missing metadata", { status: 400 });

        if (session.metadata?.restaurantId) await syncRestaurantBillingDetails(session, session.metadata.restaurantId);

        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            plan: product,
            status: "ACTIVE",
            trialEndsAt: null,
            restaurantLimit: 1,
            priceMonthly: getPriceMonthly(product),
            stripeCustomerId: session.customer?.toString(),
            stripeSubscriptionId: session.subscription?.toString(),
          },
          update: {
            plan: product,
            status: "ACTIVE",
            trialEndsAt: null,
            restaurantLimit: 1,
            priceMonthly: getPriceMonthly(product),
            stripeCustomerId: session.customer?.toString(),
            stripeSubscriptionId: session.subscription?.toString(),
          },
        });
      }
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      await settleReferralInvoice(invoice);
      await settlePlanInvoiceCommission(invoice);
    }

    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.kind === "REFERRAL_COMMISSION") await markReferralPaymentFailure(session, "PAYMENT_FAILED");
      if (session.metadata?.kind === "CUSTOM_DOMAIN") await markDomainCheckoutFailure(session);
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.kind === "REFERRAL_COMMISSION") await markReferralPaymentFailure(session, "PENDING");
      if (session.metadata?.kind === "CUSTOM_DOMAIN") await markDomainCheckoutFailure(session, true);
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      await revokeRefundedAiCredits({ chargeId: charge.id, refundedCents: charge.amount_refunded, totalCents: charge.amount });
      await handleReferralRefund(charge);
      await handleDomainChargeRefund(charge);
    }

    if (event.type === "charge.dispute.created") {
      const dispute = event.data.object as Stripe.Dispute;
      await handleChargeDispute(dispute);
      await handleDomainChargeDispute(dispute);
    }

    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      const complete = Boolean(account.details_submitted && account.payouts_enabled);
      const partner = await prisma.referralPartner.findUnique({ where: { stripeAccountId: account.id } });

      if (partner) {
        await prisma.referralPartner.update({
          where: { id: partner.id },
          data: {
            stripeOnboardingComplete: complete,
            ...(complete ? { status: "ACTIVE" } : {}),
          },
        });

        if (complete) {
          const pending = await prisma.referralPayment.findMany({
            where: { partnerId: partner.id, status: { in: ["PAID", "PAID_TRANSFER_PENDING", "TRANSFER_FAILED"] } },
            select: { id: true },
          });
          for (const payment of pending) await transferReferralPayment(payment.id);
        }
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const product = subscriptionProduct(subscription);
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: event.type === "customer.subscription.deleted" ? "CANCELED" : subscriptionStatus(subscription.status),
          ...(product ? { plan: product, priceMonthly: getPriceMonthly(product) } : {}),
        },
      });
    }

    return new Response("OK");
  } catch (error) {
    console.error(`Stripe webhook ${event.type} failed`, error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
