import type { Prisma } from "@prisma/client";

export function referralDayBounds(value: Date) {
  const start = new Date(value);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function getReferralCapacity(
  tx: Prisma.TransactionClient,
  restaurantId: string,
  desiredDate: Date,
  defaultCapacity: number,
) {
  const { start, end } = referralDayBounds(desiredDate);
  const [override, reservations] = await Promise.all([
    tx.referralDailyCapacity.findUnique({
      where: { restaurantId_date: { restaurantId, date: start } },
      select: { capacity: true, enabled: true },
    }),
    tx.reservation.aggregate({
      where: {
        restaurantId,
        date: { gte: start, lt: end },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      _sum: { guests: true },
    }),
  ]);

  const capacity = override ? (override.enabled ? override.capacity : 0) : Math.max(0, defaultCapacity);
  const reserved = Number(reservations._sum.guests || 0);
  return { capacity, reserved, remaining: Math.max(0, capacity - reserved), date: start };
}

export function referralDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}
