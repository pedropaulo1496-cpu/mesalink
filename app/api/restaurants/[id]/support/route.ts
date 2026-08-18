import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { notifyClientMessage } from "@/lib/hq-notifications";
import { prisma } from "@/lib/prisma";

async function getClient(restaurantId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.accountType !== "RESTAURANT") return null;
  return prisma.restaurant.findFirst({
    where: { id: restaurantId, user: { email: session.user.email } },
    select: {
      id: true,
      name: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          salesRepresentative: { select: { id: true, name: true, active: true, userId: true } },
        },
      },
    },
  });
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const client = await getClient(id);
  if (!client) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const conversation = await prisma.supportConversation.findUnique({
    where: { clientUserId: client.user.id },
    include: {
      messages: { include: { senderUser: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" }, take: 300 },
    },
  });
  if (conversation) {
    const now = new Date();
    await prisma.$transaction([
      prisma.supportMessage.updateMany({ where: { conversationId: conversation.id, senderRole: "STAFF", readAt: null }, data: { readAt: now } }),
      prisma.supportConversation.update({ where: { id: conversation.id }, data: { clientReadAt: now } }),
    ]);
  }
  return NextResponse.json({
    recipient: client.user.salesRepresentative?.active ? client.user.salesRepresentative.name : "Equipa MesaLink",
    escalated: Boolean(conversation?.escalatedAt),
    messages: conversation?.messages.map((message) => ({
      id: message.id,
      body: message.body,
      senderRole: message.senderRole,
      senderName: message.senderRole === "CLIENT" ? (client.user.name || "Tu") : (message.senderUser.name || "MesaLink"),
      createdAt: message.createdAt,
      readAt: message.readAt,
    })) || [],
  });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const client = await getClient(id);
  if (!client) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const payload = await request.json().catch(() => null);
  const body = String(payload?.body || "").trim().slice(0, 2000);
  if (!body) return NextResponse.json({ error: "Escreve uma mensagem." }, { status: 400 });
  const now = new Date();
  const rep = client.user.salesRepresentative?.active ? client.user.salesRepresentative : null;
  const conversation = await prisma.supportConversation.upsert({
    where: { clientUserId: client.user.id },
    create: {
      clientUserId: client.user.id,
      restaurantId: client.id,
      salesRepresentativeId: rep?.id || null,
      lastMessageAt: now,
      lastClientMessageAt: now,
      staffReadAt: null,
      messages: { create: { senderUserId: client.user.id, senderRole: "CLIENT", body } },
    },
    update: {
      restaurantId: client.id,
      salesRepresentativeId: rep?.id || null,
      lastMessageAt: now,
      lastClientMessageAt: now,
      escalatedAt: null,
      staffReadAt: null,
      messages: { create: { senderUserId: client.user.id, senderRole: "CLIENT", body } },
    },
  });
  await notifyClientMessage({
    conversationId: conversation.id,
    clientName: client.user.name || client.name || client.user.email,
    preview: body.slice(0, 120),
    salesRepresentativeUserId: rep?.userId || null,
  }).catch((error) => console.error("Client message push failed", error));
  return NextResponse.json({ success: true });
}
