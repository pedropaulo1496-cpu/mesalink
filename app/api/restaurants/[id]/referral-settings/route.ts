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
  const commissionType = isCommissionType(body?.commissionType) ? body.commissionType : null;
  const commissionAmount = Number(body?.commissionAmount);

  if (!commissionType || !Number.isFinite(commissionAmount) || commissionAmount <= 0 || commissionAmount > 1000) {
    return NextResponse.json({ error: "Comissão inválida." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const updated = await prisma.restaurant.updateMany({
    where: { id, userId: user.id },
    data: {
      referralNetworkEnabled: Boolean(body?.enabled),
      referralDefaultCommissionType: commissionType,
      referralDefaultCommissionAmount: commissionAmount,
    },
  });

  if (updated.count === 0) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });
  return NextResponse.json({ success: true });
}
