import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { authOptions } from "@/lib/auth";
import { AI_CREDIT_COSTS, hasGrowthAccess, InsufficientAiCreditsError, spendAiCredits } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;
  const internalUserId = request.headers.get("x-mesalink-user-id");
  const internalRequest = Boolean(cronSecret && internalUserId && request.headers.get("authorization") === `Bearer ${cronSecret}`);
  const session = internalRequest ? null : await getServerSession(authOptions);
  if (!internalRequest && !session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: internalRequest ? { id: internalUserId! } : { email: session!.user!.email! },
    include: { subscription: true },
  });
  if (!user) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
  if (!hasGrowthAccess(user.subscription)) return NextResponse.json({ error: "O Revenue AI está disponível no plano Growth." }, { status: 403 });

  const conversation = await prisma.revenueConversation.findFirst({
    where: { id: conversationId, restaurant: { userId: user.id } },
    include: { restaurant: true, messages: { orderBy: { createdAt: "asc" }, take: 12 } },
  });
  if (!conversation) return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
  const reservationFollowUp = ["CANCELLED_RESERVATION", "NO_SHOW"].includes(conversation.opportunityType);

  let creditsRemaining = user.subscription?.aiCredits || 0;
  try {
    const creditCharge = await spendAiCredits({
      userId: user.id,
      amount: AI_CREDIT_COSTS.REVENUE_DRAFT,
      feature: "REVENUE_DRAFT",
      description: `Rascunho Revenue AI para ${conversation.contactName}`,
      reference: `revenue_draft:${conversation.id}:${crypto.randomUUID()}`,
    });
    creditsRemaining = creditCharge.balance;
  } catch (error) {
    if (error instanceof InsufficientAiCreditsError) {
      return NextResponse.json({ error: "Saldo insuficiente. Cada rascunho custa 1 crédito.", code: "INSUFFICIENT_AI_CREDITS", required: error.required, available: error.available }, { status: 402 });
    }
    throw error;
  }

  let content = "";
  let sender = "AI";
  try {
    if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI not configured");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "És o assistente de reservas de um restaurante em Portugal. Escreve em português europeu. Sê humano, breve e útil. Identifica-te como assistente do restaurante. Não inventes preços, descontos, disponibilidade ou factos. Não pressiones. Se houver objeção sobre preço, reclamação, alergia, reembolso ou assunto sensível, encaminha para uma pessoa. Produz apenas a mensagem pronta a enviar, sem aspas." },
        { role: "user", content: `Restaurante: ${conversation.restaurant.name}\nMotivo: ${conversation.opportunityType}\nPessoa: ${conversation.contactName}\nResumo: ${conversation.aiSummary || conversation.lastMessagePreview || "Sem contexto adicional"}\nOferta autorizada: ${reservationFollowUp ? "Nenhuma. Este é um email de remarcação; não incluas promoções nem descontos." : conversation.restaurant.recoveryOffer || "Nenhuma"}\nCanal: ${conversation.channel}\nHistórico:\n${conversation.messages.map((message) => `${message.sender}: ${message.content}`).join("\n") || "Sem mensagens"}` },
      ],
      max_tokens: 300,
    });
    content = response.choices[0]?.message.content?.trim().slice(0, 1500) || "";
  } catch (error) {
    console.warn("Revenue AI draft fallback", error);
    sender = "RULES_ASSISTANT";
  }
  if (!content) content = fallbackDraft(conversation.opportunityType, conversation.contactName, conversation.restaurant.name, conversation.restaurant.recoveryOffer);

  const message = await prisma.revenueMessage.create({
    data: { conversationId, direction: "OUTBOUND", sender, channel: conversation.channel, content, status: "DRAFT" },
  });
  await prisma.revenueConversation.update({
    where: { id: conversationId },
    data: { status: "AI_DRAFTED", lastMessagePreview: content, lastMessageAt: new Date() },
  });
  return NextResponse.json({ success: true, message, creditsRemaining });
}

function fallbackDraft(type: string, name: string, restaurant: string, offer: string | null) {
  const hello = `Olá ${name}, sou o assistente do ${restaurant}.`;
  const authorizedOffer = offer ? ` Temos também esta condição disponível: ${offer}.` : "";
  if (type === "CANCELLED_RESERVATION") return `${hello} Vimos que a sua reserva foi cancelada. Gostaria de remarcar para outra data?`;
  if (type === "NO_SHOW") return `${hello} Não conseguimos recebê-lo na última reserva e esperamos que esteja tudo bem. Se quiser, podemos ajudar a marcar uma nova data.${authorizedOffer}`;
  if (type === "ABANDONED_LEAD") return `${hello} Recebemos o seu contacto, mas a marcação não ficou concluída. Ainda podemos ajudar com alguma informação ou com a reserva?`;
  return `${hello} Já passou algum tempo desde a sua última visita e gostaríamos de voltar a recebê-lo. Posso ajudar a reservar uma mesa?${authorizedOffer}`;
}
