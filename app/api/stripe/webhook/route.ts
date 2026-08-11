import { headers } from "next/headers";
import Stripe from "stripe";
import { getAiCreditPack, grantPurchasedAiCredits, revokeRefundedAiCredits, type AiCreditPackId } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

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
}

async function transferReferralPayment(paymentId: string) {
  const payment = await prisma.referralPayment.findUnique({
    where: { id: paymentId },
    include: { partner: true },
  });

  if (!payment || payment.stripeTransferId || payment.status === "REFUNDED") return;
  if (!payment.stripeChargeId || !payment.partner.stripeAccountId || !payment.partner.stripeOnboardingComplete) {
    await prisma.referralPayment.update({
      where: { id: paymentId },
      data: { status: "PAID_TRANSFER_PENDING" },
    });
    return;
  }

  try {
    const transfer = await stripe.transfers.create(
      {
        amount: Math.round(Number(payment.partnerNet) * 100),
        currency: payment.currency.toLowerCase(),
        destination: payment.partner.stripeAccountId,
        transfer_group: `REFERRAL_${payment.groupId}`,
        source_transaction: payment.stripeChargeId,
        metadata: {
          referralPaymentId: payment.id,
          referralGroupId: payment.groupId,
        },
      },
      { idempotencyKey: `referral_transfer_${payment.id}` },
    );

    await prisma.$transaction([
      prisma.referralPayment.update({
        where: { id: payment.id },
        data: {
          status: "TRANSFERRED",
          stripeTransferId: transfer.id,
          transferredAt: new Date(),
          lastError: null,
        },
      }),
      prisma.referralGroup.update({
        where: { id: payment.groupId },
        data: { status: "PAID" },
      }),
    ]);
  } catch (error) {
    await prisma.referralPayment.update({
      where: { id: payment.id },
      data: {
        status: "TRANSFER_FAILED",
        lastError: error instanceof Error ? error.message.slice(0, 500) : "Transfer failed",
        failedAt: new Date(),
      },
    });
    throw error;
  }
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

  const expectedAmount = Math.round((Number(payment.grossCommission) + Number(payment.serviceFee)) * 100);
  if (session.amount_total !== expectedAmount || session.currency?.toUpperCase() !== payment.currency.toUpperCase()) {
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

  await prisma.referralPayment.update({
    where: { id: payment.id },
    data: {
      status: "PAID_TRANSFER_PENDING",
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      stripeChargeId: chargeId,
      paidAt: new Date(),
      lastError: null,
    },
  });

  await transferReferralPayment(payment.id);
}

async function markReferralPaymentFailure(session: Stripe.Checkout.Session, status: string) {
  const referralPaymentId = session.metadata?.referralPaymentId;
  if (!referralPaymentId) return;
  await prisma.referralPayment.updateMany({
    where: { id: referralPaymentId, status: { notIn: ["TRANSFERRED", "REFUNDED"] } },
    data: {
      status,
      failedAt: new Date(),
      lastError: status === "PAYMENT_FAILED" ? "O pagamento não foi concluído pelo Stripe." : null,
      ...(status === "PENDING" ? { stripeCheckoutSessionId: null } : {}),
    },
  });
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

  const grossRefundedCents = charge.amount_refunded;
  const commissionRefundedCents = Math.min(
    Math.round(Number(payment.grossCommission) * 100),
    Math.round((grossRefundedCents / charge.amount) * Number(payment.grossCommission) * 100),
  );
  const desiredReversalCents = Math.min(
    Math.round(Number(payment.partnerNet) * 100),
    Math.round((commissionRefundedCents / Math.max(1, Number(payment.grossCommission) * 100)) * Number(payment.partnerNet) * 100),
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

  const fullyRefunded = grossRefundedCents >= charge.amount;
  await prisma.$transaction([
    prisma.referralPayment.update({
      where: { id: payment.id },
      data: {
        status: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED",
        refundedAmount: commissionRefundedCents / 100,
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
      if (session.metadata?.kind === "AI_CREDITS") {
        await settleAiCreditSession(session);
        return new Response("OK");
      }
      if (session.metadata?.kind === "REFERRAL_COMMISSION") {
        await settleReferralSession(session);
        return new Response("OK");
      }

      if (event.type === "checkout.session.completed") {
        const userId = session.metadata?.userId;
        const product = session.metadata?.product as Product | undefined;
        if (!userId || !product) return new Response("Missing metadata", { status: 400 });

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

    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.kind === "REFERRAL_COMMISSION") await markReferralPaymentFailure(session, "PAYMENT_FAILED");
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.kind === "REFERRAL_COMMISSION") await markReferralPaymentFailure(session, "PENDING");
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      await revokeRefundedAiCredits({ chargeId: charge.id, refundedCents: charge.amount_refunded, totalCents: charge.amount });
      await handleReferralRefund(charge);
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
