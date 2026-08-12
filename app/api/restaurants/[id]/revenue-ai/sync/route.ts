import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasGrowthAccess } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";
import { dispatchRevenueAutopilotForRestaurant } from "@/lib/revenue-autopilot";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;
  const internalUserId = request.headers.get("x-mesalink-user-id");
  const internalRequest = Boolean(cronSecret && internalUserId && request.headers.get("authorization") === `Bearer ${cronSecret}`);
  const session = internalRequest ? null : await getServerSession(authOptions);
  if (!internalRequest && !session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: internalRequest ? { id: internalUserId! } : { email: session!.user!.email! },
    include: { subscription: true },
  });
  if (!hasGrowthAccess(user?.subscription)) return NextResponse.json({ error: "O Revenue AI está disponível no plano Growth." }, { status: 403 });
  const restaurant = user ? await prisma.restaurant.findFirst({ where: { id, userId: user.id } }) : null;
  if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });

  const now = new Date();
  const cancelledCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const noShowCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const averageTicket = Number(restaurant.averageTicket || 25);

  const reservations = await prisma.reservation.findMany({
    where: {
      restaurantId: id,
      source: { not: "PARTNER_NETWORK" },
      email: { not: null },
      OR: [
        { status: { in: ["CANCELLED", "REJECTED"] }, date: { gte: cancelledCutoff } },
        { status: "NO_SHOW", date: { gte: noShowCutoff, lte: now } },
      ],
    },
    select: { id: true, customerId: true, customerName: true, email: true, phone: true, guests: true, status: true },
    take: 250,
  });

  const opportunities = reservations.map((reservation) => ({
      sourceId: reservation.id,
      opportunityType: reservation.status === "NO_SHOW" ? "NO_SHOW" : "CANCELLED_RESERVATION",
      reservationId: reservation.id,
      customerId: reservation.customerId,
      contactName: reservation.customerName,
      contactEmail: reservation.email,
      contactPhone: reservation.phone,
      channel: "EMAIL",
      estimatedRevenue: reservation.guests * averageTicket,
      preview: reservation.status === "NO_SHOW" ? "Email automático para ajudar o cliente a remarcar após um no-show." : "Email automático para ajudar o cliente a escolher uma nova data.",
    }));

  for (const opportunity of opportunities) {
    await prisma.revenueConversation.upsert({
      where: { restaurantId_opportunityType_sourceId: { restaurantId: id, opportunityType: opportunity.opportunityType, sourceId: opportunity.sourceId } },
      create: {
        restaurantId: id,
        sourceId: opportunity.sourceId,
        opportunityType: opportunity.opportunityType,
        reservationId: opportunity.reservationId,
        customerId: opportunity.customerId,
        contactName: opportunity.contactName.slice(0, 120),
        contactEmail: opportunity.contactEmail,
        contactPhone: opportunity.contactPhone,
        channel: opportunity.channel,
        estimatedRevenue: opportunity.estimatedRevenue,
        lastMessagePreview: opportunity.preview,
        aiSummary: opportunity.preview,
      },
      update: {
        contactName: opportunity.contactName.slice(0, 120),
        contactEmail: opportunity.contactEmail,
        contactPhone: opportunity.contactPhone,
        channel: opportunity.channel,
        estimatedRevenue: opportunity.estimatedRevenue,
        aiSummary: opportunity.preview,
      },
    });
  }

  let automation = { attempted: 0, sent: 0, failed: 0, skipped: 0 };
  if (cronSecret && user) {
    automation = await dispatchRevenueAutopilotForRestaurant({
      restaurantId: id,
      userId: user.id,
      baseUrl: new URL(request.url).origin,
      secret: cronSecret,
    });
  }

  return NextResponse.json({ success: true, opportunities: opportunities.length, automation });
}
