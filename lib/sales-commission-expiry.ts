import { prisma } from "@/lib/prisma";
import { commissionInvoiceDeadline, commissionPeriod, commissionPeriodBounds } from "@/lib/sales-commission-statements";

export async function expireOverdueSalesCommissions(salesRepresentativeId?: string, now = new Date()) {
  const pending = await prisma.salesCommission.findMany({
    where: {
      ...(salesRepresentativeId ? { salesRepresentativeId } : {}),
      status: "PENDING",
      earnedAt: { lt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)) },
    },
    select: { salesRepresentativeId: true, earnedAt: true },
  });

  const periods = new Map<string, { salesRepresentativeId: string; period: string }>();
  for (const item of pending) {
    const period = commissionPeriod(item.earnedAt);
    periods.set(`${item.salesRepresentativeId}:${period}`, { salesRepresentativeId: item.salesRepresentativeId, period });
  }

  for (const item of periods.values()) {
    if (commissionInvoiceDeadline(item.period) > now) continue;
    const statement = await prisma.salesCommissionStatement.findUnique({
      where: { salesRepresentativeId_period: item },
      select: { status: true },
    });
    if (statement && ["PENDING", "VERIFIED", "PAID"].includes(statement.status)) continue;

    const { start, end } = commissionPeriodBounds(item.period);
    await prisma.$transaction([
      prisma.salesCommission.updateMany({
        where: { salesRepresentativeId: item.salesRepresentativeId, status: "PENDING", earnedAt: { gte: start, lt: end } },
        data: { status: "FORFEITED", notes: "Prazo mensal de faturação expirado." },
      }),
      prisma.salesCommissionStatement.upsert({
        where: { salesRepresentativeId_period: item },
        create: { ...item, status: "EXPIRED" },
        update: { status: "EXPIRED" },
      }),
    ]);
  }
}
