import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { MESALINK_REFERRAL_FEE_PERCENT, isCommissionType } from "@/lib/referrals";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const partnerEmail = typeof body?.partnerEmail === "string" ? body.partnerEmail.trim().toLowerCase() : "";
  const commissionType = isCommissionType(body?.commissionType) ? body.commissionType : null;
  const commissionAmount = Number(body?.commissionAmount);

  if (!partnerEmail || !commissionType || !Number.isFinite(commissionAmount) || commissionAmount <= 0 || commissionAmount > 1000) {
    return NextResponse.json({ error: "Revê o parceiro e a comissão." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  const [restaurant, partner] = await Promise.all([
    user ? prisma.restaurant.findFirst({ where: { id, userId: user.id }, select: { id: true } }) : null,
    prisma.referralPartner.findUnique({ where: { email: partnerEmail }, select: { id: true, businessName: true, email: true } }),
  ]);

  if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });
  if (!partner) return NextResponse.json({ error: "Este parceiro ainda não tem conta MesaLink Partners." }, { status: 404 });

  const agreement = await prisma.referralAgreement.upsert({
    where: { partnerId_restaurantId: { partnerId: partner.id, restaurantId: id } },
    update: { commissionType, commissionAmount, platformFeePercent: MESALINK_REFERRAL_FEE_PERCENT, active: true, endsAt: null },
    create: { partnerId: partner.id, restaurantId: id, commissionType, commissionAmount, platformFeePercent: MESALINK_REFERRAL_FEE_PERCENT },
  });

  return NextResponse.json({ success: true, agreementId: agreement.id, partner: { businessName: partner.businessName, email: partner.email } });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const agreementId = typeof body?.agreementId === "string" ? body.agreementId : "";
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user || !agreementId) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  const updated = await prisma.referralAgreement.updateMany({
    where: { id: agreementId, restaurantId: id, restaurant: { userId: user.id } },
    data: { active: false, endsAt: new Date() },
  });
  if (updated.count === 0) return NextResponse.json({ error: "Exceção não encontrada." }, { status: 404 });
  return NextResponse.json({ success: true });
}
