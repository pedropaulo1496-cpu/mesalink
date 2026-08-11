import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasAppAccess } from "@/lib/ai-billing";
import { InsufficientEmailAllowanceError } from "@/lib/email-billing";
import { prisma } from "@/lib/prisma";
import { sendReviewEmail } from "@/lib/send-review-email";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Não autorizado." }, { status: 401 });
  }
  return runDueReviews(null);
}

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
  return runDueReviews(restaurant.id);
}

async function runDueReviews(restaurantId: string | null) {
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ success: false, error: "Canal de email não configurado." }, { status: 503 });

  const now = new Date();
  const oldestEligibleDate = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const reservations = await prisma.reservation.findMany({
    where: {
      ...(restaurantId ? { restaurantId } : {}),
      email: { not: null },
      reviewEmailSentAt: null,
      status: { in: ["CONFIRMED", "SEATED", "FINISHED"] },
      date: { gte: oldestEligibleDate, lte: new Date(now.getTime() - 12 * 60 * 60 * 1000) },
      restaurant: { is: { reviewAutomationEnabled: true } },
    },
    include: {
      restaurant: { include: { user: { include: { subscription: true } } } },
    },
    orderBy: { date: "asc" },
    take: 500,
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const reservation of reservations) {
    const restaurant = reservation.restaurant;
    const owner = restaurant?.user;
    if (!restaurant || !owner || !hasAppAccess(owner.subscription) || !reservation.email) {
      skipped += 1;
      continue;
    }
    const eligibleAt = new Date(reservation.date.getTime() + Math.max(1, restaurant.reviewDelayHours) * 60 * 60 * 1000);
    if (eligibleAt > now) {
      skipped += 1;
      continue;
    }

    try {
      const delivery = await sendReviewEmail({
        to: reservation.email,
        customerName: reservation.customerName,
        restaurantName: restaurant.name,
        restaurantId: restaurant.id,
        userId: owner.id,
        reservationId: reservation.id,
      });
      const sentAt = new Date();
      await prisma.$transaction([
        prisma.reservation.update({ where: { id: reservation.id }, data: { reviewEmailSentAt: sentAt } }),
        prisma.marketingAction.upsert({
          where: { trackingToken: `review_request:${reservation.id}` },
          create: {
            restaurantId: restaurant.id,
            customerId: reservation.customerId,
            type: "REVIEW_REQUEST",
            status: "SENT",
            sentAt,
            trackingToken: `review_request:${reservation.id}`,
          },
          update: { status: "SENT", sentAt },
        }),
      ]);
      if (delivery.sent) sent += 1;
      else skipped += 1;
    } catch (error) {
      if (error instanceof InsufficientEmailAllowanceError) skipped += 1;
      else {
        failed += 1;
        console.error("Scheduled review email failed", reservation.id, error);
      }
    }
  }

  return NextResponse.json({ success: true, eligible: reservations.length, sent, skipped, failed });
}
