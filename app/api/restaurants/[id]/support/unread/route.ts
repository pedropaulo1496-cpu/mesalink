import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.accountType !== "RESTAURANT") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const restaurant = await prisma.restaurant.findFirst({
    where: { id, user: { email: session.user.email } },
    select: { userId: true },
  });
  if (!restaurant?.userId) return NextResponse.json({ count: 0 });
  const conversation = await prisma.supportConversation.findUnique({
    where: { clientUserId: restaurant.userId },
    select: { id: true },
  });
  if (!conversation) return NextResponse.json({ count: 0 });
  const count = await prisma.supportMessage.count({
    where: { conversationId: conversation.id, senderRole: "STAFF", readAt: null },
  });
  return NextResponse.json({ count });
}
