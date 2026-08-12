import type Stripe from "stripe";
import { calculateClientHealth, healthSuggestion } from "@/lib/client-health";
import { prisma } from "@/lib/prisma";
import type { StaffIdentity } from "@/lib/staff-auth";
import { stripe } from "@/lib/stripe";

type StripeMetrics = {
  revenueCents: number;
  stripeFeeCents: number;
  payments: number;
  connected: boolean;
};

async function stripeMetrics(customerId: string | null): Promise<StripeMetrics> {
  if (!customerId || !process.env.STRIPE_SECRET_KEY) {
    return { revenueCents: 0, stripeFeeCents: 0, payments: 0, connected: false };
  }
  try {
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 100,
      expand: ["data.balance_transaction"],
    });
    return charges.data.reduce<StripeMetrics>((total, charge) => {
      if (!charge.paid) return total;
      const balance = charge.balance_transaction as Stripe.BalanceTransaction | null;
      total.revenueCents += Math.max(0, charge.amount_captured - charge.amount_refunded);
      total.stripeFeeCents += balance && typeof balance !== "string" ? balance.fee : 0;
      total.payments += 1;
      return total;
    }, { revenueCents: 0, stripeFeeCents: 0, payments: 0, connected: true });
  } catch (error) {
    console.error("Backoffice Stripe metrics failed", error);
    return { revenueCents: 0, stripeFeeCents: 0, payments: 0, connected: false };
  }
}

export async function getBackofficeClients(staff: StaffIdentity, query = "") {
  const settings = (await prisma.adminSettings.findUnique({ where: { id: "global" } })) || {
    emailCostMicros: 400,
    aiCreditCostMicros: 10_000,
    whatsappCostMicros: 5_000,
  };
  const normalizedQuery = query.trim();
  const users = await prisma.user.findMany({
    where: {
      isAdmin: false,
      salesProfile: null,
      ...(staff.role === "SALES" ? { salesRepresentativeId: staff.salesRepresentativeId } : {}),
      ...(normalizedQuery ? {
        OR: [
          { name: { contains: normalizedQuery, mode: "insensitive" as const } },
          { email: { contains: normalizedQuery, mode: "insensitive" as const } },
          { restaurants: { some: { name: { contains: normalizedQuery, mode: "insensitive" as const } } } },
        ],
      } : {}),
    },
    include: {
      subscription: true,
      salesRepresentative: {
        select: { id: true, name: true, email: true, defaultPlanCommissionPercent: true, defaultExtraCommissionPercent: true },
      },
      restaurants: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          websiteEnabled: true,
          updatedAt: true,
          _count: { select: { reservations: true } },
        },
      },
      _count: {
        select: { emailUsages: true, receivedPromotions: true, salesCommissions: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const now = new Date();
  return Promise.all(users.map(async (user) => {
    const restaurant = user.restaurants[0];
    const [payments, sentEmails, usedAi, whatsappMessages, domainCosts, commissions, promoEmails] = await Promise.all([
      stripeMetrics(user.subscription?.stripeCustomerId || null),
      prisma.emailUsage.count({ where: { userId: user.id, status: "SENT" } }),
      prisma.aiCreditTransaction.aggregate({
        where: { userId: user.id, kind: "USAGE", feature: { notIn: ["EMAIL_BUNDLE", "WHATSAPP_BUNDLE"] }, amount: { lt: 0 } },
        _sum: { amount: true },
      }),
      prisma.whatsAppUsage.count({ where: { userId: user.id, status: "SENT" } }),
      prisma.domainOrder.aggregate({
        where: { restaurant: { userId: user.id }, kind: "PURCHASE", status: { in: ["PURCHASED", "DNS_PENDING", "ACTIVE"] } },
        _sum: { providerPriceCents: true },
      }),
      prisma.salesCommission.groupBy({
        by: ["status"],
        where: { userId: user.id },
        _sum: { commissionAmount: true },
      }),
      prisma.adminPromotion.count({ where: { targetUserId: user.id, status: "SENT" } }),
    ]);
    const aiCreditsUsed = Math.abs(usedAi._sum.amount || 0);
    const usageCostCents = Math.round(
      ((sentEmails + promoEmails) * settings.emailCostMicros + aiCreditsUsed * settings.aiCreditCostMicros + whatsappMessages * settings.whatsappCostMicros) / 10_000,
    );
    const commissionCents = Math.round(commissions.reduce((sum, item) => sum + Number(item._sum.commissionAmount || 0), 0) * 100);
    const pendingCommissionCents = Math.round(commissions.filter((item) => item.status === "PENDING").reduce((sum, item) => sum + Number(item._sum.commissionAmount || 0), 0) * 100);
    const providerCostCents = domainCosts._sum.providerPriceCents || 0;
    const totalCostCents = payments.stripeFeeCents + providerCostCents + usageCostCents + commissionCents;
    const health = calculateClientHealth({
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      lastActiveAt: user.lastActiveAt,
      restaurantUpdatedAt: restaurant?.updatedAt || null,
      hasRestaurant: Boolean(restaurant),
      reservationCount: restaurant?._count.reservations || 0,
      subscriptionStatus: user.subscription?.status || null,
      trialEndsAt: user.subscription?.trialEndsAt || null,
    }, now);

    return {
      ...user,
      isNewLast30Days: user.createdAt >= new Date(now.getTime() - 30 * 86_400_000),
      restaurant,
      payments,
      sentEmails,
      aiCreditsUsed,
      whatsappMessages,
      promoEmails,
      usageCostCents,
      providerCostCents,
      commissionCents,
      pendingCommissionCents,
      totalCostCents,
      marginCents: payments.revenueCents - totalCostCents,
      health,
      suggestion: healthSuggestion({
        health,
        hasRestaurant: Boolean(restaurant),
        reservationCount: restaurant?._count.reservations || 0,
        websiteEnabled: restaurant?.websiteEnabled || false,
        aiCredits: user.subscription?.aiCredits || 0,
        status: user.subscription?.status || null,
      }),
    };
  }));
}

export type BackofficeClient = Awaited<ReturnType<typeof getBackofficeClients>>[number];
