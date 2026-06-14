import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type Product = "PRO" | "WEBSITE";

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

    const body = await request.json().catch(() => ({}));

    const product: Product =
      body.product === "WEBSITE" ? "WEBSITE" : "PRO";

    const subscription =
      user.subscription ??
      (await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: "FREE",
          status: "TRIAL",
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          restaurantLimit: 1,
          priceMonthly: 0,
          websiteAddon: false,
        },
      }));

    const priceId =
      product === "WEBSITE"
        ? process.env.STRIPE_PRICE_WEBSITE_MONTHLY
        : process.env.STRIPE_PRICE_PRO_MONTHLY;

    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID em falta no .env para ${product}.` },
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
        product,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          subscriptionId: subscription.id,
          product,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?product=${product}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
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