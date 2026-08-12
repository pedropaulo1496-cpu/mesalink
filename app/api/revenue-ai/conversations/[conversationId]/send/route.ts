import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { authOptions } from "@/lib/auth";
import { hasGrowthAccess } from "@/lib/ai-billing";
import { completeEmailSend, InsufficientEmailAllowanceError, refundEmailSend, reserveEmailSend } from "@/lib/email-billing";
import { requireAcceptedEmail } from "@/lib/email-delivery";
import { createMarketingTrackingToken, getMarketingTrackingUrls, marketingTrackingPixel } from "@/lib/marketing-tracking";
import { prisma } from "@/lib/prisma";
import { getRevenueChannelStatus, normalizeE164, sendRevenueWhatsapp } from "@/lib/revenue-twilio";
import { completeWhatsAppSend, InsufficientWhatsAppAllowanceError, refundWhatsAppSend, reserveWhatsAppSend } from "@/lib/whatsapp-billing";

export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const cronSecret = process.env.CRON_SECRET;
  const internalUserId = request.headers.get("x-mesalink-user-id");
  const internalRequest = Boolean(cronSecret && internalUserId && request.headers.get("authorization") === `Bearer ${cronSecret}`);
  const session = internalRequest ? null : await getServerSession(authOptions);
  if (!internalRequest && !session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim().slice(0, 1500) : "";
  if (!content) return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: internalRequest ? { id: internalUserId! } : { email: session!.user!.email! },
    include: { subscription: true },
  });
  if (!user) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
  if (!hasGrowthAccess(user.subscription)) return NextResponse.json({ error: "O Revenue AI está disponível no plano Growth." }, { status: 403 });

  const conversation = await prisma.revenueConversation.findFirst({
    where: { id: conversationId, restaurant: { userId: user.id } },
    include: { restaurant: true, customer: { select: { marketingOptIn: true } }, messages: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!conversation) return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
  if (!conversation.contactEmail && !conversation.contactPhone) return NextResponse.json({ error: "Esta conversa não tem um contacto utilizável." }, { status: 409 });

  const duplicate = await prisma.revenueMessage.findFirst({
    where: { conversationId, direction: "OUTBOUND", status: { in: ["QUEUED", "SENT", "DELIVERED", "READ"] }, content, sentAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
    orderBy: { sentAt: "desc" },
  });
  if (duplicate) return NextResponse.json({ success: true, message: duplicate, duplicate: true });

  if (conversation.channel === "WHATSAPP") {
    const channelStatus = getRevenueChannelStatus(conversation.restaurant);
    const contactPhone = normalizeE164(conversation.contactPhone);
    if (!channelStatus.whatsappReady || !conversation.restaurant.revenueWhatsappNumber || !contactPhone) {
      return NextResponse.json({ error: "O WhatsApp ainda não está totalmente ligado para este restaurante." }, { status: 409 });
    }
    const lastInboundWhatsapp = conversation.messages.find((message) => message.direction === "INBOUND" && message.channel === "WHATSAPP");
    const insideServiceWindow = Boolean(lastInboundWhatsapp && lastInboundWhatsapp.createdAt >= new Date(Date.now() - 24 * 60 * 60 * 1000));
    const customerInitiated = insideServiceWindow || ["MISSED_CALL", "WHATSAPP_INBOUND"].includes(conversation.opportunityType);
    if (!customerInitiated && !conversation.customer?.marketingOptIn) {
      return NextResponse.json({ error: "O cliente não tem consentimento para iniciar uma comunicação promocional por WhatsApp." }, { status: 403 });
    }
    if (!insideServiceWindow && !channelStatus.whatsappProactiveReady) {
      return NextResponse.json({ error: "Falta um modelo WhatsApp aprovado para iniciar esta conversa fora da janela de 24 horas." }, { status: 409 });
    }

    const whatsappReference = `revenue_whatsapp:${conversation.id}:${crypto.randomUUID()}`;
    let creditsRemaining = user.subscription?.aiCredits || 0;
    let whatsappRemaining = user.subscription?.whatsappMessageBalance || 0;
    try {
      const allowance = await reserveWhatsAppSend({
        userId: user.id,
        restaurantId: conversation.restaurantId,
        category: "REVENUE_WHATSAPP",
        reference: whatsappReference,
      });
      if (!allowance.canSend) return NextResponse.json({ error: "Esta mensagem já foi processada." }, { status: 409 });
      creditsRemaining = allowance.aiCredits;
      whatsappRemaining = allowance.messageBalance;
    } catch (error) {
      if (error instanceof InsufficientWhatsAppAllowanceError) return NextResponse.json({ error: "Saldo insuficiente. Cada crédito disponibiliza 8 mensagens WhatsApp.", code: "INSUFFICIENT_WHATSAPP_ALLOWANCE", messagesRemaining: error.messageBalance, aiCredits: error.aiCredits }, { status: 402 });
      throw error;
    }

    try {
      const delivery = await sendRevenueWhatsapp({
        from: conversation.restaurant.revenueWhatsappNumber,
        to: contactPhone,
        content,
        contactName: conversation.contactName,
        restaurantName: conversation.restaurant.name,
        contentSid: conversation.restaurant.revenueWhatsappContentSid,
        allowFreeform: insideServiceWindow,
      });
      const now = new Date();
      const message = await prisma.revenueMessage.create({ data: { conversationId, direction: "OUTBOUND", sender: "AI_REVIEWED", channel: "WHATSAPP", content, status: String(delivery.status || "QUEUED").toUpperCase(), externalId: delivery.sid, sentAt: now } });
      await completeWhatsAppSend(whatsappReference, delivery.sid);
      await prisma.$transaction([
        prisma.revenueConversation.update({ where: { id: conversationId }, data: { status: "WAITING_CUSTOMER", lastMessagePreview: content, lastMessageAt: now, nextFollowUpAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) } }),
        prisma.marketingAction.create({ data: { restaurantId: conversation.restaurantId, customerId: conversation.customerId, type: "FOLLOW_UP", status: "SENT", channel: "WHATSAPP", sentAt: now, estimatedRevenue: conversation.estimatedRevenue, deliveryId: delivery.sid, nextFollowUpAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) } }),
      ]);
      return NextResponse.json({ success: true, message, creditsRemaining, whatsappRemaining, emailsRemaining: user.subscription?.emailBalance || 0, channel: "WHATSAPP" });
    } catch (error) {
      await refundWhatsAppSend(whatsappReference).catch(() => null);
      return NextResponse.json({ error: error instanceof Error ? error.message : "Falha no envio WhatsApp." }, { status: 502 });
    }
  }

  if (conversation.channel !== "EMAIL" || !conversation.contactEmail) return NextResponse.json({ error: "Esta conversa precisa de WhatsApp ativo ou de um email válido." }, { status: 409 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "Canal de email não configurado." }, { status: 503 });
  const reservationFollowUp = ["CANCELLED_RESERVATION", "NO_SHOW"].includes(conversation.opportunityType);
  if (!reservationFollowUp && !conversation.customer?.marketingOptIn) return NextResponse.json({ error: "O cliente não tem consentimento de marketing registado; a mensagem ficou apenas como rascunho." }, { status: 403 });

  const emailReference = `email:revenue_follow_up:${conversation.id}:${crypto.randomUUID()}`;
  let creditsRemaining = user.subscription?.aiCredits || 0;
  let emailsRemaining = user.subscription?.emailBalance || 0;
  let emailReserved = false;
  try {
    const allowance = await reserveEmailSend({
      userId: user.id,
      restaurantId: conversation.restaurantId,
      category: "REVENUE_FOLLOW_UP",
      reference: emailReference,
    });
    if (!allowance.canSend) return NextResponse.json({ error: "Este email já foi processado." }, { status: 409 });
    emailReserved = true;
    creditsRemaining = allowance.aiCredits;
    emailsRemaining = allowance.emailBalance;
  } catch (error) {
    if (error instanceof InsufficientEmailAllowanceError) {
      return NextResponse.json({ error: "Os 1.000 emails incluídos terminaram e não existem créditos AI. Cada crédito disponibiliza 75 emails.", code: "INSUFFICIENT_EMAIL_ALLOWANCE", emailsRemaining: error.emailBalance, aiCredits: error.aiCredits }, { status: 402 });
    }
    throw error;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  let trackingActionId: string | null = null;
  try {
    const trackingAction = await prisma.marketingAction.create({
      data: {
        restaurantId: conversation.restaurantId,
        customerId: conversation.customerId,
        type: "FOLLOW_UP",
        status: "QUEUED",
        channel: "EMAIL",
        sentAt: new Date(),
        estimatedRevenue: conversation.estimatedRevenue,
        trackingToken: createMarketingTrackingToken(),
      },
    });
    trackingActionId = trackingAction.id;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const { clickUrl, openUrl } = getMarketingTrackingUrls(baseUrl, trackingAction.trackingToken!);
    const delivery = await resend.emails.send({
      from: `${conversation.restaurant.name} via MesaLink <noreply@mesalink.pt>`,
      to: conversation.contactEmail,
      subject: reservationFollowUp ? `${conversation.restaurant.name}: quer remarcar a sua reserva?` : `${conversation.restaurant.name}: podemos ajudar?`,
      html: `<div style="font-family:Arial,sans-serif;background:#F5EFE6;padding:32px"><div style="max-width:560px;margin:auto;background:white;border:1px solid #E1D0B8;border-radius:24px;padding:30px"><p style="white-space:pre-wrap;line-height:1.65;color:#29221B">${escapeHtml(content)}</p><a href="${clickUrl}" style="display:inline-block;margin-top:24px;background:#16120E;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700">${reservationFollowUp ? "Escolher nova data" : "Reservar mesa"}</a><p style="margin-top:28px;font-size:12px;color:#817365">${reservationFollowUp ? `Mensagem de acompanhamento da sua reserva em ${escapeHtml(conversation.restaurant.name)}, enviada através do MesaLink.` : `Mensagem enviada por ${escapeHtml(conversation.restaurant.name)} através do MesaLink porque aceitou receber comunicações deste restaurante.`}</p>${marketingTrackingPixel(openUrl)}</div></div>`,
    });
    const deliveryId = requireAcceptedEmail(delivery);
    await completeEmailSend(emailReference);

    const now = new Date();
    const message = await prisma.revenueMessage.create({
      data: { conversationId, direction: "OUTBOUND", sender: "AI_REVIEWED", channel: "EMAIL", content, status: "SENT", externalId: deliveryId, sentAt: now },
    });
    await prisma.revenueConversation.update({
      where: { id: conversationId },
      data: { status: "WAITING_CUSTOMER", lastMessagePreview: content, lastMessageAt: now, nextFollowUpAt: new Date(now.getTime() + 48 * 60 * 60 * 1000) },
    });
    await prisma.marketingAction.update({
      where: { id: trackingAction.id },
      data: {
        status: "SENT",
        sentAt: now,
        deliveryId,
        nextFollowUpAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      },
    });
    return NextResponse.json({ success: true, message, creditsRemaining, emailsRemaining });
  } catch (error) {
    if (trackingActionId) {
      await prisma.marketingAction.update({
        where: { id: trackingActionId },
        data: {
          status: "FAILED",
          failureReason: error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed",
        },
      }).catch(() => null);
    }
    if (emailReserved) await refundEmailSend(emailReference);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha no envio." }, { status: 502 });
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!);
}
