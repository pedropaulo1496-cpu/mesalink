import { prisma } from "@/lib/prisma";
import { emptyTwimlResponse, InvalidTwilioWebhookError, readValidatedTwilioForm } from "@/lib/revenue-twilio";

export async function POST(request: Request) {
  try {
    const payload = await readValidatedTwilioForm(request);
    const externalId = payload.MessageSid?.trim();
    if (!externalId) return emptyTwimlResponse();
    const message = await prisma.revenueMessage.findUnique({ where: { externalId }, select: { id: true, conversationId: true, status: true } });
    if (!message) return emptyTwimlResponse();

    const providerStatus = String(payload.MessageStatus || "queued").toLowerCase();
    const failed = ["failed", "undelivered", "canceled"].includes(providerStatus);
    const now = new Date();
    await prisma.$transaction([
      prisma.revenueMessage.update({
        where: { id: message.id },
        data: {
          status: failed ? "FAILED" : providerStatus.toUpperCase(),
          failureReason: failed ? [payload.ErrorCode, payload.ErrorMessage].filter(Boolean).join(": ").slice(0, 500) || "A entrega WhatsApp falhou." : null,
          deliveredAt: ["delivered", "read"].includes(providerStatus) ? now : undefined,
          readAt: providerStatus === "read" ? now : undefined,
        },
      }),
      prisma.marketingAction.updateMany({
        where: { deliveryId: externalId },
        data: providerStatus === "read" ? { status: "OPENED", openedAt: now, lastOpenedAt: now, ...(message.status === "READ" ? {} : { openCount: { increment: 1 } }) } : failed ? { status: "FAILED", failureReason: [payload.ErrorCode, payload.ErrorMessage].filter(Boolean).join(": ").slice(0, 500) || "A entrega WhatsApp falhou." } : { status: "SENT" },
      }),
      ...(failed ? [prisma.revenueConversation.update({ where: { id: message.conversationId }, data: { status: "NEEDS_HUMAN", handoffReason: "A mensagem WhatsApp não foi entregue." } })] : []),
    ]);
    return emptyTwimlResponse();
  } catch (error) {
    if (error instanceof InvalidTwilioWebhookError) return new Response("Invalid signature", { status: 403 });
    console.error("Revenue WhatsApp status webhook failed", error);
    return new Response("Webhook failed", { status: 500 });
  }
}
