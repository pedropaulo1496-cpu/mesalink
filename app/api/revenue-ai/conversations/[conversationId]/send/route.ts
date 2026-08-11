import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { authOptions } from "@/lib/auth";
import { AI_CREDIT_COSTS, hasGrowthAccess, InsufficientAiCreditsError, refundAiCredits, spendAiCredits } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "Canal de email não configurado." }, { status: 503 });
  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim().slice(0, 1500) : "";
  if (!content) return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!user) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
  if (!hasGrowthAccess(user.subscription)) return NextResponse.json({ error: "O Revenue AI está disponível no plano Growth." }, { status: 403 });

  const conversation = await prisma.revenueConversation.findFirst({
    where: { id: conversationId, restaurant: { userId: user.id } },
    include: { restaurant: true, customer: { select: { marketingOptIn: true } } },
  });
  if (!conversation) return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
  if (conversation.channel !== "EMAIL" || !conversation.contactEmail) return NextResponse.json({ error: "Esta conversa ainda precisa de um conector de telefone ou WhatsApp." }, { status: 409 });
  if (!conversation.customer?.marketingOptIn) return NextResponse.json({ error: "O cliente não tem consentimento de marketing registado; a mensagem ficou apenas como rascunho." }, { status: 403 });

  const duplicate = await prisma.revenueMessage.findFirst({
    where: { conversationId, direction: "OUTBOUND", status: "SENT", content, sentAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
    orderBy: { sentAt: "desc" },
  });
  if (duplicate) return NextResponse.json({ success: true, message: duplicate, duplicate: true });

  const creditReference = `revenue_email:${conversation.id}:${crypto.randomUUID()}`;
  let creditsRemaining = user.subscription?.aiCredits || 0;
  try {
    const creditCharge = await spendAiCredits({
      userId: user.id,
      amount: AI_CREDIT_COSTS.REVENUE_EMAIL,
      feature: "REVENUE_EMAIL",
      description: `Email Revenue AI para ${conversation.contactName}`,
      reference: creditReference,
    });
    creditsRemaining = creditCharge.balance;
  } catch (error) {
    if (error instanceof InsufficientAiCreditsError) {
      return NextResponse.json({ error: "Saldo insuficiente. Cada envio custa 1 crédito.", code: "INSUFFICIENT_AI_CREDITS", required: error.required, available: error.available }, { status: 402 });
    }
    throw error;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const delivery = await resend.emails.send({
      from: `${conversation.restaurant.name} via MesaLink <noreply@mesalink.pt>`,
      to: conversation.contactEmail,
      subject: `${conversation.restaurant.name}: podemos ajudar?`,
      html: `<div style="font-family:Arial,sans-serif;background:#F5EFE6;padding:32px"><div style="max-width:560px;margin:auto;background:white;border:1px solid #E1D0B8;border-radius:24px;padding:30px"><p style="white-space:pre-wrap;line-height:1.65;color:#29221B">${escapeHtml(content)}</p><p style="margin-top:28px;font-size:12px;color:#817365">Mensagem enviada por ${escapeHtml(conversation.restaurant.name)} através do MesaLink porque aceitou receber comunicações deste restaurante.</p></div></div>`,
    });

    const now = new Date();
    const message = await prisma.revenueMessage.create({
      data: { conversationId, direction: "OUTBOUND", sender: "AI_REVIEWED", channel: "EMAIL", content, status: "SENT", externalId: delivery.data?.id, sentAt: now },
    });
    await prisma.revenueConversation.update({
      where: { id: conversationId },
      data: { status: "WAITING_CUSTOMER", lastMessagePreview: content, lastMessageAt: now, nextFollowUpAt: new Date(now.getTime() + 48 * 60 * 60 * 1000) },
    });
    return NextResponse.json({ success: true, message, creditsRemaining });
  } catch (error) {
    await refundAiCredits({
      userId: user.id,
      amount: AI_CREDIT_COSTS.REVENUE_EMAIL,
      feature: "REVENUE_EMAIL",
      description: `Crédito devolvido: email para ${conversation.contactName} não enviado`,
      reference: creditReference,
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha no envio." }, { status: 502 });
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!);
}
