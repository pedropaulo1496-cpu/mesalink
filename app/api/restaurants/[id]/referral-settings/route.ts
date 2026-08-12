import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const rawMaximum = body?.maxCommissionPerPerson;
  const maxCommissionPerPerson = rawMaximum === "" || rawMaximum == null ? null : Number(rawMaximum);

  if (maxCommissionPerPerson != null && (!Number.isFinite(maxCommissionPerPerson) || maxCommissionPerPerson <= 0 || maxCommissionPerPerson > 1000)) {
    return NextResponse.json({ error: "Define um limite válido por pessoa ou deixa o campo vazio." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const updated = await prisma.restaurant.updateMany({
    where: { id, userId: user.id },
    data: {
      referralNetworkEnabled: true,
      referralMaxCommissionPerPerson: maxCommissionPerPerson,
    },
  });

  if (updated.count === 0) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });
  return NextResponse.json({ success: true });
}
