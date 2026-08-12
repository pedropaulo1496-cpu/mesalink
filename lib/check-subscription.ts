import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getUserWithSubscription = cache(async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
    include: {
      subscription: true,
    },
  });
});

export async function canAccessApp(email: string) {
  const user = await getUserWithSubscription(email);

  if (!user) return false;
  if (user.isAdmin) return true;

  const subscription = user.subscription;

  if (!subscription) return false;

  const now = new Date();

  const isActive =
    subscription.status === "ACTIVE" &&
    ["ESSENTIALS", "GROWTH"].includes(String(subscription.plan));

  if (isActive) return true;

  const trialActive =
    subscription.status === "TRIAL" &&
    subscription.trialEndsAt &&
    subscription.trialEndsAt > now;

  if (trialActive) return true;

  return false;
}
