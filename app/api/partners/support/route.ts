import { NextResponse } from "next/server";
import { notifyPartnerMessage } from "@/lib/hq-notifications";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const conversation = await prisma.supportConversation.findUnique({
    where: { partnerId: partner.id },
    include: { messages: { include: { senderUser: { select: { name: true } } }, orderBy: { createdAt: "asc" }, take: 300 } },
  });
  if (conversation) {
    const now = new Date();
    await prisma.$transaction([
      prisma.supportMessage.updateMany({ where: { conversationId: conversation.id, senderRole: "STAFF", readAt: null }, data: { readAt: now } }),
      prisma.supportConversation.update({ where: { id: conversation.id }, data: { clientReadAt: now } }),
    ]);
  }
  return NextResponse.json({
    recipient: "Equipa MesaLink",
    messages: conversation?.messages.map((message) => ({
      id: message.id,
      body: message.body,
      senderRole: message.senderRole,
      senderName: message.senderRole === "PARTNER" ? (partner.contactName || partner.businessName) : (message.senderUser.name || "MesaLink"),
      createdAt: message.createdAt,
      readAt: message.readAt,
    })) || [],
  });
}

export async function POST(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const payload = await request.json().catch(() => null);
  const body = String(payload?.body || "").trim().slice(0, 2000);
  if (!body) return NextResponse.json({ error: "Escreve uma mensagem." }, { status: 400 });
  const now = new Date();
  const conversation = await prisma.supportConversation.upsert({
    where: { partnerId: partner.id },
    create: {
      partnerId: partner.id,
      lastMessageAt: now,
      lastClientMessageAt: now,
      staffReadAt: null,
      messages: { create: { senderUserId: partner.userId, senderRole: "PARTNER", body } },
    },
    update: {
      lastMessageAt: now,
      lastClientMessageAt: now,
      staffReadAt: null,
      messages: { create: { senderUserId: partner.userId, senderRole: "PARTNER", body } },
    },
  });
  await notifyPartnerMessage({
    conversationId: conversation.id,
    partnerName: partner.businessName,
    preview: body.slice(0, 120),
  }).catch((error) => console.error("Partner support push failed", error));
  return NextResponse.json({ success: true });
}
