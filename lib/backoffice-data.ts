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

async function stripeMetricsForCustomers(customerIds: string[]) {
  const metrics = new Map<string, StripeMetrics>();
  const wanted = new Set(customerIds.filter(Boolean));
  if (!wanted.size || !process.env.STRIPE_SECRET_KEY) return metrics;
  for (const customerId of wanted) metrics.set(customerId, { revenueCents: 0, stripeFeeCents: 0, payments: 0, connected: true });
  try {
    const charges = await stripe.charges.list({ limit: 100, expand: ["data.balance_transaction"] }).autoPagingToArray({ limit: 1000 });
    for (const charge of charges) {
      const customerId = typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
      if (!customerId || !wanted.has(customerId) || !charge.paid) continue;
      const current = metrics.get(customerId)!;
      const balance = charge.balance_transaction as Stripe.BalanceTransaction | null;
      current.revenueCents += Math.max(0, charge.amount_captured - charge.amount_refunded);
      current.stripeFeeCents += balance && typeof balance !== "string" ? balance.fee : 0;
      current.payments += 1;
    }
  } catch (error) {
    console.error("Backoffice bulk Stripe metrics failed", error);
    for (const customerId of wanted) metrics.set(customerId, { revenueCents: 0, stripeFeeCents: 0, payments: 0, connected: false });
  }
  return metrics;
}

export async function getBackofficeClients(staff: StaffIdentity, query = "") {
  const settings = (await prisma.adminSettings.findUnique({ where: { id: "global" } })) || {
    emailCostMicros: 400,
    aiCreditCostMicros: 10_000,
    whatsappCostMicros: 5_000,
  };
  const normalizedQuery = query.trim();
  const now = new Date();
  const impactThreshold = new Date(now.getTime() - 30 * 86_400_000);
  const users = await prisma.user.findMany({
    where: {
      isAdmin: false,
      salesProfile: null,
      ...(staff.role === "SALES" ? { salesRepresentativeId: staff.salesRepresentativeId } : {}),
      AND: [
        { OR: [{ referralPartner: null }, { restaurants: { some: {} } }] },
        ...(normalizedQuery ? [{ OR: [
          { id: normalizedQuery },
          { name: { contains: normalizedQuery, mode: "insensitive" as const } },
          { email: { contains: normalizedQuery, mode: "insensitive" as const } },
          { restaurants: { some: { OR: [
            { name: { contains: normalizedQuery, mode: "insensitive" as const } },
            { email: { contains: normalizedQuery, mode: "insensitive" as const } },
            { phone: { contains: normalizedQuery, mode: "insensitive" as const } },
            { address: { contains: normalizedQuery, mode: "insensitive" as const } },
          ] } } },
        ] }] : []),
      ],
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
          email: true,
          phone: true,
          address: true,
          websiteEnabled: true,
          updatedAt: true,
          reservations: {
            where: { createdAt: { gte: impactThreshold }, source: { not: "MANUAL" }, status: { notIn: ["CANCELLED", "REJECTED", "NO_SHOW"] } },
            select: { guests: true, estimatedRevenue: true, source: true },
          },
          marketingActions: {
            where: { convertedAt: { gte: impactThreshold } },
            select: { customerId: true, reservationId: true, estimatedRevenue: true, actualRevenue: true },
          },
          _count: { select: { reservations: true } },
        },
      },
      _count: {
        select: { emailUsages: true, receivedPromotions: true, salesCommissions: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: normalizedQuery ? 40 : 30,
  });

  const bulkPayments = normalizedQuery
    ? null
    : await stripeMetricsForCustomers(users.flatMap((user) => user.subscription?.stripeCustomerId ? [user.subscription.stripeCustomerId] : []));

  return Promise.all(users.map(async (user) => {
    const restaurant = user.restaurants[0];
    const [payments, sentEmails, usedAi, whatsappMessages, domainCosts, commissions, promoEmails] = await Promise.all([
      normalizedQuery
        ? stripeMetrics(user.subscription?.stripeCustomerId || null)
        : Promise.resolve(user.subscription?.stripeCustomerId
          ? bulkPayments?.get(user.subscription.stripeCustomerId) || { revenueCents: 0, stripeFeeCents: 0, payments: 0, connected: true }
          : { revenueCents: 0, stripeFeeCents: 0, payments: 0, connected: false }),
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
    const recentReservations = restaurant?.reservations || [];
    const recoveredActions = restaurant?.marketingActions || [];
    const impact = {
      reservations: recentReservations.length,
      guests: recentReservations.reduce((sum, reservation) => sum + reservation.guests, 0),
      partnerReservations: recentReservations.filter((reservation) => reservation.source === "PARTNER_NETWORK").length,
      reservationRevenueCents: Math.round(recentReservations.reduce((sum, reservation) => sum + Number(reservation.estimatedRevenue || 0), 0) * 100),
      recoveredCustomers: new Set(recoveredActions.map((action) => action.customerId).filter(Boolean)).size,
      recoveredRevenueCents: Math.round(recoveredActions.reduce((sum, action) => sum + (action.reservationId ? 0 : Number(action.actualRevenue ?? action.estimatedRevenue ?? 0)), 0) * 100),
    };
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
      impact,
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

export async function getBackofficeClientImpact(staff: StaffIdentity) {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const userScope = {
    isAdmin: false,
    salesProfile: null,
    OR: [{ referralPartner: null }, { restaurants: { some: {} } }],
    ...(staff.role === "SALES" ? { salesRepresentativeId: staff.salesRepresentativeId! } : {}),
  };
  const [restaurantRows, newAccounts] = await Promise.all([
    prisma.restaurant.findMany({ where: { user: { is: userScope } }, select: { id: true } }),
    prisma.user.count({ where: { ...userScope, createdAt: { gte: since } } }),
  ]);
  const restaurantIds = restaurantRows.map((restaurant) => restaurant.id);
  if (!restaurantIds.length) {
    return { newAccounts, reservations: 0, guests: 0, partnerReservations: 0, recoveredCustomers: 0, estimatedRevenueCents: 0 };
  }

  const [reservations, recovered] = await Promise.all([
    prisma.reservation.findMany({
      where: { restaurantId: { in: restaurantIds }, createdAt: { gte: since }, source: { not: "MANUAL" }, status: { notIn: ["CANCELLED", "REJECTED", "NO_SHOW"] } },
      select: { guests: true, source: true, estimatedRevenue: true },
    }),
    prisma.marketingAction.findMany({
      where: { restaurantId: { in: restaurantIds }, convertedAt: { gte: since } },
      select: { customerId: true, reservationId: true, estimatedRevenue: true, actualRevenue: true },
    }),
  ]);

  return {
    newAccounts,
    reservations: reservations.length,
    guests: reservations.reduce((sum, reservation) => sum + reservation.guests, 0),
    partnerReservations: reservations.filter((reservation) => reservation.source === "PARTNER_NETWORK").length,
    recoveredCustomers: new Set(recovered.map((action) => action.customerId || action.reservationId).filter(Boolean)).size,
    estimatedRevenueCents: Math.round((
      reservations.reduce((sum, reservation) => sum + Number(reservation.estimatedRevenue || 0), 0)
      + recovered.reduce((sum, action) => sum + (action.reservationId ? 0 : Number(action.actualRevenue ?? action.estimatedRevenue ?? 0)), 0)
    ) * 100),
  };
}

export type BackofficeClient = Awaited<ReturnType<typeof getBackofficeClients>>[number];
