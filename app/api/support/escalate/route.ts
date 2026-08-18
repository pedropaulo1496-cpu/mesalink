import { NextResponse } from "next/server";
import { sendHqPush } from "@/lib/hq-notifications";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const candidates = await prisma.supportConversation.findMany({
    where: { salesRepresentativeId: { not: null }, escalatedAt: null, lastClientMessageAt: { lte: cutoff } },
    include: {
      clientUser: { select: { name: true, email: true } },
      salesRepresentative: { select: { name: true } },
      messages: { where: { senderRole: "CLIENT" }, select: { body: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  let escalated = 0;
  for (const conversation of candidates) {
    if (!conversation.lastClientMessageAt || (conversation.lastStaffMessageAt && conversation.lastStaffMessageAt >= conversation.lastClientMessageAt)) continue;
    const updated = await prisma.supportConversation.updateMany({ where: { id: conversation.id, escalatedAt: null }, data: { escalatedAt: new Date() } });
    if (!updated.count) continue;
    escalated += 1;
    await sendHqPush({
      title: "Cliente sem resposta há 24h",
      body: `${conversation.salesRepresentative?.name || "O comercial"} não respondeu a ${conversation.clientUser.name || conversation.clientUser.email}: ${conversation.messages[0]?.body.slice(0, 90) || "mensagem pendente"}`,
      url: `/backoffice/chat?mode=clients&client=${conversation.id}`,
      tag: `support-escalated-${conversation.id}`,
    });
  }
  return NextResponse.json({ success: true, escalated });
}
