import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasTrialExpired } from "@/lib/subscription";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      subscription: true,
      restaurants: {
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const subscription = user.subscription;

  if (
    subscription?.status === "TRIAL" &&
    hasTrialExpired(subscription.trialEndsAt)
  ) {
    redirect("/trial-expired");
  }

  const restaurant = user.restaurants[0];

  if (!restaurant) {
    redirect("/onboarding");
  }

  redirect(`/restaurants/${restaurant.id}`);
}