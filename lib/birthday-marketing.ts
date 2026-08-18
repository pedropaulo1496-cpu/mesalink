export const BIRTHDAY_RESERVATION_IGNORED_STATUSES = [
  "CANCELLED",
  "REJECTED",
  "NO_SHOW",
  "PENDING_PAYMENT",
] as const;

export function calendarMonthRange(date: Date) {
  return {
    start: new Date(date.getFullYear(), date.getMonth(), 1),
    end: new Date(date.getFullYear(), date.getMonth() + 1, 1),
  };
}

export function birthdayOccurrenceWithinNextDays(
  birthDate: Date,
  today: Date,
  days: number,
) {
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const birthday = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate(),
  );

  if (birthday < todayStart) birthday.setFullYear(today.getFullYear() + 1);

  const difference = birthday.getTime() - todayStart.getTime();
  return difference > 0 && difference <= days * 24 * 60 * 60 * 1000
    ? birthday
    : null;
}

export function birthdayIsUpcomingThisMonth(birthDate: Date, today: Date) {
  return (
    birthDate.getMonth() === today.getMonth() &&
    birthDate.getDate() > today.getDate()
  );
}
