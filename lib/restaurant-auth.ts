import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, isAdmin: true },
  });
}

export async function isRestaurantOwner(restaurantId: string) {
  if (!restaurantId) return false;
  const user = await getCurrentUser();
  if (!user) return false;
  if (user.isAdmin) return true;
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, userId: user.id },
    select: { id: true },
  });
  return Boolean(restaurant);
}

export async function assertRestaurantOwner(restaurantId: string) {
  if (!(await isRestaurantOwner(restaurantId))) {
    throw new Error("Não tem acesso a este restaurante.");
  }
}
