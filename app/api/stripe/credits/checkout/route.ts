import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getAiCreditPack } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Precisa de iniciar sessão." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const pack = getAiCreditPack(body?.packId);
  if (!pack) return NextResponse.json({ error: "Pack de créditos inválido." }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { subscription: true },
  });
  if (!user) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });

  const subscription = user.subscription || await prisma.subscription.create({
    data: {
      userId: user.id,
      plan: "ESSENTIALS",
      status: "TRIAL",
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      restaurantLimit: 1,
      priceMonthly: 0,
    },
  });
  const subscriptionActive = subscription.status === "ACTIVE" && ["ESSENTIALS", "GROWTH"].includes(String(subscription.plan).toUpperCase());
  const trialActive = subscription.status === "TRIAL" && Boolean(subscription.trialEndsAt && subscription.trialEndsAt > new Date());
  if (!subscriptionActive && !trialActive) {
    return NextResponse.json({ error: "Escolhe primeiro um plano MesaLink ativo." }, { status: 403 });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.mesalink.pt";
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      ...(subscription.stripeCustomerId
        ? { customer: subscription.stripeCustomerId }
        : { customer_email: user.email, customer_creation: "always" as const }),
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: pack.priceCents,
          product_data: {
            name: `MesaLink AI · ${pack.label}`,
            description: "Saldo pré-pago para AI Visibility, Revenue AI e conteúdo do website.",
          },
        },
      }],
      billing_address_collection: "required",
      automatic_tax: { enabled: true },
      invoice_creation: { enabled: true },
      metadata: { kind: "AI_CREDITS", userId: user.id, packId: pack.id },
      payment_intent_data: { metadata: { kind: "AI_CREDITS", userId: user.id, packId: pack.id } },
      success_url: `${baseUrl}/billing?credits=success`,
      cancel_url: `${baseUrl}/billing?credits=cancelled`,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("AI credit checkout failed", error);
    return NextResponse.json({ error: "Não foi possível abrir o pagamento dos créditos." }, { status: 502 });
  }
}
