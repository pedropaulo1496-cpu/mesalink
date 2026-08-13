export const RESERVATION_SERVICE_FEE_PERCENT = 6;
export const RESERVATION_SERVICE_FEE_FIXED = 0.5;

export type NoShowRule = {
  enabled: boolean;
  minGuests: number;
  depositPerPerson: number;
  fridayEnabled: boolean;
  saturdayEnabled: boolean;
  specialDates: string[];
  cancellationHours: number;
  creditOnLateCancellation: boolean;
  paymentsReady: boolean;
};

export function money(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function reservationServiceFee(baseAmount: number) {
  if (baseAmount <= 0) return 0;
  return money(Math.max(RESERVATION_SERVICE_FEE_FIXED, baseAmount * (RESERVATION_SERVICE_FEE_PERCENT / 100)));
}

export function lisbonDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function lisbonWeekday(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Lisbon",
    weekday: "short",
  }).format(date);
}

export function noShowDepositForReservation(rule: NoShowRule, date: Date, guests: number) {
  if (!rule.enabled || !rule.paymentsReady || guests < 1) return null;
  const weekday = lisbonWeekday(date);
  const applies = guests >= rule.minGuests
    || (weekday === "Fri" && rule.fridayEnabled)
    || (weekday === "Sat" && rule.saturdayEnabled)
    || rule.specialDates.includes(lisbonDateKey(date));
  if (!applies) return null;
  const baseAmount = money(rule.depositPerPerson * guests);
  const serviceFee = reservationServiceFee(baseAmount);
  return { baseAmount, serviceFee, totalAmount: money(baseAmount + serviceFee) };
}
