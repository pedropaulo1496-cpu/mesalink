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

    if (product === "PRO") {
      await prisma.subscription.update({
        where: { userId },
        data: {
          plan: "PRO",
          status: "ACTIVE",
          priceMonthly: 10,
          stripeCustomerId: session.customer?.toString(),
          stripeProSubscriptionId: session.subscription?.toString(),
        },
      });
    }

    if (product === "WEBSITE") {
      await prisma.subscription.update({
        where: { userId },
        data: {
          websiteAddon: true,
          stripeCustomerId: session.customer?.toString(),
          stripeWebsiteSubscriptionId: session.subscription?.toString(),
        },
      });
    }
  }

  return new Response("OK");
}