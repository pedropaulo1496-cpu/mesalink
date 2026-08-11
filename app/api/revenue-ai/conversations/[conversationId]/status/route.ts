import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasGrowthAccess } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";

const statuses = new Set(["NEW", "NEEDS_HUMAN", "WAITING_CUSTOMER", "BOOKED", "RECOVERED", "LOST", "ARCHIVED"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!user) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
  if (!hasGrowthAccess(user.subscription)) return NextResponse.json({ error: "O Revenue AI está disponível no plano Growth." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const status = statuses.has(body?.status) ? String(body.status) : "";
  const recoveredRevenue = body?.recoveredRevenue === "" || body?.recoveredRevenue == null ? null : Number(body.recoveredRevenue);
  if (!status || (recoveredRevenue != null && (!Number.isFinite(recoveredRevenue) || recoveredRevenue < 0 || recoveredRevenue > 100000))) {
    return NextResponse.json({ error: "Estado ou valor inválido." }, { status: 400 });
  }

  const conversation = await prisma.revenueConversation.findFirst({ where: { id: conversationId, restaurant: { userId: user.id } } });
  if (!conversation) return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
  await prisma.revenueConversation.update({
    where: { id: conversationId },
    data: {
      status,
      ...(status === "RECOVERED" ? { recoveredRevenue: recoveredRevenue ?? conversation.estimatedRevenue, recoveredAt: new Date(), nextFollowUpAt: null } : {}),
      ...(status === "LOST" || status === "ARCHIVED" ? { nextFollowUpAt: null } : {}),
    },
  });
  return NextResponse.json({ success: true });
}
