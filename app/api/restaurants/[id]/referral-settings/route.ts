import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCommissionType } from "@/lib/referrals";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const commissionType = isCommissionType(body?.commissionType) ? body.commissionType : null;
  const commissionAmount = Number(body?.commissionAmount);
  const defaultDailyCapacity = Number(body?.defaultDailyCapacity);
  const autoAcceptEnabled = body?.autoAcceptEnabled === true;
  if (!commissionType || !Number.isFinite(commissionAmount) || commissionAmount <= 0 || commissionAmount > 1000) {
    return NextResponse.json({ error: "Define uma comissão válida." }, { status: 400 });
  }
  if (!Number.isInteger(defaultDailyCapacity) || defaultDailyCapacity < 0 || defaultDailyCapacity > 2000) {
    return NextResponse.json({ error: "Define uma capacidade diária válida." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, userId: user.id },
    select: { referralPaymentMethodId: true },
  });
  if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });
  if (autoAcceptEnabled && !restaurant.referralPaymentMethodId) {
    return NextResponse.json({ error: "Valida primeiro o cartão usado para garantir as comissões." }, { status: 409 });
  }

  const updated = await prisma.restaurant.updateMany({
    where: { id, userId: user.id },
    data: {
      referralNetworkEnabled: true,
      referralDefaultCommissionType: commissionType,
      referralDefaultCommissionAmount: commissionAmount,
      referralDefaultDailyCapacity: defaultDailyCapacity,
      referralAutoAcceptEnabled: autoAcceptEnabled,
    },
  });

  if (updated.count === 0) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });
  return NextResponse.json({ success: true });
}
