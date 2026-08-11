import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const FREE_EMAIL_ALLOWANCE = 1000;
export const EMAILS_PER_AI_CREDIT = 75;

export class InsufficientEmailAllowanceError extends Error {
  constructor(
    public readonly emailBalance: number,
    public readonly aiCredits: number,
  ) {
    super("Saldo de emails esgotado e sem créditos AI disponíveis.");
    this.name = "InsufficientEmailAllowanceError";
  }
}

export async function reserveEmailSend(input: {
  userId: string;
  restaurantId?: string | null;
  reference: string;
  category: string;
}) {
  return withSerializableRetry(() =>
    prisma.$transaction(
      async (tx) => {
        const existing = await tx.emailUsage.findUnique({
          where: { reference: input.reference },
        });
        if (existing) {
          const subscription = await tx.subscription.findUnique({
            where: { userId: input.userId },
            select: { emailBalance: true, aiCredits: true },
          });
          return {
            canSend: false,
            emailBalance: subscription?.emailBalance ?? existing.balanceAfter,
            aiCredits: subscription?.aiCredits ?? 0,
            convertedCredit: false,
          };
        }

        let convertedCredit = false;
        let updated = await tx.subscription.updateMany({
          where: { userId: input.userId, emailBalance: { gt: 0 } },
          data: {
            emailBalance: { decrement: 1 },
            emailsSent: { increment: 1 },
          },
        });

        if (updated.count !== 1) {
          updated = await tx.subscription.updateMany({
            where: {
              userId: input.userId,
              emailBalance: { lte: 0 },
              aiCredits: { gte: 1 },
            },
            data: {
              aiCredits: { decrement: 1 },
              emailBalance: { increment: EMAILS_PER_AI_CREDIT - 1 },
              emailsSent: { increment: 1 },
            },
          });

          if (updated.count !== 1) {
            const subscription = await tx.subscription.findUnique({
              where: { userId: input.userId },
              select: { emailBalance: true, aiCredits: true },
            });
            throw new InsufficientEmailAllowanceError(
              subscription?.emailBalance ?? 0,
              subscription?.aiCredits ?? 0,
            );
          }

          convertedCredit = true;
        }

        const subscription = await tx.subscription.findUniqueOrThrow({
          where: { userId: input.userId },
          select: { emailBalance: true, aiCredits: true },
        });

        if (convertedCredit) {
          await tx.aiCreditTransaction.create({
            data: {
              userId: input.userId,
              amount: -1,
              balanceAfter: subscription.aiCredits,
              kind: "USAGE",
              feature: "EMAIL_BUNDLE",
              description: `Conversão automática: ${EMAILS_PER_AI_CREDIT} emails`,
              reference: `email_bundle:${input.reference}`,
            },
          });
        }

        await tx.emailUsage.create({
          data: {
            userId: input.userId,
            restaurantId: input.restaurantId ?? null,
            reference: input.reference,
            category: input.category,
            status: "RESERVED",
            aiCreditCharged: convertedCredit ? 1 : 0,
            balanceAfter: subscription.emailBalance,
          },
        });

        return {
          canSend: true,
          emailBalance: subscription.emailBalance,
          aiCredits: subscription.aiCredits,
          convertedCredit,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    ),
  );
}

export async function completeEmailSend(reference: string) {
  await prisma.emailUsage.updateMany({
    where: { reference, status: "RESERVED" },
    data: { status: "SENT", sentAt: new Date() },
  });
}

export async function refundEmailSend(reference: string) {
  return withSerializableRetry(() =>
    prisma.$transaction(
      async (tx) => {
        const usage = await tx.emailUsage.findUnique({ where: { reference } });
        if (!usage || usage.status !== "RESERVED") return { refunded: false };

        const updated = await tx.emailUsage.updateMany({
          where: { id: usage.id, status: "RESERVED" },
          data: { status: "REFUNDED", refundedAt: new Date() },
        });
        if (updated.count !== 1) return { refunded: false };

        await tx.subscription.update({
          where: { userId: usage.userId },
          data: {
            emailBalance: { increment: 1 },
            emailsSent: { decrement: 1 },
          },
        });
        return { refunded: true };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    ),
  );
}

async function withSerializableRetry<T>(operation: () => Promise<T>) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < 2
      ) {
        continue;
      }
      throw error;
    }
  }
  throw new Error("Email allowance operation could not be completed");
}
