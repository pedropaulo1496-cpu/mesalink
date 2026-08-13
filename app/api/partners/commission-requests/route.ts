import { NextResponse } from "next/server";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { prisma } from "@/lib/prisma";
import { isCommissionType, MESALINK_REFERRAL_FEE_PERCENT } from "@/lib/referrals";

export async function POST(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const restaurantId = typeof body?.restaurantId === "string" ? body.restaurantId : "";
  const commissionType = isCommissionType(body?.commissionType) ? body.commissionType : null;
  const commissionAmount = Number(body?.commissionAmount);
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 300) : "";
  if (!restaurantId || !commissionType || !Number.isFinite(commissionAmount) || commissionAmount < 0.5 || commissionAmount > 1000) {
    return NextResponse.json({ error: "Revê o valor proposto." }, { status: 400 });
  }
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, userId: { not: null } },
    select: { id: true },
  });
  if (!restaurant) return NextResponse.json({ error: "Este restaurante não está disponível para negociação." }, { status: 404 });

  const pending = await prisma.referralCommissionRequest.findFirst({
    where: { partnerId: partner.id, restaurantId, status: "PENDING" },
    select: { id: true, initiator: true },
  });
  if (pending?.initiator === "RESTAURANT") {
    return NextResponse.json({ error: "O restaurante enviou-te uma proposta. Aceita ou recusa essa proposta antes de enviares outra." }, { status: 409 });
  }
  const row = pending
    ? await prisma.referralCommissionRequest.update({ where: { id: pending.id }, data: { commissionType, commissionAmount, message: message || null, initiator: "PARTNER", respondedAt: null } })
    : await prisma.referralCommissionRequest.create({ data: { partnerId: partner.id, restaurantId, commissionType, commissionAmount, message: message || null, initiator: "PARTNER" } });
  return NextResponse.json({ success: true, requestId: row.id, status: row.status });
}

export async function PATCH(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const requestId = typeof body?.requestId === "string" ? body.requestId : "";
  const action = body?.action === "ACCEPT" || body?.action === "REJECT" ? body.action : null;
  if (!requestId || !action) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  const commissionRequest = await prisma.referralCommissionRequest.findFirst({
    where: { id: requestId, partnerId: partner.id, initiator: "RESTAURANT", status: "PENDING" },
  });
  if (!commissionRequest) return NextResponse.json({ error: "A proposta já foi tratada ou não foi encontrada." }, { status: 404 });

  const status = action === "ACCEPT" ? "ACCEPTED" : "REJECTED";
  await prisma.$transaction(async (tx) => {
    await tx.referralCommissionRequest.update({
      where: { id: requestId },
      data: { status, respondedAt: new Date() },
    });
    if (action === "ACCEPT") {
      await tx.referralAgreement.upsert({
        where: { partnerId_restaurantId: { partnerId: partner.id, restaurantId: commissionRequest.restaurantId } },
        update: {
          commissionType: commissionRequest.commissionType,
          commissionAmount: commissionRequest.commissionAmount,
          platformFeePercent: MESALINK_REFERRAL_FEE_PERCENT,
          active: true,
          endsAt: null,
        },
        create: {
          partnerId: partner.id,
          restaurantId: commissionRequest.restaurantId,
          commissionType: commissionRequest.commissionType,
          commissionAmount: commissionRequest.commissionAmount,
          platformFeePercent: MESALINK_REFERRAL_FEE_PERCENT,
        },
      });
    }
  });

  return NextResponse.json({
    success: true,
    status,
    commissionType: commissionRequest.commissionType,
    commissionAmount: Number(commissionRequest.commissionAmount),
  });
}
