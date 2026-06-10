import { prisma } from "@/lib/prisma";
import { hasTrialExpired } from "./subscription";

export async function canAccessApp(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { subscription: true },
  });

  if (!user?.subscription) {
    return false;
  }

  const subscription = user.subscription;

  if (subscription.status === "ACTIVE") {
    return true;
  }

  if (
    subscription.status === "TRIAL" &&
    !hasTrialExpired(subscription.trialEndsAt)
  ) {
    return true;
  }

  return false;
}