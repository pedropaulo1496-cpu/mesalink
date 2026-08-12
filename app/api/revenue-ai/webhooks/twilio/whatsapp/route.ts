import { prisma } from "@/lib/prisma";
import {
  emptyTwimlResponse,
  InvalidTwilioWebhookError,
  normalizeE164,
  readValidatedTwilioForm,
  sendRevenueWhatsapp,
} from "@/lib/revenue-twilio";
import { generateInboundWhatsappReply } from "@/lib/revenue-whatsapp-agent";
import { completeWhatsAppSend, InsufficientWhatsAppAllowanceError, refundWhatsAppSend, reserveWhatsAppSend } from "@/lib/whatsapp-billing";

export async function POST(request: Request) {
  try {
    const payload = await readValidatedTwilioForm(request);
    const to = normalizeE164(payload.To);
    const from = normalizeE164(payload.From);
    const externalId = payload.MessageSid?.trim();
    const content = payload.Body?.trim().slice(0, 3000) || (Number(payload.NumMedia || 0) > 0 ? "[Mensagem com anexo]" : "[Mensagem sem texto]");
    if (!to || !from || !externalId) return emptyTwimlResponse();

    const duplicate = await prisma.revenueMessage.findUnique({ where: { externalId }, select: { id: true } });
    if (duplicate) return emptyTwimlResponse();
    const restaurant = await prisma.restaurant.findUnique({ where: { revenueWhatsappNumber: to } });
    if (!restaurant?.revenueWhatsappEnabled) return emptyTwimlResponse();

    const customers = await prisma.customer.findMany({
      where: { restaurantId: restaurant.id },
      select: { id: true, name: true, phone: true },
      orderBy: { updatedAt: "desc" },
      take: 2000,
    });
    const customer = customers.find((item) => normalizeE164(item.phone) === from) || null;
    const contactName = customer?.name || payload.ProfileName?.trim().slice(0, 120) || from;
    const sourceId = `whatsapp:${from}`;
    const now = new Date();
    const conversation = await prisma.revenueConversation.upsert({
      where: { restaurantId_opportunityType_sourceId: { restaurantId: restaurant.id, opportunityType: "WHATSAPP_INBOUND", sourceId } },
      create: {
        restaurantId: restaurant.id,
        customerId: customer?.id,
        sourceId,
        opportunityType: "WHATSAPP_INBOUND",
        channel: "WHATSAPP",
        status: "NEW",
        contactName,
        contactPhone: from,
        lastMessagePreview: content,
        aiSummary: "Mensagem recebida pelo WhatsApp; responder ou encaminhar para a equipa.",
        lastMessageAt: now,
      },
      update: {
        customerId: customer?.id,
        channel: "WHATSAPP",
        status: "NEW",
        contactName,
        contactPhone: from,
        lastMessagePreview: content,
        lastMessageAt: now,
        nextFollowUpAt: null,
        handoffReason: null,
      },
    });
    const lastOutbound = await prisma.revenueMessage.findFirst({ where: { conversationId: conversation.id, direction: "OUTBOUND", externalId: { not: null } }, orderBy: { createdAt: "desc" }, select: { externalId: true } });
    await prisma.revenueMessage.create({
      data: { conversationId: conversation.id, direction: "INBOUND", sender: "CUSTOMER", channel: "WHATSAPP", content, status: "RECEIVED", externalId, sentAt: now, deliveredAt: now },
    });
    if (lastOutbound?.externalId) await prisma.marketingAction.updateMany({ where: { deliveryId: lastOutbound.externalId }, data: { status: "OPENED", repliedAt: now } });

    if (!restaurant.revenueWhatsappAutoReply || !restaurant.userId) return emptyTwimlResponse();
    const chargeReference = `revenue_whatsapp_autoreply:${externalId}`;
    try {
      await reserveWhatsAppSend({
        userId: restaurant.userId,
        restaurantId: restaurant.id,
        category: "REVENUE_WHATSAPP_AUTOREPLY",
        reference: chargeReference,
      });
      const reply = await generateInboundWhatsappReply({
        restaurantName: restaurant.name,
        contactName,
        customerMessage: content,
        address: restaurant.address,
        cuisine: restaurant.websiteCuisine,
        description: restaurant.websiteDescription,
        recoveryOffer: restaurant.recoveryOffer,
      });
      const delivery = await sendRevenueWhatsapp({
        from: to,
        to: from,
        content: reply,
        contactName,
        restaurantName: restaurant.name,
        allowFreeform: true,
      });
      const sentAt = new Date();
      await completeWhatsAppSend(chargeReference, delivery.sid);
      await prisma.$transaction([
        prisma.revenueMessage.create({ data: { conversationId: conversation.id, direction: "OUTBOUND", sender: "AI", channel: "WHATSAPP", content: reply, status: String(delivery.status || "QUEUED").toUpperCase(), externalId: delivery.sid, sentAt } }),
        prisma.revenueConversation.update({ where: { id: conversation.id }, data: { status: "WAITING_CUSTOMER", lastMessagePreview: reply, lastMessageAt: sentAt, nextFollowUpAt: new Date(sentAt.getTime() + 24 * 60 * 60 * 1000) } }),
        prisma.marketingAction.create({ data: { restaurantId: restaurant.id, customerId: customer?.id, type: "FOLLOW_UP", status: "SENT", channel: "WHATSAPP", sentAt, estimatedRevenue: conversation.estimatedRevenue, deliveryId: delivery.sid, nextFollowUpAt: new Date(sentAt.getTime() + 24 * 60 * 60 * 1000) } }),
      ]);
    } catch (error) {
      if (!(error instanceof InsufficientWhatsAppAllowanceError)) {
        await refundWhatsAppSend(chargeReference).catch(() => null);
      }
      await prisma.revenueConversation.update({
        where: { id: conversation.id },
        data: { status: "NEEDS_HUMAN", handoffReason: error instanceof InsufficientWhatsAppAllowanceError ? "Saldo insuficiente: cada crédito disponibiliza 8 mensagens WhatsApp." : "A resposta automática WhatsApp falhou." },
      });
    }
    return emptyTwimlResponse();
  } catch (error) {
    if (error instanceof InvalidTwilioWebhookError) return new Response("Invalid signature", { status: 403 });
    console.error("Revenue WhatsApp webhook failed", error);
    return new Response("Webhook failed", { status: 500 });
  }
}
