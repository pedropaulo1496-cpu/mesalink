import { NextResponse } from "next/server";
import { hasGrowthAccess } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Não autorizado." }, { status: 401 });
  }

  const candidates = await prisma.restaurant.findMany({
    include: {
      user: { select: { id: true, subscription: true } },
    },
    orderBy: { updatedAt: "asc" },
    take: 100,
  });
  const restaurants = candidates.filter((restaurant) => hasGrowthAccess(restaurant.user?.subscription));
  const baseUrl = new URL(request.url).origin;
  const results: Array<Record<string, unknown>> = [];

  for (const restaurant of restaurants) {
    try {
      const response = await fetch(`${baseUrl}/api/restaurants/${restaurant.id}/revenue-ai/sync`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${secret}`,
          "x-mesalink-user-id": restaurant.userId,
        },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);
      results.push({
        restaurantId: restaurant.id,
        success: response.ok,
        opportunities: payload?.opportunities ?? 0,
        automation: payload?.automation ?? null,
        error: response.ok ? null : payload?.error || `HTTP ${response.status}`,
      });
    } catch (error) {
      results.push({
        restaurantId: restaurant.id,
        success: false,
        error: error instanceof Error ? error.message : "Falha no Revenue AI",
      });
    }
  }

  return NextResponse.json({ success: true, processed: restaurants.length, results });
}
