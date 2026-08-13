import { prisma } from "@/lib/prisma";

export type RevenueMeter = {
  total: number;
  direct: number;
  marketing: number;
  protected: number;
  partners: number;
  experiences: number;
  customersRecovered: number;
  reservations: number;
  roi: number;
  planCost: number;
};

export function monthRange(reference = new Date()) {
  return {
    from: new Date(reference.getFullYear(), reference.getMonth(), 1),
    to: new Date(reference.getFullYear(), reference.getMonth() + 1, 1),
  };
}

export async function getRevenueMeter(restaurantId: string, from: Date, to: Date): Promise<RevenueMeter> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      averageTicket: true,
      user: { select: { subscription: { select: { priceMonthly: true } } } },
    },
  });
  if (!restaurant) throw new Error("Restaurant not found");
  const averageTicket = Number(restaurant.averageTicket || 25);

  const [reservations, marketingActions, protectedPayments] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        restaurantId,
        date: { gte: from, lt: to },
        status: { notIn: ["CANCELLED", "REJECTED", "NO_SHOW", "PENDING_PAYMENT"] },
      },
      select: {
        id: true,
        guests: true,
        source: true,
        experienceId: true,
        estimatedRevenue: true,
        payment: { select: { status: true, baseAmount: true, addOnsAmount: true, kind: true } },
      },
    }),
    prisma.marketingAction.findMany({
      where: {
        restaurantId,
        convertedAt: { gte: from, lt: to },
        status: { in: ["BOOKED", "CONVERTED", "RECOVERED"] },
      },
      select: { customerId: true, reservationId: true, actualRevenue: true, estimatedRevenue: true },
    }),
    prisma.reservationPayment.findMany({
      where: { restaurantId, kind: "DEPOSIT", status: "PAID", paidAt: { gte: from, lt: to } },
      select: { baseAmount: true },
    }),
  ]);

  let direct = 0;
  let partners = 0;
  let experiences = 0;
  let total = 0;
  const marketingReservationIds = new Set(marketingActions.map((action) => action.reservationId).filter(Boolean));
  for (const reservation of reservations) {
    const paidExperience = reservation.experienceId && reservation.payment?.status === "PAID" && reservation.payment.kind === "EXPERIENCE"
      ? Number(reservation.payment.baseAmount) + Number(reservation.payment.addOnsAmount)
      : 0;
    const value = paidExperience || Number(reservation.estimatedRevenue || reservation.guests * averageTicket);
    total += value;
    if (reservation.source === "PARTNER_NETWORK") partners += value;
    else if (reservation.experienceId) experiences += value;
    else if (reservation.source === "PUBLIC" && !marketingReservationIds.has(reservation.id)) direct += value;
  }

  const marketing = marketingActions.reduce(
    (sum, action) => sum + Number(action.actualRevenue || action.estimatedRevenue || 0),
    0,
  );
  const protectedRevenue = protectedPayments.reduce((sum, payment) => sum + Number(payment.baseAmount), 0);
  const customersRecovered = new Set(marketingActions.map((action) => action.customerId).filter(Boolean)).size;
  const planCost = Number(restaurant.user?.subscription?.priceMonthly || 0);
  const attributable = total;

  return {
    total,
    direct,
    marketing,
    protected: protectedRevenue,
    partners,
    experiences,
    customersRecovered,
    reservations: reservations.length,
    roi: planCost > 0 ? Math.round((attributable / planCost) * 10) / 10 : 0,
    planCost,
  };
}
