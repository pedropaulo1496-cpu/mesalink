export function commissionPeriod(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function commissionPeriodBounds(period: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw new Error("Período inválido.");
  const [year, month] = period.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

export function isClosedCommissionPeriod(period: string, now = new Date()) {
  return period < commissionPeriod(now);
}

export function commissionInvoiceDeadline(period: string) {
  const { end } = commissionPeriodBounds(period);
  return new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 1));
}

export function isCommissionInvoiceExpired(period: string, now = new Date()) {
  return now >= commissionInvoiceDeadline(period);
}

export function commissionInvoiceDeadlineLabel(period: string) {
  const deadline = new Date(commissionInvoiceDeadline(period).getTime() - 1);
  return new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(deadline);
}

export function commissionPeriodLabel(period: string) {
  const { start } = commissionPeriodBounds(period);
  return new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric", timeZone: "UTC" }).format(start);
}
