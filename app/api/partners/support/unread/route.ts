import { NextResponse } from "next/server";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const conversation = await prisma.supportConversation.findUnique({ where: { partnerId: partner.id }, select: { id: true } });
  if (!conversation) return NextResponse.json({ count: 0 });
  const count = await prisma.supportMessage.count({ where: { conversationId: conversation.id, senderRole: "STAFF", readAt: null } });
  return NextResponse.json({ count });
}
