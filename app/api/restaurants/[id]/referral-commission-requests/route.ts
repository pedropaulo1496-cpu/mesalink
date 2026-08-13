import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { MESALINK_REFERRAL_FEE_PERCENT } from "@/lib/referrals";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const requestId = typeof body?.requestId === "string" ? body.requestId : "";
  const action = body?.action === "ACCEPT" || body?.action === "REJECT" ? body.action : null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user || !requestId || !action) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  const commissionRequest = await prisma.referralCommissionRequest.findFirst({
    where: { id: requestId, restaurantId: id, status: "PENDING", restaurant: { userId: user.id } },
  });
  if (!commissionRequest) return NextResponse.json({ error: "Pedido já tratado ou não encontrado." }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.referralCommissionRequest.update({
      where: { id: requestId },
      data: { status: action === "ACCEPT" ? "ACCEPTED" : "REJECTED", respondedAt: new Date() },
    });
    if (action === "ACCEPT") {
      await tx.referralAgreement.upsert({
        where: { partnerId_restaurantId: { partnerId: commissionRequest.partnerId, restaurantId: id } },
        update: { commissionType: commissionRequest.commissionType, commissionAmount: commissionRequest.commissionAmount, platformFeePercent: MESALINK_REFERRAL_FEE_PERCENT, active: true, endsAt: null },
        create: { partnerId: commissionRequest.partnerId, restaurantId: id, commissionType: commissionRequest.commissionType, commissionAmount: commissionRequest.commissionAmount, platformFeePercent: MESALINK_REFERRAL_FEE_PERCENT },
      });
    }
  });
  return NextResponse.json({ success: true });
}
