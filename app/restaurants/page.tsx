import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/restaurant-auth";

export default async function RestaurantsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const restaurant = await prisma.restaurant.findFirst({
    where: { userId: user.id },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (!restaurant) redirect("/onboarding");
  redirect(`/restaurants/${restaurant.id}`);
}
