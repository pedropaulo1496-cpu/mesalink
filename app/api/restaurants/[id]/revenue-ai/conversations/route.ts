import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasGrowthAccess } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!user) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
  if (!hasGrowthAccess(user.subscription)) return NextResponse.json({ error: "O Revenue AI está disponível no plano Growth." }, { status: 403 });
  const restaurant = await prisma.restaurant.findFirst({
    where: { id, userId: user.id },
    include: {
      revenueConversations: {
        orderBy: { lastMessageAt: "desc" },
        take: 200,
        include: { messages: { orderBy: { createdAt: "asc" }, take: 30 }, customer: { select: { marketingOptIn: true } } },
      },
    },
  });
  if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });

  const conversations = restaurant.revenueConversations.map((conversation) => ({
    id: conversation.id,
    opportunityType: conversation.opportunityType,
    channel: conversation.channel,
    status: conversation.status,
    contactName: conversation.contactName,
    contactEmail: conversation.contactEmail,
    contactPhone: conversation.contactPhone,
    lastMessagePreview: conversation.lastMessagePreview,
    aiSummary: conversation.aiSummary,
    nextFollowUpAt: conversation.nextFollowUpAt?.toISOString() || null,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    estimatedRevenue: Number(conversation.estimatedRevenue || 0),
    recoveredRevenue: Number(conversation.recoveredRevenue || 0),
    marketingOptIn: Boolean(conversation.customer?.marketingOptIn),
    messages: conversation.messages.map((message) => ({
      id: message.id,
      direction: message.direction,
      sender: message.sender,
      channel: message.channel,
      content: message.content,
      status: message.status,
      sentAt: message.sentAt?.toISOString() || null,
      deliveredAt: message.deliveredAt?.toISOString() || null,
      readAt: message.readAt?.toISOString() || null,
      createdAt: message.createdAt.toISOString(),
    })),
  }));
  return NextResponse.json({ conversations, creditsRemaining: user.subscription?.aiCredits || 0, emailsRemaining: user.subscription?.emailBalance || 0 });
}
