import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { subscription: true },
  });

  const subscription = user?.subscription;

  if (!user || !subscription) {
    return NextResponse.json(
      { error: "Subscrição não encontrada." },
      { status: 404 },
    );
  }

  const currentPlan = String(subscription.plan || "").toUpperCase();

  if (currentPlan === "GROWTH") {
    return NextResponse.json({ success: true });
  }

  if (currentPlan !== "ESSENTIALS") {
    return NextResponse.json(
      { error: "Só é possível fazer upgrade a partir do Essentials." },
      { status: 400 },
    );
  }

  if (!subscription.stripeSubscriptionId) {
    return NextResponse.json(
      {
        error:
          "Esta conta foi ativada manualmente e ainda não tem subscrição Stripe para fazer upgrade.",
      },
      { status: 400 },
    );
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.stripeSubscriptionId,
  );

  const currentItem = stripeSubscription.items.data[0];

  if (!currentItem) {
    return NextResponse.json(
      { error: "Item da subscrição Stripe não encontrado." },
      { status: 400 },
    );
  }

  const isYearly = currentItem.price.recurring?.interval === "year";

  const growthPriceId = isYearly
    ? process.env.STRIPE_PRICE_GROWTH_YEARLY
    : process.env.STRIPE_PRICE_GROWTH_MONTHLY;

  if (!growthPriceId) {
    return NextResponse.json(
      { error: "Price ID Growth em falta no .env." },
      { status: 400 },
    );
  }

  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    items: [
      {
        id: currentItem.id,
        price: growthPriceId,
      },
    ],
    proration_behavior: "always_invoice",
    metadata: {
      userId: user.id,
      product: "GROWTH",
    },
  });

  await prisma.subscription.update({
    where: { userId: user.id },
    data: {
      plan: "GROWTH",
      priceMonthly: 99,
    },
  });

  return NextResponse.json({ success: true });
}
