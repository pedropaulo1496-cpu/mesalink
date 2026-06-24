import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type Product = "ESSENTIALS" | "GROWTH";
type Billing = "MONTHLY" | "YEARLY";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Precisa de iniciar sessão." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const product: Product = body.product === "GROWTH" ? "GROWTH" : "ESSENTIALS";
    const billing: Billing = body.billing === "YEARLY" ? "YEARLY" : "MONTHLY";

    const subscription =
      user.subscription ??
      (await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: "ESSENTIALS",
          status: "TRIAL",
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          restaurantLimit: 1,
          priceMonthly: 0,
        },
      }));

    const priceMap: Record<Product, Record<Billing, string | undefined>> = {
      ESSENTIALS: {
        MONTHLY: process.env.STRIPE_PRICE_ESSENTIALS_MONTHLY,
        YEARLY: process.env.STRIPE_PRICE_ESSENTIALS_YEARLY,
      },
      GROWTH: {
        MONTHLY: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
        YEARLY: process.env.STRIPE_PRICE_GROWTH_YEARLY,
      },
    };

    const priceId = priceMap[product][billing];

    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID em falta no .env para ${product}_${billing}.` },
        { status: 400 },
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: { userId: user.id, subscriptionId: subscription.id, product, billing },
      subscription_data: { metadata: { userId: user.id, subscriptionId: subscription.id, product, billing } },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?product=${product}&billing=${billing}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("STRIPE_CHECKOUT_ERROR:", error);
    return NextResponse.json({ error: "Erro ao criar checkout." }, { status: 500 });
  }
}
