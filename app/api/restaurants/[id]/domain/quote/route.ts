import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  calculateDomainPrice,
  getUsdToEurRate,
  normalizeCustomDomain,
  providerUsdToEurCents,
} from "@/lib/domain-billing";
import { prisma } from "@/lib/prisma";
import { isVercelDomainServiceConfigured, quoteVercelDomain } from "@/lib/vercel-domains";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Precisa de iniciar sessão." }, { status: 401 });
    if (!isVercelDomainServiceConfigured()) {
      return NextResponse.json({ error: "A ligação central de domínios ainda não está configurada." }, { status: 503 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const kind = body.kind === "CONNECT" ? "CONNECT" : "PURCHASE";
    const domain = normalizeCustomDomain(body.domain);
    const restaurant = await prisma.restaurant.findFirst({
      where: { id, user: { email: session.user.email } },
      select: { id: true },
    });
    if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });

    const conflict = await prisma.restaurant.findFirst({
      where: { customDomain: domain, id: { not: id } },
      select: { id: true },
    });
    if (conflict) return NextResponse.json({ error: "Este domínio já está ligado a outro restaurante." }, { status: 409 });

    let providerPrice = 0;
    let renewalPrice: number | null = null;
    let exchangeRate = 1;
    if (kind === "PURCHASE") {
      const provider = await quoteVercelDomain(domain);
      if (!provider.available) {
        return NextResponse.json({ error: "Este domínio não está disponível para compra. Podes ligá-lo se já for teu." }, { status: 409 });
      }
      providerPrice = provider.purchasePrice;
      renewalPrice = provider.renewalPrice;
      exchangeRate = await getUsdToEurRate();
    }

    const pricing = calculateDomainPrice(providerUsdToEurCents(providerPrice, exchangeRate));
    return NextResponse.json({
      domain,
      kind,
      available: true,
      providerPrice,
      renewalPrice,
      exchangeRate,
      quoteExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      pricing,
    });
  } catch (error) {
    console.error("Domain quote failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível consultar o domínio." },
      { status: 400 },
    );
  }
}
