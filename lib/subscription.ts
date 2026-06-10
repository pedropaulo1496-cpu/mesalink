export function hasTrialExpired(trialEndsAt: Date | null) {
  if (!trialEndsAt) return false;

  return new Date() > trialEndsAt;
}