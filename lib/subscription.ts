export const FREE_RESERVATION_LIMIT = 100;

export function hasTrialExpired(trialEndsAt: Date | null) {
  if (!trialEndsAt) return false;

  return new Date() > trialEndsAt;
}