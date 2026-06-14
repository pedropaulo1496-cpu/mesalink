import { prisma } from "@/lib/prisma";
import { hasTrialExpired } from "./subscription";

export async function getUserSubscription(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { subscription: true },
  });

  return user?.subscription || null;
}

export async function canAccessApp(email: string) {
  const subscription = await getUserSubscription(email);

  if (!subscription) return false;

  if (subscription.status === "ACTIVE") return true;

  if (
    subscription.status === "TRIAL" &&
    !hasTrialExpired(subscription.trialEndsAt)
  ) {
    return true;
  }

  return false;
}

export async function canUsePro(email: string) {
  const subscription = await getUserSubscription(email);

  if (!subscription) return false;

  if (
    subscription.status === "TRIAL" &&
    !hasTrialExpired(subscription.trialEndsAt)
  ) {
    return true;
  }

  return subscription.status === "ACTIVE" && subscription.plan === "PRO";
}

export async function canUseWebsite(email: string) {
  const subscription = await getUserSubscription(email);

  if (!subscription) return false;

  if (
    subscription.status === "TRIAL" &&
    !hasTrialExpired(subscription.trialEndsAt)
  ) {
    return true;
  }

  return (
    subscription.status === "ACTIVE" &&
    subscription.websiteAddon === true
  );
}

export async function canUseTables(email: string) {
  return canUsePro(email);
}