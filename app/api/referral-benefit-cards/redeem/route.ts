import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasGrowthAccess } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const restaurantId = typeof body?.restaurantId === "string" ? body.restaurantId : "";
  const publicCode = typeof body?.publicCode === "string" ? body.publicCode.trim().toUpperCase().slice(0, 40) : "";
  if (!restaurantId || !publicCode) return NextResponse.json({ error: "Introduz um código válido." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!hasGrowthAccess(user.subscription)) return NextResponse.json({ error: "Os cartões e promoções estão disponíveis no plano Growth." }, { status: 403 });

  const restaurant = await prisma.restaurant.findFirst({ where: { id: restaurantId, userId: user.id }, select: { id: true } });
  if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const card = await tx.referralBenefitCard.findUnique({
          where: { publicCode },
          include: {
            benefit: { select: { restaurantId: true, title: true, active: true, validFrom: true, validUntil: true, maxRedemptions: true, redemptions: true } },
          },
        });
        if (!card || card.benefit.restaurantId !== restaurant.id) return { status: "NOT_FOUND" as const };

        const now = new Date();
        const unavailable = !card.benefit.active ||
          card.status !== "ACTIVE" ||
          card.benefit.validFrom > now ||
          (card.expiresAt != null && card.expiresAt <= now) ||
          (card.benefit.validUntil != null && card.benefit.validUntil <= now) ||
          (card.benefit.maxRedemptions != null && card.benefit.redemptions >= card.benefit.maxRedemptions);
        if (unavailable) return { status: card.status === "REDEEMED" ? "REDEEMED" as const : "UNAVAILABLE" as const };

        await tx.referralBenefitCard.update({
          where: { id: card.id },
          data: { status: "REDEEMED", redeemedAt: now },
        });
        await tx.referralBenefit.update({
          where: { id: card.benefitId },
          data: { redemptions: { increment: 1 } },
        });
        return { status: "SUCCESS" as const, title: card.benefit.title, guestCount: card.guestCount };
      }, { isolationLevel: "Serializable" });

      if (result.status === "NOT_FOUND") return NextResponse.json({ error: "Cartão não encontrado para este restaurante." }, { status: 404 });
      if (result.status === "REDEEMED") return NextResponse.json({ error: "Este cartão já foi utilizado." }, { status: 409 });
      if (result.status === "UNAVAILABLE") return NextResponse.json({ error: "Este cartão expirou ou já não está ativo." }, { status: 409 });
      return NextResponse.json({ success: true, title: result.title, guestCount: result.guestCount });
    } catch (error) {
      if ((error as { code?: string })?.code === "P2034" && attempt === 0) continue;
      throw error;
    }
  }

  return NextResponse.json({ error: "O cartão está a ser validado. Tenta novamente." }, { status: 409 });
}
