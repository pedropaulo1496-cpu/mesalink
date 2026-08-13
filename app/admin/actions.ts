"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { monthlyEmailAllowance, nextMonthlyEmailReset } from "@/lib/email-billing";

function boundedInteger(value: FormDataEntryValue | null, min: number, max: number) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`O valor deve estar entre ${min} e ${max}.`);
  }
  return parsed;
}

async function audit(input: {
  actorId: string;
  targetUserId?: string;
  action: string;
  details?: Prisma.InputJsonValue;
}) {
  await prisma.adminAuditLog.create({ data: input });
}

function done(action: string) {
  revalidatePath("/backoffice", "layout");
  redirect(`/backoffice/clients?done=${action}`);
}

export async function extendTrial(formData: FormData) {
  const admin = await assertAdmin();
  const targetUserId = String(formData.get("userId") || "");
  const days = boundedInteger(formData.get("days"), 1, 365);

  const subscription = await prisma.subscription.findUnique({
    where: { userId: targetUserId },
    select: { status: true, trialEndsAt: true },
  });
  if (!subscription) throw new Error("Subscrição não encontrada.");

  const now = new Date();
  const base =
    subscription.trialEndsAt && subscription.trialEndsAt > now
      ? subscription.trialEndsAt
      : now;
  const trialEndsAt = new Date(base.getTime() + days * 86_400_000);

  await prisma.$transaction([
    prisma.subscription.update({
      where: { userId: targetUserId },
      data: { status: "TRIAL", trialEndsAt, restaurantLimit: 1 },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorId: admin.id,
        targetUserId,
        action: "TRIAL_EXTENDED",
        details: {
          days,
          previousStatus: subscription.status,
          previousTrialEndsAt: subscription.trialEndsAt?.toISOString() || null,
          trialEndsAt: trialEndsAt.toISOString(),
        },
      },
    }),
  ]);

  done("trial");
}

export async function grantAiCredits(formData: FormData) {
  const admin = await assertAdmin();
  const targetUserId = String(formData.get("userId") || "");
  const amount = boundedInteger(formData.get("amount"), 1, 100_000);
  const reason = String(formData.get("reason") || "Oferta comercial").slice(0, 200);

  await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.update({
      where: { userId: targetUserId },
      data: { aiCredits: { increment: amount }, restaurantLimit: 1 },
      select: { aiCredits: true },
    });
    const reference = `admin_grant:${admin.id}:${randomUUID()}`;
    await tx.aiCreditTransaction.create({
      data: {
        userId: targetUserId,
        amount,
        balanceAfter: subscription.aiCredits,
        kind: "ADMIN_GRANT",
        feature: "ADMIN",
        description: reason,
        reference,
      },
    });
    await tx.adminAuditLog.create({
      data: {
        actorId: admin.id,
        targetUserId,
        action: "AI_CREDITS_GRANTED",
        details: { amount, reason, balanceAfter: subscription.aiCredits, reference },
      },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  done("credits");
}

export async function grantEmails(formData: FormData) {
  const admin = await assertAdmin();
  const targetUserId = String(formData.get("userId") || "");
  const amount = boundedInteger(formData.get("amount"), 1, 1_000_000);
  const reason = String(formData.get("reason") || "Oferta comercial").slice(0, 200);

  const subscription = await prisma.subscription.update({
    where: { userId: targetUserId },
    data: { emailBalance: { increment: amount }, restaurantLimit: 1 },
    select: { emailBalance: true },
  });
  await audit({
    actorId: admin.id,
    targetUserId,
    action: "EMAILS_GRANTED",
    details: { amount, reason, balanceAfter: subscription.emailBalance },
  });

  done("emails");
}

export async function updateSubscription(formData: FormData) {
  const admin = await assertAdmin();
  const targetUserId = String(formData.get("userId") || "");
  const planValue = String(formData.get("plan") || "ESSENTIALS");
  const statusValue = String(formData.get("status") || "TRIAL");
  const plan = ["ESSENTIALS", "GROWTH"].includes(planValue) ? planValue : "ESSENTIALS";
  const status = ["TRIAL", "ACTIVE", "PAST_DUE", "CANCELED"].includes(statusValue)
    ? statusValue
    : "TRIAL";

  const before = await prisma.subscription.findUnique({
    where: { userId: targetUserId },
    select: { plan: true, status: true, trialEndsAt: true },
  });
  if (!before) throw new Error("Subscrição não encontrada.");

  const trialEndsAt =
    status === "TRIAL"
      ? before.trialEndsAt && before.trialEndsAt > new Date()
        ? before.trialEndsAt
        : new Date(Date.now() + 7 * 86_400_000)
      : null;
  const planChangedAt = new Date();
  const planChanged = before.plan !== plan;

  await prisma.$transaction([
    prisma.subscription.update({
      where: { userId: targetUserId },
      data: {
        plan,
        status,
        trialEndsAt,
        priceMonthly: plan === "GROWTH" ? 75 : 55,
        restaurantLimit: 1,
        ...(planChanged ? {
          emailBalance: monthlyEmailAllowance(plan),
          emailsSent: 0,
          emailAllowanceAnchorAt: planChangedAt,
          emailAllowanceResetAt: nextMonthlyEmailReset(planChangedAt, planChangedAt),
        } : {}),
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorId: admin.id,
        targetUserId,
        action: "SUBSCRIPTION_UPDATED",
        details: {
          from: { plan: before.plan, status: before.status },
          to: { plan, status },
        },
      },
    }),
  ]);

  done("subscription");
}

export async function updateCostSettings(formData: FormData) {
  const admin = await assertAdmin();
  const emailCostMicros = Math.round(Number(formData.get("emailCost") || 0) * 1_000_000);
  const aiCreditCostMicros = Math.round(Number(formData.get("aiCreditCost") || 0) * 1_000_000);
  const whatsappCostMicros = Math.round(Number(formData.get("whatsappCost") || 0) * 1_000_000);

  for (const value of [emailCostMicros, aiCreditCostMicros, whatsappCostMicros]) {
    if (!Number.isFinite(value) || value < 0 || value > 100_000_000) {
      throw new Error("Custo unitário inválido.");
    }
  }

  await prisma.$transaction([
    prisma.adminSettings.upsert({
      where: { id: "global" },
      create: { id: "global", emailCostMicros, aiCreditCostMicros, whatsappCostMicros },
      update: { emailCostMicros, aiCreditCostMicros, whatsappCostMicros },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorId: admin.id,
        action: "COST_SETTINGS_UPDATED",
        details: { emailCostMicros, aiCreditCostMicros, whatsappCostMicros },
      },
    }),
  ]);

  revalidatePath("/backoffice", "layout");
  redirect("/backoffice/team?done=costs");
}
