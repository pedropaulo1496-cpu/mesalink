import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const AI_CREDIT_COSTS = {
  AI_VISIBILITY_SCAN: 10,
  WEBSITE_COPY: 5,
  REVENUE_DRAFT: 1,
} as const;

export const AI_CREDIT_PACKS = {
  STARTER: { id: "STARTER", credits: 100, priceCents: 2900, label: "100 créditos" },
  GROWTH: { id: "GROWTH", credits: 300, priceCents: 6900, label: "300 créditos" },
  SCALE: { id: "SCALE", credits: 1000, priceCents: 17900, label: "1.000 créditos" },
} as const;

export type AiCreditPackId = keyof typeof AI_CREDIT_PACKS;

export class InsufficientAiCreditsError extends Error {
  constructor(public readonly required: number, public readonly available: number) {
    super(`Saldo insuficiente: são necessários ${required} créditos.`);
    this.name = "InsufficientAiCreditsError";
  }
}

export function getAiCreditPack(value: unknown) {
  const id = String(value || "").toUpperCase() as AiCreditPackId;
  return AI_CREDIT_PACKS[id] || null;
}

export function hasGrowthAccess(subscription: { status: string; plan: string; trialEndsAt: Date | null } | null | undefined) {
  if (!subscription) return false;
  if (subscription.status === "ACTIVE" && String(subscription.plan).toUpperCase() === "GROWTH") return true;
  return Boolean(subscription.status === "TRIAL" && subscription.trialEndsAt && subscription.trialEndsAt > new Date());
}

export function hasAppAccess(subscription: { status: string; plan: string; trialEndsAt: Date | null } | null | undefined) {
  if (!subscription) return false;
  if (subscription.status === "ACTIVE" && ["ESSENTIALS", "GROWTH"].includes(String(subscription.plan).toUpperCase())) return true;
  return Boolean(subscription.status === "TRIAL" && subscription.trialEndsAt && subscription.trialEndsAt > new Date());
}

export async function spendAiCredits(input: {
  userId: string;
  amount: number;
  feature: string;
  description: string;
  reference: string;
}) {
  return withSerializableRetry(() => prisma.$transaction(async (tx) => {
    const existing = await tx.aiCreditTransaction.findUnique({ where: { reference: input.reference } });
    if (existing) return { charged: false, balance: existing.balanceAfter };

    const updated = await tx.subscription.updateMany({
      where: { userId: input.userId, aiCredits: { gte: input.amount } },
      data: { aiCredits: { decrement: input.amount } },
    });

    if (updated.count !== 1) {
      const subscription = await tx.subscription.findUnique({ where: { userId: input.userId }, select: { aiCredits: true } });
      throw new InsufficientAiCreditsError(input.amount, subscription?.aiCredits || 0);
    }

    const subscription = await tx.subscription.findUniqueOrThrow({ where: { userId: input.userId }, select: { aiCredits: true } });
    await tx.aiCreditTransaction.create({
      data: {
        userId: input.userId,
        amount: -input.amount,
        balanceAfter: subscription.aiCredits,
        kind: "USAGE",
        feature: input.feature,
        description: input.description,
        reference: input.reference,
      },
    });
    return { charged: true, balance: subscription.aiCredits };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
}

export async function refundAiCredits(input: {
  userId: string;
  amount: number;
  feature: string;
  description: string;
  reference: string;
}) {
  const refundReference = `${input.reference}:refund`;
  return withSerializableRetry(() => prisma.$transaction(async (tx) => {
    const existing = await tx.aiCreditTransaction.findUnique({ where: { reference: refundReference } });
    if (existing) return { refunded: false, balance: existing.balanceAfter };

    const debit = await tx.aiCreditTransaction.findUnique({ where: { reference: input.reference } });
    if (!debit || debit.amount !== -input.amount || debit.userId !== input.userId) {
      throw new Error("Credit debit not found for refund");
    }

    const subscription = await tx.subscription.update({
      where: { userId: input.userId },
      data: { aiCredits: { increment: input.amount } },
      select: { aiCredits: true },
    });
    await tx.aiCreditTransaction.create({
      data: {
        userId: input.userId,
        amount: input.amount,
        balanceAfter: subscription.aiCredits,
        kind: "REFUND",
        feature: input.feature,
        description: input.description,
        reference: refundReference,
      },
    });
    return { refunded: true, balance: subscription.aiCredits };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
}

export async function grantPurchasedAiCredits(input: {
  userId: string;
  packId: AiCreditPackId;
  checkoutSessionId: string;
  paymentIntentId: string;
  chargeId: string;
}) {
  const pack = AI_CREDIT_PACKS[input.packId];
  const reference = `stripe_credits:${input.checkoutSessionId}`;
  return withSerializableRetry(() => prisma.$transaction(async (tx) => {
    const existing = await tx.aiCreditTransaction.findUnique({ where: { reference } });
    if (existing) return { granted: false, balance: existing.balanceAfter };

    const subscription = await tx.subscription.update({
      where: { userId: input.userId },
      data: { aiCredits: { increment: pack.credits } },
      select: { aiCredits: true },
    });
    await tx.aiCreditTransaction.create({
      data: {
        userId: input.userId,
        amount: pack.credits,
        balanceAfter: subscription.aiCredits,
        kind: "PURCHASE",
        feature: "AI_CREDITS",
        description: `${pack.label} comprados através do Stripe`,
        reference,
        stripeCheckoutSessionId: input.checkoutSessionId,
        stripePaymentIntentId: input.paymentIntentId,
        stripeChargeId: input.chargeId,
      },
    });
    return { granted: true, balance: subscription.aiCredits };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
}

export async function revokeRefundedAiCredits(input: { chargeId: string; refundedCents: number; totalCents: number }) {
  return withSerializableRetry(() => prisma.$transaction(async (tx) => {
    const purchase = await tx.aiCreditTransaction.findUnique({ where: { stripeChargeId: input.chargeId } });
    if (!purchase || purchase.kind !== "PURCHASE" || purchase.amount <= 0 || input.totalCents <= 0) return null;

    const desiredRevoked = Math.min(purchase.amount, Math.round((input.refundedCents / input.totalCents) * purchase.amount));
    const delta = Math.max(0, desiredRevoked - purchase.revokedCredits);
    if (delta === 0) return { revoked: 0, balance: purchase.balanceAfter };

    const subscription = await tx.subscription.update({
      where: { userId: purchase.userId },
      data: { aiCredits: { decrement: delta } },
      select: { aiCredits: true },
    });
    await tx.aiCreditTransaction.update({
      where: { id: purchase.id },
      data: { refundedCents: input.refundedCents, revokedCredits: desiredRevoked },
    });
    await tx.aiCreditTransaction.create({
      data: {
        userId: purchase.userId,
        amount: -delta,
        balanceAfter: subscription.aiCredits,
        kind: "PURCHASE_REVERSAL",
        feature: "AI_CREDITS",
        description: `Créditos anulados por reembolso Stripe (${input.chargeId})`,
        reference: `stripe_credit_refund:${input.chargeId}:${input.refundedCents}`,
      },
    });
    return { revoked: delta, balance: subscription.aiCredits };
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
  throw new Error("Credit operation could not be completed");
}
