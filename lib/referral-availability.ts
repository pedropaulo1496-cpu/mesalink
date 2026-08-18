import type { Prisma } from "@prisma/client";
import { reservationSlotFromDate } from "@/lib/reservation-time-blocks";

export function referralDayBounds(value: Date) {
  const start = new Date(value);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function getReferralCapacity(
  tx: Pick<Prisma.TransactionClient, "referralDailyCapacity" | "reservation" | "restaurant" | "reservationTimeBlock">,
  restaurantId: string,
  desiredDate: Date,
  defaultPartnerLimit: number,
) {
  const { start, end } = referralDayBounds(desiredDate);
  const windowStart = new Date(desiredDate.getTime() - 2 * 60 * 60 * 1000);
  const windowEnd = new Date(desiredDate.getTime() + 2 * 60 * 60 * 1000);
  const slot = reservationSlotFromDate(desiredDate);
  const [restaurant, override, reservations, timeBlock] = await Promise.all([
    tx.restaurant.findUnique({
      where: { id: restaurantId },
      select: { reservationMode: true, totalCapacity: true, tables: { select: { capacity: true } } },
    }),
    tx.referralDailyCapacity.findUnique({
      where: { restaurantId_date: { restaurantId, date: start } },
      select: { capacity: true, enabled: true },
    }),
    tx.reservation.findMany({
      where: {
        restaurantId,
        date: { gte: windowStart, lt: windowEnd },
        status: { notIn: ["CANCELLED", "FINISHED", "REJECTED", "NO_SHOW"] },
      },
      select: { guests: true, source: true },
    }),
    tx.reservationTimeBlock.findUnique({
      where: { restaurantId_day_time: { restaurantId, day: slot.day, time: slot.time } },
      select: { id: true },
    }),
  ]);

  const totalCapacity = restaurant?.reservationMode === "CAPACITY"
    ? Math.max(0, restaurant.totalCapacity || 0)
    : (restaurant?.tables || []).reduce((sum, table) => sum + table.capacity, 0);
  const configuredPartnerLimit = defaultPartnerLimit > 0 ? defaultPartnerLimit : totalCapacity;
  const partnerLimit = timeBlock ? 0 : override ? (override.enabled ? override.capacity : 0) : configuredPartnerLimit;
  const realReserved = reservations.reduce((sum, reservation) => sum + reservation.guests, 0);
  const partnerReserved = reservations
    .filter((reservation) => ["PARTNER_NETWORK", "NEARBY_REFERRAL"].includes(reservation.source))
    .reduce((sum, reservation) => sum + reservation.guests, 0);
  const realRemaining = Math.max(0, totalCapacity - realReserved);
  const partnerRemaining = Math.max(0, Math.min(totalCapacity, partnerLimit) - partnerReserved);

  return {
    capacity: Math.min(totalCapacity, partnerLimit),
    reserved: partnerReserved,
    remaining: Math.min(realRemaining, partnerRemaining),
    totalCapacity,
    realReserved,
    realRemaining,
    partnerLimit,
    partnerReserved,
    date: start,
    dayEnd: end,
  };
}

export function referralDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}
