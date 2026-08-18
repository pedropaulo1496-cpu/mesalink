import type { Prisma } from "@prisma/client";

export function validReservationSlot(day: string, time: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

export function reservationSlotFromDate(date: Date) {
  const iso = date.toISOString();
  return { day: iso.slice(0, 10), time: iso.slice(11, 16) };
}

export async function isReservationTimeBlocked(
  tx: Pick<Prisma.TransactionClient, "reservationTimeBlock">,
  restaurantId: string,
  date: Date,
  slot?: { day: string; time: string },
) {
  const normalized = slot && validReservationSlot(slot.day, slot.time) ? slot : reservationSlotFromDate(date);
  const block = await tx.reservationTimeBlock.findUnique({
    where: { restaurantId_day_time: { restaurantId, day: normalized.day, time: normalized.time } },
    select: { id: true },
  });
  return Boolean(block);
}
