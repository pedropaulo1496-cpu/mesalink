import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { notifyClientMessage, notifyPartnerMessage, sendHqPush } from "@/lib/hq-notifications";
import { prisma } from "@/lib/prisma";

const REQUEST_TEXT = "[PEDIDO DE ELIMINAÇÃO DE CONTA] O titular confirmou na aplicação que pretende eliminar a conta e os dados associados.";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.accountType) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.confirmation !== "DELETE_ACCOUNT") return NextResponse.json({ error: "Confirma primeiro que pretendes eliminar a conta." }, { status: 400 });

  const now = new Date();
  if (session.user.accountType === "PARTNER") {
    const partner = await prisma.referralPartner.findFirst({ where: { id: session.user.partnerId, userId: session.user.id }, select: { id: true, userId: true, businessName: true } });
    if (!partner) return NextResponse.json({ error: "Conta Partner não encontrada." }, { status: 404 });
    const conversation = await prisma.supportConversation.upsert({
      where: { partnerId: partner.id },
      create: { partnerId: partner.id, lastMessageAt: now, lastClientMessageAt: now, staffReadAt: null, messages: { create: { senderUserId: partner.userId, senderRole: "PARTNER", body: REQUEST_TEXT } } },
      update: { lastMessageAt: now, lastClientMessageAt: now, staffReadAt: null, messages: { create: { senderUserId: partner.userId, senderRole: "PARTNER", body: REQUEST_TEXT } } },
    });
    await notifyPartnerMessage({ conversationId: conversation.id, partnerName: partner.businessName, preview: "Pedido confirmado de eliminação da conta." }).catch(() => undefined);
  } else if (session.user.accountType === "RESTAURANT") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, restaurants: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, name: true } }, salesRepresentative: { select: { id: true, active: true, userId: true } } },
    });
    if (!user) return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
    const restaurant = user.restaurants[0];
    const representative = user.salesRepresentative?.active ? user.salesRepresentative : null;
    const conversation = await prisma.supportConversation.upsert({
      where: { clientUserId: user.id },
      create: { clientUserId: user.id, restaurantId: restaurant?.id || null, salesRepresentativeId: representative?.id || null, lastMessageAt: now, lastClientMessageAt: now, staffReadAt: null, messages: { create: { senderUserId: user.id, senderRole: "CLIENT", body: REQUEST_TEXT } } },
      update: { restaurantId: restaurant?.id || null, salesRepresentativeId: representative?.id || null, lastMessageAt: now, lastClientMessageAt: now, staffReadAt: null, messages: { create: { senderUserId: user.id, senderRole: "CLIENT", body: REQUEST_TEXT } } },
    });
    await notifyClientMessage({ conversationId: conversation.id, clientName: user.name || restaurant?.name || user.email, preview: "Pedido confirmado de eliminação da conta.", salesRepresentativeUserId: representative?.userId || null }).catch(() => undefined);
  } else {
    const staff = await prisma.user.findFirst({ where: { id: session.user.id, OR: [{ isAdmin: true }, { salesProfile: { active: true } }] }, select: { id: true, name: true, email: true } });
    if (!staff) return NextResponse.json({ error: "Conta HQ não encontrada." }, { status: 404 });
    await prisma.adminAuditLog.create({ data: { actorId: staff.id, targetUserId: staff.id, action: "ACCOUNT_DELETION_REQUESTED", details: { confirmedAt: now.toISOString(), email: staff.email } } });
    await sendHqPush({ title: "Pedido de eliminação de conta HQ", body: `${staff.name || staff.email} confirmou o pedido nas definições.`, url: "/backoffice/settings", tag: `account-deletion-${staff.id}` }).catch(() => undefined);
  }

  return NextResponse.json({ success: true, requestedAt: now.toISOString() });
}
