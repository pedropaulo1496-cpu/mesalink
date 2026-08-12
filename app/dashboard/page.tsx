import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
      salesProfile: { select: { id: true, active: true } },
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

  if (user.isAdmin || user.salesProfile?.active) {
    redirect("/backoffice");
  }

  const restaurant = user.restaurants[0];

  if (!restaurant) {
    redirect("/onboarding");
  }

  redirect(`/restaurants/${restaurant.id}`);
}
