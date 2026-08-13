import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasAppAccess } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ benefitId: string }> }) {
  const { benefitId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (typeof body?.active !== "boolean") return NextResponse.json({ error: "Estado inválido." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!hasAppAccess(user.subscription)) return NextResponse.json({ error: "É necessário um plano MesaLink ativo." }, { status: 403 });

  const result = await prisma.referralBenefit.updateMany({
    where: { id: benefitId, restaurant: { userId: user.id } },
    data: { active: body.active },
  });

  if (!result.count) return NextResponse.json({ error: "Benefício não encontrado." }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ benefitId: string }> }) {
  const { benefitId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!hasAppAccess(user.subscription)) return NextResponse.json({ error: "É necessário um plano MesaLink ativo." }, { status: 403 });

  const benefit = await prisma.referralBenefit.findFirst({ where: { id: benefitId, restaurant: { userId: user.id } }, select: { id: true } });
  if (!benefit) return NextResponse.json({ error: "Cartão não encontrado." }, { status: 404 });

  await prisma.referralBenefit.delete({ where: { id: benefit.id } });
  return NextResponse.json({ success: true });
}
