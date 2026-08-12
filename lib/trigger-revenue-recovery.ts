import { prisma } from "@/lib/prisma";

export async function triggerRevenueRecovery(restaurantId: string) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !restaurantId) return false;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { userId: true },
  });
  if (!restaurant?.userId) return false;

  try {
    const response = await fetch(`${(process.env.NEXT_PUBLIC_APP_URL || "https://www.mesalink.pt").replace(/\/+$/, "")}/api/restaurants/${restaurantId}/revenue-ai/sync`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
        "x-mesalink-user-id": restaurant.userId,
      },
      cache: "no-store",
    });
    return response.ok;
  } catch (error) {
    console.warn("Could not trigger Revenue AI recovery", restaurantId, error);
    return false;
  }
}
