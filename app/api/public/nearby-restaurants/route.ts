import { type NextRequest, NextResponse } from "next/server";
import { getReferralCapacity } from "@/lib/referral-availability";
import { createNearbyReferralToken, distanceKm, hasLiveAvailability, isRestaurantOpenAt } from "@/lib/nearby-referrals";
import { hasPublicReservationAccess } from "@/lib/public-reservation-access";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") || "";
  const dateValue = request.nextUrl.searchParams.get("date") || "";
  const guests = Number(request.nextUrl.searchParams.get("guests"));
  const selectedDay = request.nextUrl.searchParams.get("day") || "";
  const selectedTime = request.nextUrl.searchParams.get("time") || "";
  const date = new Date(dateValue);
  if (!slug || !Number.isInteger(guests) || guests < 1 || guests > 200 || Number.isNaN(date.getTime()) || date <= new Date()) {
    return NextResponse.json({ restaurants: [] });
  }

  const source = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      outboundReferralPartner: { select: { id: true, status: true, stripeAccountId: true, stripeOnboardingComplete: true } },
      tables: { include: { reservations: { where: { date: { gte: new Date(date.getTime() - 2 * 60 * 60 * 1000), lt: new Date(date.getTime() + 2 * 60 * 60 * 1000) } } } } },
      reservations: { where: { date: { gte: new Date(date.getTime() - 2 * 60 * 60 * 1000), lt: new Date(date.getTime() + 2 * 60 * 60 * 1000) } }, select: { date: true, guests: true, status: true } },
    },
  });
  const sourceReady = source?.nearbyReferralEnabled
    && source.latitude != null && source.longitude != null
    && source.outboundReferralPartner?.status === "ACTIVE"
    && source.outboundReferralPartner.stripeOnboardingComplete
    && Boolean(source.outboundReferralPartner.stripeAccountId);
  if (!source || !sourceReady || hasLiveAvailability(source, date, guests)) return NextResponse.json({ restaurants: [] });

  const latitude = source.latitude!;
  const longitude = source.longitude!;
  const candidates = await prisma.restaurant.findMany({
    where: {
      id: { not: source.id },
      referralNetworkEnabled: true,
      referralAutoAcceptEnabled: true,
      referralPaymentMethodId: { not: null },
      referralPaymentBlockedAt: null,
      onlineReservationsEnabled: true,
      billingLegalName: { not: null },
      billingTaxId: { not: null },
      billingAddressLine1: { not: null },
      billingPostalCode: { not: null },
      billingCity: { not: null },
      billingCountry: { not: null },
      latitude: { gte: latitude - 0.35, lte: latitude + 0.35 },
      longitude: { gte: longitude - 0.45, lte: longitude + 0.45 },
    },
    include: {
      user: { select: { isAdmin: true, subscription: { select: { status: true, plan: true, trialEndsAt: true } } } },
      tables: { include: { reservations: { where: { date: { gte: new Date(date.getTime() - 2 * 60 * 60 * 1000), lt: new Date(date.getTime() + 2 * 60 * 60 * 1000) } } } } },
      reservations: { where: { date: { gte: new Date(date.getTime() - 2 * 60 * 60 * 1000), lt: new Date(date.getTime() + 2 * 60 * 60 * 1000) } }, select: { date: true, guests: true, status: true } },
    },
    take: 30,
  });

  const available = [] as Array<{ name: string; slug: string; address: string | null; cuisine: string | null; image: string | null; distanceKm: number; url: string }>;
  for (const candidate of candidates) {
    if (candidate.latitude == null || candidate.longitude == null || !hasPublicReservationAccess(candidate.user)) continue;
    const distance = distanceKm({ latitude, longitude }, { latitude: candidate.latitude, longitude: candidate.longitude });
    if (distance > 25 || !isRestaurantOpenAt(candidate as unknown as Record<string, unknown>, date) || !hasLiveAvailability(candidate, date, guests)) continue;
    const capacity = await getReferralCapacity(prisma, candidate.id, date, candidate.referralDefaultDailyCapacity);
    if (capacity.remaining < guests) continue;
    const referralDateValue = /^\d{4}-\d{2}-\d{2}$/.test(selectedDay) && /^\d{2}:\d{2}$/.test(selectedTime)
      ? `${selectedDay}T${selectedTime}`
      : date.toISOString();
    const token = createNearbyReferralToken({ sourceRestaurantId: source.id, destinationRestaurantId: candidate.id, date: referralDateValue, guests });
    const query = new URLSearchParams({
      date: /^\d{4}-\d{2}-\d{2}$/.test(selectedDay) ? selectedDay : dateValue.slice(0, 10),
      time: /^\d{2}:\d{2}$/.test(selectedTime) ? selectedTime : `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`,
      guests: String(guests),
      nearby_ref: token,
      from: source.name,
    });
    available.push({
      name: candidate.name,
      slug: candidate.slug,
      address: candidate.address,
      cuisine: candidate.referralProfileCuisine || candidate.websiteCuisine,
      image: candidate.referralProfileHeroImage || candidate.websiteHeroImage,
      distanceKm: Math.round(distance * 10) / 10,
      url: `/reserve/${candidate.slug}?${query.toString()}`,
    });
  }

  available.sort((a, b) => a.distanceKm - b.distanceKm);
  return NextResponse.json({ restaurants: available.slice(0, 3) }, { headers: { "Cache-Control": "no-store" } });
}
