import { NextResponse } from "next/server";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { prisma } from "@/lib/prisma";
import { isCommissionType } from "@/lib/referrals";

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
    where: { id: restaurantId, referralNetworkEnabled: true, referralAutoAcceptEnabled: true },
    select: { id: true },
  });
  if (!restaurant) return NextResponse.json({ error: "Este restaurante não está disponível para negociação." }, { status: 404 });

  const pending = await prisma.referralCommissionRequest.findFirst({
    where: { partnerId: partner.id, restaurantId, status: "PENDING" },
    select: { id: true },
  });
  const row = pending
    ? await prisma.referralCommissionRequest.update({ where: { id: pending.id }, data: { commissionType, commissionAmount, message: message || null } })
    : await prisma.referralCommissionRequest.create({ data: { partnerId: partner.id, restaurantId, commissionType, commissionAmount, message: message || null } });
  return NextResponse.json({ success: true, requestId: row.id, status: row.status });
}
