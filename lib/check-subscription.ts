import { prisma } from "@/lib/prisma";
import { hasTrialExpired } from "./subscription";

export async function canAccessApp(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      subscription: true,
    },
  });

  if (!user) {
    return false;
  }

  const subscription = user.subscription;

  if (
    subscription?.status === "TRIAL" &&
    hasTrialExpired(subscription.trialEndsAt)
  ) {
    return false;
  }

  return true;
}