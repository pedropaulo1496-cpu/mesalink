import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CommissionSourceType = "PLAN" | "AI_CREDITS" | "CUSTOM_DOMAIN" | "PARTNER_NETWORK" | "MANUAL";

export async function recordSalesCommission(input: {
  userId: string;
  sourceType: CommissionSourceType;
  sourceId: string;
  description: string;
  grossCents: number;
  currency?: string;
  earnedAt?: Date;
}) {
  if (!Number.isInteger(input.grossCents) || input.grossCents <= 0) return null;

  const client = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      salesRepresentativeId: true,
      salesPlanCommissionPercent: true,
      salesExtraCommissionPercent: true,
      salesRepresentative: {
        select: {
          active: true,
          defaultPlanCommissionPercent: true,
          defaultExtraCommissionPercent: true,
        },
      },
    },
  });
  if (!client?.salesRepresentativeId || !client.salesRepresentative?.active) return null;

  const percent = Number(
    input.sourceType === "PLAN"
      ? client.salesPlanCommissionPercent ?? client.salesRepresentative.defaultPlanCommissionPercent
      : client.salesExtraCommissionPercent ?? client.salesRepresentative.defaultExtraCommissionPercent,
  );
  if (!Number.isFinite(percent) || percent <= 0) return null;

  const grossAmount = input.grossCents / 100;
  const commissionAmount = Math.round(input.grossCents * (percent / 100)) / 100;

  try {
    return await prisma.salesCommission.create({
      data: {
        salesRepresentativeId: client.salesRepresentativeId,
        userId: input.userId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        description: input.description,
        grossAmount,
        commissionPercent: percent,
        commissionAmount,
        currency: (input.currency || "EUR").toUpperCase(),
        earnedAt: input.earnedAt || new Date(),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return prisma.salesCommission.findUnique({
        where: { sourceType_sourceId: { sourceType: input.sourceType, sourceId: input.sourceId } },
      });
    }
    throw error;
  }
}
