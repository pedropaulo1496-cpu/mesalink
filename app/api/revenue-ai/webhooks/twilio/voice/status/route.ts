import { InsufficientAiCreditsError, spendAiCredits } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";
import {
  getRevenueChannelStatus,
  getVoiceCredits,
  InvalidTwilioWebhookError,
  normalizeE164,
  readValidatedTwilioForm,
  sendRevenueWhatsapp,
  twilio,
  twimlResponse,
} from "@/lib/revenue-twilio";
import { completeWhatsAppSend, refundWhatsAppSend, reserveWhatsAppSend } from "@/lib/whatsapp-billing";

const MISSED_STATUSES = new Set(["busy", "no-answer", "failed", "canceled"]);

export async function POST(request: Request) {
  try {
    const payload = await readValidatedTwilioForm(request);
    const restaurantId = new URL(request.url).searchParams.get("restaurantId");
    const callSid = payload.CallSid?.trim();
    const from = normalizeE164(payload.From);
    const dialStatus = String(payload.DialCallStatus || "failed").toLowerCase();
    const durationSeconds = Number.parseInt(payload.DialCallDuration || "0", 10) || 0;
    const response = new twilio.twiml.VoiceResponse();
    if (!restaurantId || !callSid) {
      response.hangup();
      return twimlResponse(response.toString());
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) {
      response.hangup();
      return twimlResponse(response.toString());
    }

    let charged = Boolean(restaurant.userId);
    if (restaurant.userId) {
      const voiceCredits = getVoiceCredits(durationSeconds);
      try {
        await spendAiCredits({
          userId: restaurant.userId,
          amount: voiceCredits,
          feature: "REVENUE_VOICE",
          description: durationSeconds > 0 ? `Chamada Revenue AI (${durationSeconds}s)` : "Chamada não atendida Revenue AI",
          reference: `revenue_voice:${callSid}`,
        });
        await prisma.restaurant.update({ where: { id: restaurant.id }, data: { revenueChannelsLastError: null } });
      } catch (error) {
        if (!(error instanceof InsufficientAiCreditsError)) throw error;
        charged = false;
        await prisma.restaurant.update({
          where: { id: restaurant.id },
          data: { revenueVoiceEnabled: false, revenueChannelsLastError: "Chamadas pausadas automaticamente: saldo de créditos insuficiente." },
        });
      }
    }

    if (!MISSED_STATUSES.has(dialStatus)) {
      response.hangup();
      return twimlResponse(response.toString());
    }

    const callExternalId = `call:${callSid}`;
    const existing = await prisma.revenueMessage.findUnique({ where: { externalId: callExternalId }, select: { id: true } });
    if (existing) {
      response.hangup();
      return twimlResponse(response.toString());
    }
    const customers = from ? await prisma.customer.findMany({ where: { restaurantId }, select: { id: true, name: true, phone: true }, orderBy: { updatedAt: "desc" }, take: 2000 }) : [];
    const customer = from ? customers.find((item) => normalizeE164(item.phone) === from) || null : null;
    const contactName = customer?.name || (from ? `Chamada de ${from}` : "Chamada sem identificação");
    const sourceId = callSid;
    const now = new Date();
    const channelStatus = getRevenueChannelStatus(restaurant);
    const canWhatsapp = Boolean(charged && from && channelStatus.whatsappProactiveReady);
    const conversation = await prisma.revenueConversation.upsert({
      where: { restaurantId_opportunityType_sourceId: { restaurantId, opportunityType: "MISSED_CALL", sourceId } },
      create: {
        restaurantId,
        customerId: customer?.id,
        sourceId,
        opportunityType: "MISSED_CALL",
        channel: canWhatsapp ? "WHATSAPP" : "PHONE",
        status: "NEW",
        contactName,
        contactPhone: from,
        estimatedRevenue: Number(restaurant.averageTicket || 25) * 2,
        lastMessagePreview: "Chamada não atendida — oportunidade criada automaticamente.",
        aiSummary: `Chamada ${dialStatus}; contactar rapidamente e perceber o motivo do pedido.`,
        handoffReason: charged ? null : "Saldo insuficiente; chamadas pausadas e resposta automática não enviada.",
        lastMessageAt: now,
      },
      update: { status: "NEW", channel: canWhatsapp ? "WHATSAPP" : "PHONE", contactName, contactPhone: from, lastMessageAt: now },
    });
    await prisma.revenueMessage.create({
      data: { conversationId: conversation.id, direction: "INBOUND", sender: "CUSTOMER", channel: "PHONE", content: `Chamada não atendida (${dialStatus}).`, status: "RECEIVED", externalId: callExternalId, sentAt: now },
    });

    if (canWhatsapp && restaurant.revenueMissedCallAutoReply && restaurant.revenueWhatsappNumber && restaurant.revenueWhatsappContentSid && from) {
      const whatsappReference = `revenue_whatsapp_missed_call:${callSid}`;
      try {
        await reserveWhatsAppSend({ userId: restaurant.userId!, restaurantId, category: "MISSED_CALL_FOLLOW_UP", reference: whatsappReference });
        const reply = `Tentou contactar-nos há pouco e não conseguimos atender. Diga-nos como podemos ajudar; se preferir, uma pessoa da equipa responde assim que possível.`;
        const delivery = await sendRevenueWhatsapp({
          from: restaurant.revenueWhatsappNumber,
          to: from,
          content: reply,
          contactName: customer?.name || "",
          restaurantName: restaurant.name,
          contentSid: restaurant.revenueWhatsappContentSid,
          allowFreeform: false,
        });
        const sentAt = new Date();
        await completeWhatsAppSend(whatsappReference, delivery.sid);
        await prisma.$transaction([
          prisma.revenueMessage.create({ data: { conversationId: conversation.id, direction: "OUTBOUND", sender: "AI", channel: "WHATSAPP", content: reply, status: String(delivery.status || "QUEUED").toUpperCase(), externalId: delivery.sid, sentAt } }),
          prisma.revenueConversation.update({ where: { id: conversation.id }, data: { status: "WAITING_CUSTOMER", lastMessagePreview: reply, lastMessageAt: sentAt, nextFollowUpAt: new Date(sentAt.getTime() + 24 * 60 * 60 * 1000) } }),
          prisma.marketingAction.create({ data: { restaurantId, customerId: customer?.id, type: "FOLLOW_UP", status: "SENT", channel: "WHATSAPP", sentAt, estimatedRevenue: conversation.estimatedRevenue, deliveryId: delivery.sid, nextFollowUpAt: new Date(sentAt.getTime() + 24 * 60 * 60 * 1000) } }),
        ]);
        response.say({ language: "pt-PT" }, "Não conseguimos atender. Enviámos uma mensagem para podermos ajudar.");
      } catch (error) {
        await refundWhatsAppSend(whatsappReference).catch(() => null);
        console.error("Missed call WhatsApp follow-up failed", error);
        await prisma.revenueConversation.update({ where: { id: conversation.id }, data: { status: "NEEDS_HUMAN", handoffReason: "A chamada foi registada, mas a resposta WhatsApp falhou." } });
        response.say({ language: "pt-PT" }, "Não conseguimos atender. A nossa equipa recebeu o seu pedido e responderá assim que possível.");
      }
    } else {
      response.say({ language: "pt-PT" }, "Não conseguimos atender. A nossa equipa recebeu o seu pedido e responderá assim que possível.");
    }
    response.hangup();
    return twimlResponse(response.toString());
  } catch (error) {
    if (error instanceof InvalidTwilioWebhookError) return new Response("Invalid signature", { status: 403 });
    console.error("Revenue voice status webhook failed", error);
    return new Response("Webhook failed", { status: 500 });
  }
}
