const DAY_MS = 24 * 60 * 60 * 1000;

export const REFERRAL_ATTENDANCE_CONFIRMATION_DAYS = 3;
export const REFERRAL_PARTNER_INVOICE_DAYS = 30;
export const REFERRAL_AUTHORIZATION_SAFETY_HOURS = 2;

export function referralAttendanceDeadline(reservationDate: Date) {
  return new Date(reservationDate.getTime() + REFERRAL_ATTENDANCE_CONFIRMATION_DAYS * DAY_MS);
}

export function referralAuthorizationRequiredUntil(reservationDate: Date) {
  return new Date(referralAttendanceDeadline(reservationDate).getTime() + REFERRAL_AUTHORIZATION_SAFETY_HOURS * 60 * 60 * 1000);
}

export function referralInvoiceDeadline(capturedAt: Date) {
  return new Date(capturedAt.getTime() + REFERRAL_PARTNER_INVOICE_DAYS * DAY_MS);
}

export function referralInvoiceCutoff(now = new Date()) {
  return new Date(now.getTime() - REFERRAL_PARTNER_INVOICE_DAYS * DAY_MS);
}

export function nextReferralPayoutAt(from = new Date()) {
  const date = new Date(from);
  const days = ((8 - date.getUTCDay()) % 7) || 7;
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(9, 0, 0, 0);
  return date;
}
