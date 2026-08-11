import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { InsufficientAiCreditsError } from "@/lib/ai-billing";
import { runMarketingAutopilotForRestaurant } from "@/lib/marketing-autopilot";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ success: false, error: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const restaurantId = typeof body?.restaurantId === "string" ? body.restaurantId : "";
  const restaurant = restaurantId ? await prisma.restaurant.findFirst({
    where: { id: restaurantId, user: { email: session.user.email } },
    select: { id: true },
  }) : null;
  if (!restaurant) return NextResponse.json({ success: false, error: "Restaurante não encontrado." }, { status: 404 });

  try {
    const result = await runMarketingAutopilotForRestaurant(restaurant.id, { force: true });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof InsufficientAiCreditsError) {
      return NextResponse.json({ success: false, error: `São necessários 3 créditos AI. Saldo atual: ${error.available}.`, code: "INSUFFICIENT_AI_CREDITS" }, { status: 402 });
    }
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Falha no Marketing Autopilot." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Não autorizado." }, { status: 401 });
  }

  const restaurants = await prisma.restaurant.findMany({
    where: { marketingAutopilotEnabled: true },
    select: { id: true },
    take: 100,
  });
  const results = [];
  for (const restaurant of restaurants) {
    try {
      results.push({ restaurantId: restaurant.id, ...(await runMarketingAutopilotForRestaurant(restaurant.id)) });
    } catch (error) {
      results.push({ restaurantId: restaurant.id, error: error instanceof Error ? error.message : "Falha" });
    }
  }
  return NextResponse.json({ success: true, processed: restaurants.length, results });
}
