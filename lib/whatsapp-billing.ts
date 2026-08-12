import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const WHATSAPP_MESSAGES_PER_AI_CREDIT = 8;

export class InsufficientWhatsAppAllowanceError extends Error {
  constructor(
    public readonly messageBalance: number,
    public readonly aiCredits: number,
  ) {
    super("Saldo de mensagens WhatsApp esgotado e sem créditos IA disponíveis.");
    this.name = "InsufficientWhatsAppAllowanceError";
  }
}

export async function reserveWhatsAppSend(input: {
  userId: string;
  restaurantId?: string | null;
  reference: string;
  category: string;
}) {
  return withSerializableRetry(() => prisma.$transaction(async (tx) => {
    const existing = await tx.whatsAppUsage.findUnique({ where: { reference: input.reference } });
    if (existing) {
      const subscription = await tx.subscription.findUnique({
        where: { userId: input.userId },
        select: { whatsappMessageBalance: true, aiCredits: true },
      });
      return {
        canSend: false,
        messageBalance: subscription?.whatsappMessageBalance ?? existing.balanceAfter,
        aiCredits: subscription?.aiCredits ?? 0,
        convertedCredit: false,
      };
    }

    let convertedCredit = false;
    let updated = await tx.subscription.updateMany({
      where: { userId: input.userId, whatsappMessageBalance: { gt: 0 } },
      data: { whatsappMessageBalance: { decrement: 1 }, whatsappMessagesSent: { increment: 1 } },
    });

    if (updated.count !== 1) {
      updated = await tx.subscription.updateMany({
        where: { userId: input.userId, whatsappMessageBalance: { lte: 0 }, aiCredits: { gte: 1 } },
        data: {
          aiCredits: { decrement: 1 },
          whatsappMessageBalance: { increment: WHATSAPP_MESSAGES_PER_AI_CREDIT - 1 },
          whatsappMessagesSent: { increment: 1 },
        },
      });
      if (updated.count !== 1) {
        const subscription = await tx.subscription.findUnique({
          where: { userId: input.userId },
          select: { whatsappMessageBalance: true, aiCredits: true },
        });
        throw new InsufficientWhatsAppAllowanceError(
          subscription?.whatsappMessageBalance ?? 0,
          subscription?.aiCredits ?? 0,
        );
      }
      convertedCredit = true;
    }

    const subscription = await tx.subscription.findUniqueOrThrow({
      where: { userId: input.userId },
      select: { whatsappMessageBalance: true, aiCredits: true },
    });
    if (convertedCredit) {
      await tx.aiCreditTransaction.create({
        data: {
          userId: input.userId,
          amount: -1,
          balanceAfter: subscription.aiCredits,
          kind: "USAGE",
          feature: "WHATSAPP_BUNDLE",
          description: `Conversão automática: ${WHATSAPP_MESSAGES_PER_AI_CREDIT} mensagens WhatsApp`,
          reference: `whatsapp_bundle:${input.reference}`,
        },
      });
    }
    await tx.whatsAppUsage.create({
      data: {
        userId: input.userId,
        restaurantId: input.restaurantId ?? null,
        reference: input.reference,
        category: input.category,
        status: "RESERVED",
        aiCreditCharged: convertedCredit ? 1 : 0,
        balanceAfter: subscription.whatsappMessageBalance,
      },
    });
    return {
      canSend: true,
      messageBalance: subscription.whatsappMessageBalance,
      aiCredits: subscription.aiCredits,
      convertedCredit,
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
}

export async function completeWhatsAppSend(reference: string, externalId?: string) {
  await prisma.whatsAppUsage.updateMany({
    where: { reference, status: "RESERVED" },
    data: { status: "SENT", sentAt: new Date(), externalId },
  });
}

export async function refundWhatsAppSend(reference: string) {
  return withSerializableRetry(() => prisma.$transaction(async (tx) => {
    const usage = await tx.whatsAppUsage.findUnique({ where: { reference } });
    if (!usage || !["RESERVED", "SENT"].includes(usage.status)) return { refunded: false };
    const updated = await tx.whatsAppUsage.updateMany({
      where: { id: usage.id, status: { in: ["RESERVED", "SENT"] } },
      data: { status: "REFUNDED", refundedAt: new Date() },
    });
    if (updated.count !== 1) return { refunded: false };
    await tx.subscription.update({
      where: { userId: usage.userId },
      data: { whatsappMessageBalance: { increment: 1 }, whatsappMessagesSent: { decrement: 1 } },
    });
    return { refunded: true };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
}

async function withSerializableRetry<T>(operation: () => Promise<T>) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < 2) continue;
      throw error;
    }
  }
  throw new Error("WhatsApp allowance operation could not be completed");
}
