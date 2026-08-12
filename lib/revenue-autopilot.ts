import { prisma } from "@/lib/prisma";

type DispatchResult = {
  attempted: number;
  sent: number;
  failed: number;
  skipped: number;
};

export async function dispatchRevenueAutopilotForRestaurant(input: {
  restaurantId: string;
  userId: string;
  baseUrl: string;
  secret: string;
  limit?: number;
}): Promise<DispatchResult> {
  const result: DispatchResult = { attempted: 0, sent: 0, failed: 0, skipped: 0 };
  const conversations = await prisma.revenueConversation.findMany({
    where: {
      restaurantId: input.restaurantId,
      status: "NEW",
      channel: { in: ["EMAIL", "WHATSAPP"] },
      OR: [
        { contactEmail: { not: null } },
        { contactPhone: { not: null } },
      ],
    },
    include: {
      restaurant: { select: { name: true } },
      messages: {
        where: { direction: "OUTBOUND", status: { not: "DRAFT" } },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
    take: Math.min(50, Math.max(1, input.limit ?? 20)),
  });

  const headers = {
    authorization: `Bearer ${input.secret}`,
    "x-mesalink-user-id": input.userId,
  };
  const baseUrl = input.baseUrl.replace(/\/+$/, "");

  for (const conversation of conversations) {
    const reservationFollowUp = ["CANCELLED_RESERVATION", "NO_SHOW"].includes(conversation.opportunityType);
    if (!reservationFollowUp || conversation.messages.length > 0) {
      result.skipped += 1;
      continue;
    }

    const hello = `Olá ${conversation.contactName}, somos o assistente de reservas do ${conversation.restaurant.name}.`;
    const content = conversation.opportunityType === "NO_SHOW"
      ? `${hello} Não conseguimos recebê-lo na última reserva e esperamos que esteja tudo bem. Gostaria de remarcar para outra data?`
      : `${hello} Vimos que a sua reserva foi cancelada. Gostaria de remarcar para outra data?`;

    if (conversation.opportunityType === "CANCELLED_RESERVATION") {
      const lifecycleEmail = await prisma.emailUsage.findUnique({
        where: { reference: `email:reservation_cancelled:${conversation.reservationId}` },
        select: { status: true, sentAt: true },
      });
      if (lifecycleEmail?.status === "SENT") {
        const sentAt = lifecycleEmail.sentAt || new Date();
        await prisma.$transaction([
          prisma.revenueMessage.create({
            data: { conversationId: conversation.id, direction: "OUTBOUND", sender: "RESERVATION_SYSTEM", channel: "EMAIL", content, status: "SENT", sentAt },
          }),
          prisma.revenueConversation.update({
            where: { id: conversation.id },
            data: { status: "WAITING_CUSTOMER", lastMessagePreview: content, lastMessageAt: sentAt, nextFollowUpAt: new Date(sentAt.getTime() + 48 * 60 * 60 * 1000) },
          }),
        ]);
        result.skipped += 1;
        continue;
      }
    }

    result.attempted += 1;
    try {
      const sendResponse = await fetch(`${baseUrl}/api/revenue-ai/conversations/${conversation.id}/send`, {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ content }),
        cache: "no-store",
      });

      if (sendResponse.ok) result.sent += 1;
      else result.failed += 1;
    } catch (error) {
      console.warn("Revenue AI autopilot dispatch failed", conversation.id, error);
      result.failed += 1;
    }
  }

  return result;
}
