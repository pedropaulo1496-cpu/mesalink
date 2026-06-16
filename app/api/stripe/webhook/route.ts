import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();

  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error(err);
    return new Response("Webhook Error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.userId;
    const product = session.metadata?.product;

    if (!userId) {
      return new Response("Missing userId", { status: 400 });
    }

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: product === "PRO" ? "PRO" : "FREE",
        status: "ACTIVE",
        trialEndsAt: null,
        restaurantLimit: 1,
        priceMonthly: product === "PRO" ? 10 : 0,
        websiteAddon: product === "WEBSITE",
        qrOrderingAddon: product === "QR_ORDERING",
        stripeCustomerId: session.customer?.toString(),
        stripeProSubscriptionId:
          product === "PRO" ? session.subscription?.toString() : undefined,
        stripeWebsiteSubscriptionId:
          product === "WEBSITE" ? session.subscription?.toString() : undefined,
        stripeQrOrderingSubscriptionId:
          product === "QR_ORDERING"
            ? session.subscription?.toString()
            : undefined,
      },
      update: {
        status: "ACTIVE",
        trialEndsAt: null,
        stripeCustomerId: session.customer?.toString(),

        ...(product === "PRO"
          ? {
              plan: "PRO",
              priceMonthly: 10,
              stripeProSubscriptionId: session.subscription?.toString(),
            }
          : {}),

        ...(product === "WEBSITE"
          ? {
              websiteAddon: true,
              stripeWebsiteSubscriptionId: session.subscription?.toString(),
            }
          : {}),

        ...(product === "QR_ORDERING"
          ? {
              qrOrderingAddon: true,
              stripeQrOrderingSubscriptionId: session.subscription?.toString(),
            }
          : {}),
      },
    });
  }

  return new Response("OK");
}