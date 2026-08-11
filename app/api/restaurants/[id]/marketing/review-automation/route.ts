import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (typeof body?.enabled !== "boolean") return NextResponse.json({ error: "Estado inválido." }, { status: 400 });

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, user: { email: session.user.email } },
    select: { id: true },
  });
  if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });

  const updated = await prisma.restaurant.update({
    where: { id },
    data: { reviewAutomationEnabled: body.enabled, reviewDelayHours: 12 },
    select: { reviewAutomationEnabled: true, reviewDelayHours: true },
  });
  return NextResponse.json({ success: true, enabled: updated.reviewAutomationEnabled, delayHours: updated.reviewDelayHours });
}
