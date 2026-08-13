import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  calculateDomainPrice,
  DOMAIN_QUOTE_TTL_MS,
  getUsdToEurRate,
  normalizeCustomDomain,
  providerUsdToEurCents,
} from "@/lib/domain-billing";
import { parseDomainRegistrant } from "@/lib/domain-orders";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { isVercelDomainServiceConfigured, quoteVercelDomain } from "@/lib/vercel-domains";
import { Prisma } from "@prisma/client";
import { MESALINK_SERVICE_TAX_CODE } from "@/lib/stripe-tax";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Precisa de iniciar sessão." }, { status: 401 });
  if (!isVercelDomainServiceConfigured()) {
    return NextResponse.json({ error: "A ligação central de domínios ainda não está configurada." }, { status: 503 });
  }

  let orderId: string | null = null;
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const kind = body.kind === "CONNECT" ? "CONNECT" : "PURCHASE";
    const domain = normalizeCustomDomain(body.domain);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true },
    });
    if (!user) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
    const restaurant = await prisma.restaurant.findFirst({
      where: { id, userId: user.id },
      select: { id: true, name: true },
    });
    if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });

    const conflict = await prisma.restaurant.findFirst({
      where: { customDomain: domain, id: { not: id } },
      select: { id: true },
    });
    if (conflict) return NextResponse.json({ error: "Este domínio já está ligado a outro restaurante." }, { status: 409 });

    const registrant = kind === "PURCHASE" ? parseDomainRegistrant(body.registrant) : null;
    let providerPrice = 0;
    let renewalPrice: number | null = null;
    let exchangeRate = 1;
    if (kind === "PURCHASE") {
      const provider = await quoteVercelDomain(domain);
      if (!provider.available) {
        return NextResponse.json({ error: "O domínio já não está disponível. Não foi efetuada qualquer cobrança." }, { status: 409 });
      }
      providerPrice = provider.purchasePrice;
      renewalPrice = provider.renewalPrice;
      exchangeRate = await getUsdToEurRate();
    }
    const pricing = calculateDomainPrice(providerUsdToEurCents(providerPrice, exchangeRate));
    const order = await prisma.domainOrder.create({
      data: {
        restaurantId: id,
        domain,
        kind,
        status: "CHECKOUT_PENDING",
        providerPrice,
        renewalPrice,
        exchangeRate,
        ...pricing,
        quoteExpiresAt: new Date(Date.now() + DOMAIN_QUOTE_TTL_MS),
        ...(registrant ? { registrant: registrant as Prisma.InputJsonValue } : {}),
      },
    });
    orderId = order.id;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.mesalink.pt";
    const subscription = user.subscription;
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      ...(subscription?.stripeCustomerId
        ? { customer: subscription.stripeCustomerId, customer_update: { address: "auto" as const, name: "auto" as const } }
        : { customer_email: user.email, customer_creation: "always" as const }),
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: pricing.totalCents,
          tax_behavior: "exclusive",
          product_data: {
            name: kind === "PURCHASE" ? `Domínio ${domain} · 1 ano` : `Ligação do domínio ${domain}`,
            description: `Custo do domínio + 5% + €1 + processamento Stripe. ${kind === "PURCHASE" ? "Renovação não automática." : "Domínio já pertencente ao cliente."}`,
            tax_code: MESALINK_SERVICE_TAX_CODE,
          },
        },
      }],
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      automatic_tax: { enabled: true },
      invoice_creation: { enabled: true },
      metadata: {
        kind: "CUSTOM_DOMAIN",
        domainOrderId: order.id,
        restaurantId: id,
        userId: user.id,
      },
      payment_intent_data: {
        metadata: {
          kind: "CUSTOM_DOMAIN",
          domainOrderId: order.id,
          restaurantId: id,
        },
      },
      success_url: `${baseUrl}/restaurants/${id}/website?domain=success&order=${order.id}`,
      cancel_url: `${baseUrl}/restaurants/${id}/website?domain=cancelled&order=${order.id}`,
    });
    if (!checkout.url) throw new Error("O Stripe não devolveu um endereço de pagamento.");
    await prisma.domainOrder.update({
      where: { id: order.id },
      data: { stripeCheckoutSessionId: checkout.id },
    });
    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("Domain checkout failed", error);
    if (orderId) {
      await prisma.domainOrder.update({
        where: { id: orderId },
        data: { status: "FAILED", failureReason: error instanceof Error ? error.message.slice(0, 500) : "Checkout failed" },
      }).catch(() => undefined);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível abrir o pagamento." },
      { status: 400 },
    );
  }
}
