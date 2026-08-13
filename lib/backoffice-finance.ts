import type Stripe from "stripe";
import { AI_CREDIT_PACKS } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

type FinanceMonth = {
  key: string;
  label: string;
  revenueCents: number;
  expenseCents: number;
  profitCents: number;
  creditGrossCents: number;
  creditNetCents: number;
  stripeFeesCents: number;
  commissionCents: number;
  usageCostCents: number;
  providerCostCents: number;
};

const monthKey = (date: Date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
const monthStart = (date: Date, offset = 0) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1));
const monthLabel = (date: Date) => new Intl.DateTimeFormat("pt-PT", { month: "short", timeZone: "UTC" }).format(date).replace(".", "");

function packPriceCents(credits: number) {
  return Object.values(AI_CREDIT_PACKS).find((pack) => pack.credits === credits)?.priceCents || 0;
}

export async function getBackofficeFinance(now = new Date()) {
  const firstMonth = monthStart(now, -5);
  const monthDates = Array.from({ length: 6 }, (_, index) => monthStart(firstMonth, index));
  const months = new Map<string, FinanceMonth>(monthDates.map((date) => [monthKey(date), {
    key: monthKey(date),
    label: monthLabel(date),
    revenueCents: 0,
    expenseCents: 0,
    profitCents: 0,
    creditGrossCents: 0,
    creditNetCents: 0,
    stripeFeesCents: 0,
    commissionCents: 0,
    usageCostCents: 0,
    providerCostCents: 0,
  }]));

  const [users, settings, commissions, creditPurchases, aiUsage, emailUsage, whatsappUsage, domainOrders] = await Promise.all([
    prisma.user.findMany({
      where: { isAdmin: false, salesProfile: null, referralPartner: null },
      select: {
        id: true,
        salesPlanCommissionPercent: true,
        subscription: { select: { status: true, priceMonthly: true, stripeCustomerId: true } },
        salesRepresentative: { select: { active: true, defaultPlanCommissionPercent: true } },
      },
    }),
    prisma.adminSettings.findUnique({ where: { id: "global" } }),
    prisma.salesCommission.findMany({
      where: { earnedAt: { gte: firstMonth } },
      select: { sourceType: true, commissionAmount: true, earnedAt: true },
    }),
    prisma.aiCreditTransaction.findMany({
      where: { kind: "PURCHASE", createdAt: { gte: firstMonth } },
      select: { amount: true, refundedCents: true, stripeChargeId: true, createdAt: true },
    }),
    prisma.aiCreditTransaction.findMany({
      where: { kind: "USAGE", amount: { lt: 0 }, createdAt: { gte: firstMonth } },
      select: { amount: true, feature: true, createdAt: true },
    }),
    prisma.emailUsage.findMany({
      where: { status: "SENT", createdAt: { gte: firstMonth } },
      select: { sentAt: true, createdAt: true },
    }),
    prisma.whatsAppUsage.findMany({
      where: { status: "SENT", createdAt: { gte: firstMonth } },
      select: { sentAt: true, createdAt: true },
    }),
    prisma.domainOrder.findMany({
      where: { kind: "PURCHASE", status: { in: ["PURCHASED", "DNS_PENDING", "ACTIVE"] }, OR: [{ createdAt: { gte: firstMonth } }, { purchasedAt: { gte: firstMonth } }] },
      select: { providerPriceCents: true, purchasedAt: true, createdAt: true, stripeChargeId: true },
    }),
  ]);

  const costSettings = settings || { emailCostMicros: 400, aiCreditCostMicros: 10_000, whatsappCostMicros: 5_000 };
  const customerIds = new Set(users.flatMap((user) => user.subscription?.stripeCustomerId ? [user.subscription.stripeCustomerId] : []));
  const creditByCharge = new Map(creditPurchases.flatMap((purchase) => purchase.stripeChargeId ? [[purchase.stripeChargeId, purchase] as const] : []));
  const seenCreditCharges = new Set<string>();

  if (customerIds.size && process.env.STRIPE_SECRET_KEY) {
    try {
      const charges = await stripe.charges.list({
        created: { gte: Math.floor(firstMonth.getTime() / 1000) },
        limit: 100,
        expand: ["data.balance_transaction"],
      }).autoPagingToArray({ limit: 1000 });

      for (const charge of charges) {
        const customerId = typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
        if (!customerId || !customerIds.has(customerId) || !charge.paid) continue;
        const month = months.get(monthKey(new Date(charge.created * 1000)));
        if (!month) continue;
        const captured = Math.max(0, charge.amount_captured - charge.amount_refunded);
        const balance = charge.balance_transaction as Stripe.BalanceTransaction | null;
        const fee = balance && typeof balance !== "string" ? balance.fee : 0;
        month.revenueCents += captured;
        month.stripeFeesCents += fee;
        if (creditByCharge.has(charge.id)) {
          month.creditGrossCents += captured;
          month.creditNetCents += Math.max(0, captured - fee);
          seenCreditCharges.add(charge.id);
        }
      }
    } catch (error) {
      console.error("Backoffice finance Stripe timeline failed", error);
    }
  }

  for (const purchase of creditPurchases) {
    if (purchase.stripeChargeId && seenCreditCharges.has(purchase.stripeChargeId)) continue;
    const month = months.get(monthKey(purchase.createdAt));
    if (!month) continue;
    const gross = Math.max(0, packPriceCents(purchase.amount) - purchase.refundedCents);
    month.revenueCents += gross;
    month.creditGrossCents += gross;
    month.creditNetCents += gross;
  }

  for (const commission of commissions) {
    const month = months.get(monthKey(commission.earnedAt));
    if (!month) continue;
    const cents = Math.round(Number(commission.commissionAmount) * 100);
    month.commissionCents += cents;
    if (commission.sourceType === "AI_CREDITS") month.creditNetCents = Math.max(0, month.creditNetCents - cents);
  }

  for (const usage of aiUsage) {
    if (["EMAIL_BUNDLE", "WHATSAPP_BUNDLE"].includes(usage.feature || "")) continue;
    const month = months.get(monthKey(usage.createdAt));
    if (month) month.usageCostCents += Math.round(Math.abs(usage.amount) * costSettings.aiCreditCostMicros / 10_000);
  }
  for (const usage of emailUsage) {
    const month = months.get(monthKey(usage.sentAt || usage.createdAt));
    if (month) month.usageCostCents += Math.round(costSettings.emailCostMicros / 10_000);
  }
  for (const usage of whatsappUsage) {
    const month = months.get(monthKey(usage.sentAt || usage.createdAt));
    if (month) month.usageCostCents += Math.round(costSettings.whatsappCostMicros / 10_000);
  }
  for (const order of domainOrders) {
    const month = months.get(monthKey(order.purchasedAt || order.createdAt));
    if (month) month.providerCostCents += order.providerPriceCents;
  }

  const result = [...months.values()].map((month) => {
    month.expenseCents = month.stripeFeesCents + month.commissionCents + month.usageCostCents + month.providerCostCents;
    month.profitCents = month.revenueCents - month.expenseCents;
    return month;
  });

  const activePlans = users.filter((user) => user.subscription?.status === "ACTIVE");
  const grossMrrCents = activePlans.reduce((sum, user) => sum + (user.subscription?.priceMonthly || 0) * 100, 0);
  const planCommissionCents = activePlans.reduce((sum, user) => {
    if (!user.salesRepresentative?.active) return sum;
    const percent = Number(user.salesPlanCommissionPercent ?? user.salesRepresentative.defaultPlanCommissionPercent);
    return sum + Math.round((user.subscription?.priceMonthly || 0) * percent);
  }, 0);
  const current = result.at(-1)!;
  const previous = result.at(-2)!;

  return {
    grossMrrCents,
    planCommissionCents,
    netMrrCents: grossMrrCents - planCommissionCents,
    current,
    previous,
    months: result,
  };
}
