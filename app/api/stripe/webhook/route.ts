import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Stripe from "stripe";

type Product = "ESSENTIALS" | "GROWTH";

function getPriceMonthly(product: Product) {
  return product === "GROWTH" ? 99 : 79;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) return new Response("No signature", { status: 400 });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error(err);
    return new Response("Webhook Error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const kind = session.metadata?.kind;

    if (kind === "REFERRAL_COMMISSION") {
      const referralPaymentId = session.metadata?.referralPaymentId;
      if (!referralPaymentId) return new Response("Missing referral metadata", { status: 400 });

      const payment = await prisma.referralPayment.findUnique({
        where: { id: referralPaymentId },
        include: { partner: true, group: true },
      });

      if (!payment) return new Response("Referral payment not found", { status: 404 });

      if (!payment.stripeTransferId) {
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;
        const paymentIntent = paymentIntentId
          ? await stripe.paymentIntents.retrieve(paymentIntentId)
          : null;
        const chargeId =
          typeof paymentIntent?.latest_charge === "string"
            ? paymentIntent.latest_charge
            : paymentIntent?.latest_charge?.id;

        if (payment.partner.stripeAccountId && payment.partner.stripeOnboardingComplete) {
          const transfer = await stripe.transfers.create(
            {
              amount: Math.round(Number(payment.partnerNet) * 100),
              currency: payment.currency.toLowerCase(),
              destination: payment.partner.stripeAccountId,
              transfer_group: `REFERRAL_${payment.groupId}`,
              ...(chargeId ? { source_transaction: chargeId } : {}),
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
                stripePaymentIntentId: paymentIntentId,
                stripeTransferId: transfer.id,
                paidAt: new Date(),
                transferredAt: new Date(),
              },
            }),
            prisma.referralGroup.update({ where: { id: payment.groupId }, data: { status: "PAID" } }),
          ]);
        } else {
          await prisma.referralPayment.update({
            where: { id: payment.id },
            data: {
              status: "PAID",
              stripePaymentIntentId: paymentIntentId,
              paidAt: new Date(),
            },
          });
        }
      }

      return new Response("OK");
    }

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

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    const complete = Boolean(account.details_submitted && account.payouts_enabled);

    await prisma.referralPartner.updateMany({
      where: { stripeAccountId: account.id },
      data: {
        stripeOnboardingComplete: complete,
        ...(complete ? { status: "ACTIVE" } : {}),
      },
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const stripeSubscription = event.data.object as Stripe.Subscription;
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: stripeSubscription.id },
      data: { status: "CANCELED" },
    });
  }

  return new Response("OK");
}
