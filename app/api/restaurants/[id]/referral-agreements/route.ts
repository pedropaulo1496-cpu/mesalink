import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { isCommissionType } from "@/lib/referrals";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const partnerId = typeof body?.partnerId === "string" ? body.partnerId.trim() : "";
  const commissionType = isCommissionType(body?.commissionType) ? body.commissionType : null;
  const commissionAmount = Number(body?.commissionAmount);

  if (!partnerId || !commissionType || !Number.isFinite(commissionAmount) || commissionAmount <= 0 || commissionAmount > 1000) {
    return NextResponse.json({ error: "Revê o parceiro e a comissão." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  const [restaurant, partner] = await Promise.all([
    user ? prisma.restaurant.findFirst({ where: { id, userId: user.id }, select: { id: true } }) : null,
    prisma.referralPartner.findUnique({ where: { id: partnerId }, select: { id: true, businessName: true, email: true, partnerCode: true } }),
  ]);

  if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });
  if (!partner) return NextResponse.json({ error: "Este parceiro ainda não tem conta MesaLink Partners." }, { status: 404 });

  const pending = await prisma.referralCommissionRequest.findFirst({
    where: { partnerId: partner.id, restaurantId: id, status: "PENDING" },
    select: { id: true, initiator: true },
  });
  if (pending?.initiator === "PARTNER") {
    return NextResponse.json({ error: "Este parceiro já te enviou uma proposta. Aceita ou recusa essa proposta antes de enviares outra." }, { status: 409 });
  }
  const proposal = pending
    ? await prisma.referralCommissionRequest.update({
        where: { id: pending.id },
        data: { commissionType, commissionAmount, initiator: "RESTAURANT", respondedAt: null },
      })
    : await prisma.referralCommissionRequest.create({
        data: { partnerId: partner.id, restaurantId: id, commissionType, commissionAmount, initiator: "RESTAURANT" },
      });

  return NextResponse.json({ success: true, requestId: proposal.id, status: proposal.status, partner: { businessName: partner.businessName, email: partner.email, partnerCode: partner.partnerCode } });
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
