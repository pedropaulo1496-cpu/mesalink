type ReservationAccount = {
  isAdmin?: boolean | null;
  subscription?: {
    status?: string | null;
    plan?: string | null;
    trialEndsAt?: Date | null;
  } | null;
} | null;

export function hasPublicReservationAccess(user: ReservationAccount) {
  if (user?.isAdmin) return true;

  const subscription = user?.subscription;
  if (!subscription) return false;

  const status = String(subscription.status || "").toUpperCase();
  const plan = String(subscription.plan || "").toUpperCase();

  if (status === "ACTIVE" && ["ESSENTIALS", "GROWTH", "PRO"].includes(plan)) {
    return true;
  }

  return Boolean(
    status === "TRIAL"
      && subscription.trialEndsAt
      && subscription.trialEndsAt > new Date(),
  );
}
