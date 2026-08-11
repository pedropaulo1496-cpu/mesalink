import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBenefitCardCode } from "@/lib/referrals";

export async function POST(request: Request, { params }: { params: Promise<{ benefitId: string }> }) {
  const { benefitId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const guestCount = Number(body?.guestCount || 1);
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 100) {
    return NextResponse.json({ error: "Número de pessoas inválido." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { referralPartner: { select: { id: true, status: true } } },
  });
  const partner = user?.referralPartner;
  if (!partner) return NextResponse.json({ error: "Perfil de parceiro não encontrado." }, { status: 403 });

  const now = new Date();
  const benefit = await prisma.referralBenefit.findFirst({
    where: {
      id: benefitId,
      active: true,
      validFrom: { lte: now },
      OR: [{ validUntil: null }, { validUntil: { gt: now } }],
      restaurant: { referralNetworkEnabled: true },
    },
    select: { id: true, validUntil: true, maxRedemptions: true, redemptions: true },
  });

  if (!benefit || (benefit.maxRedemptions != null && benefit.redemptions >= benefit.maxRedemptions)) {
    return NextResponse.json({ error: "Este benefício já não está disponível." }, { status: 409 });
  }

  const card = await prisma.referralBenefitCard.create({
    data: {
      publicCode: createBenefitCardCode(),
      benefitId: benefit.id,
      partnerId: partner.id,
      guestCount,
      expiresAt: benefit.validUntil,
    },
    select: { publicCode: true },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  return NextResponse.json({
    success: true,
    publicCode: card.publicCode,
    cardUrl: `${baseUrl.replace(/\/$/, "")}/partners/cards/${card.publicCode}`,
  });
}
