import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Precisa de iniciar sessão." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilizador não encontrado." },
        { status: 404 }
      );
    }

    const subscription =
      user.subscription ??
      (await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: "STARTER",
          status: "TRIAL",
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          restaurantLimit: 1,
          priceMonthly: 1750,
        },
      }));

    const { billing } = await request.json();

    const priceId =
      billing === "yearly"
        ? process.env.STRIPE_PRICE_STARTER_YEARLY
        : process.env.STRIPE_PRICE_STARTER_MONTHLY;

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID em falta no .env." },
        { status: 400 }
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        userId: user.id,
        subscriptionId: subscription.id,
        plan: "STARTER",
        billing,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          subscriptionId: subscription.id,
          plan: "STARTER",
          billing,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("STRIPE_CHECKOUT_ERROR:", error);

    return NextResponse.json(
      { error: "Erro ao criar checkout." },
      { status: 500 }
    );
  }
}