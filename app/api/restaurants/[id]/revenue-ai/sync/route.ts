import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasGrowthAccess } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";
import { getRevenueChannelStatus, normalizeE164 } from "@/lib/revenue-twilio";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!hasGrowthAccess(user?.subscription)) return NextResponse.json({ error: "O Revenue AI está disponível no plano Growth." }, { status: 403 });
  const restaurant = user ? await prisma.restaurant.findFirst({ where: { id, userId: user.id } }) : null;
  if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const averageTicket = Number(restaurant.averageTicket || 25);
  const channelStatus = getRevenueChannelStatus(restaurant);
  const customerConsent = new Map<string, boolean>();

  const [reservations, customers] = await Promise.all([
    prisma.reservation.findMany({
      where: { restaurantId: id, source: { not: "PARTNER_NETWORK" }, date: { gte: ninetyDaysAgo }, status: { in: ["CANCELLED", "REJECTED", "NO_SHOW"] } },
      select: { id: true, customerId: true, customerName: true, email: true, phone: true, guests: true, status: true, date: true },
      take: 250,
    }),
    prisma.customer.findMany({
      where: { restaurantId: id },
      select: {
        id: true, name: true, email: true, phone: true, marketingOptIn: true, lastVisitAt: true, lastReservationAt: true,
        visitCount: true, totalVisits: true, createdAt: true,
        reservations: { where: { restaurantId: id }, select: { id: true, date: true }, orderBy: { date: "desc" }, take: 1 },
      },
      take: 1000,
    }),
  ]);

  for (const customer of customers) customerConsent.set(customer.id, customer.marketingOptIn);
  const chooseChannel = (email: string | null, phone: string | null, hasConsent: boolean) => channelStatus.whatsappProactiveReady && hasConsent && Boolean(normalizeE164(phone)) ? "WHATSAPP" : email ? "EMAIL" : "PHONE";

  const opportunities = [
    ...reservations.map((reservation) => ({
      sourceId: reservation.id,
      opportunityType: reservation.status === "NO_SHOW" ? "NO_SHOW" : "CANCELLED_RESERVATION",
      reservationId: reservation.id,
      customerId: reservation.customerId,
      contactName: reservation.customerName,
      contactEmail: reservation.email,
      contactPhone: reservation.phone,
      channel: chooseChannel(reservation.email, reservation.phone, Boolean(reservation.customerId && customerConsent.get(reservation.customerId))),
      estimatedRevenue: reservation.guests * averageTicket,
      preview: reservation.status === "NO_SHOW" ? "Reserva não compareceu; tentar recuperar e remarcar." : "Reserva cancelada; tentar perceber o motivo e remarcar.",
    })),
    ...customers.filter((customer) => {
      const lastContact = customer.lastVisitAt || customer.lastReservationAt || customer.reservations[0]?.date;
      return customer.marketingOptIn && Boolean(customer.email || normalizeE164(customer.phone)) && Boolean(lastContact && lastContact < sixtyDaysAgo);
    }).map((customer) => ({
      sourceId: customer.id,
      opportunityType: "INACTIVE_CUSTOMER",
      reservationId: null,
      customerId: customer.id,
      contactName: customer.name,
      contactEmail: customer.email,
      contactPhone: customer.phone,
      channel: chooseChannel(customer.email, customer.phone, customer.marketingOptIn),
      estimatedRevenue: averageTicket * 2,
      preview: "Cliente inativo há mais de 60 dias; conversa de reativação disponível.",
    })),
    ...customers.filter((customer) => customer.createdAt < fortyEightHoursAgo && customer.totalVisits === 0 && customer.visitCount === 0 && customer.reservations.length === 0 && Boolean(customer.email || customer.phone)).map((customer) => ({
      sourceId: customer.id,
      opportunityType: "ABANDONED_LEAD",
      reservationId: null,
      customerId: customer.id,
      contactName: customer.name,
      contactEmail: customer.email,
      contactPhone: customer.phone,
      channel: chooseChannel(customer.email, customer.phone, customer.marketingOptIn),
      estimatedRevenue: averageTicket * 2,
      preview: "Contacto sem visita ou reserva; precisa de resposta e qualificação.",
    })),
  ].slice(0, 500);

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

  return NextResponse.json({ success: true, opportunities: opportunities.length });
}
