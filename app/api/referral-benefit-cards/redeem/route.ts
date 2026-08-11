import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const restaurantId = typeof body?.restaurantId === "string" ? body.restaurantId : "";
  const publicCode = typeof body?.publicCode === "string" ? body.publicCode.trim().toUpperCase().slice(0, 40) : "";
  if (!restaurantId || !publicCode) return NextResponse.json({ error: "Introduz um código válido." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const card = await prisma.referralBenefitCard.findUnique({
    where: { publicCode },
    include: {
      benefit: { select: { restaurantId: true, title: true, active: true, validFrom: true, validUntil: true, maxRedemptions: true, redemptions: true } },
    },
  });
  const restaurant = await prisma.restaurant.findFirst({ where: { id: restaurantId, userId: user.id }, select: { id: true } });
  if (!restaurant || !card || card.benefit.restaurantId !== restaurant.id) {
    return NextResponse.json({ error: "Cartão não encontrado para este restaurante." }, { status: 404 });
  }

  const now = new Date();
  const unavailable = !card.benefit.active ||
    card.status !== "ACTIVE" ||
    card.benefit.validFrom > now ||
    (card.expiresAt != null && card.expiresAt <= now) ||
    (card.benefit.validUntil != null && card.benefit.validUntil <= now) ||
    (card.benefit.maxRedemptions != null && card.benefit.redemptions >= card.benefit.maxRedemptions);
  if (unavailable) return NextResponse.json({ error: card.status === "REDEEMED" ? "Este cartão já foi utilizado." : "Este cartão expirou ou já não está ativo." }, { status: 409 });

  const redeemed = await prisma.$transaction(async (tx) => {
    const updated = await tx.referralBenefitCard.updateMany({
      where: { id: card.id, status: "ACTIVE" },
      data: { status: "REDEEMED", redeemedAt: now },
    });
    if (!updated.count) return false;
    await tx.referralBenefit.update({ where: { id: card.benefitId }, data: { redemptions: { increment: 1 } } });
    return true;
  });

  if (!redeemed) return NextResponse.json({ error: "Este cartão já foi utilizado." }, { status: 409 });

  return NextResponse.json({ success: true, title: card.benefit.title, guestCount: card.guestCount });
}
