import { prisma } from "@/lib/prisma";

export async function canAccessApp(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      subscription: true,
    },
  });

  if (!user) return false;

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