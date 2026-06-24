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

  if (event.type === "customer.subscription.deleted") {
    const stripeSubscription = event.data.object as Stripe.Subscription;
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: stripeSubscription.id },
      data: { status: "CANCELED" },
    });
  }

  return new Response("OK");
}
