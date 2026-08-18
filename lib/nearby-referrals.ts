import { createHmac, timingSafeEqual } from "crypto";
import type { Prisma } from "@prisma/client";
import { createReferralCode } from "@/lib/referrals";
import { prisma } from "@/lib/prisma";

const TOKEN_LIFETIME_MS = 30 * 60 * 1000;

export type NearbyReferralPayload = {
  sourceRestaurantId: string;
  destinationRestaurantId: string;
  date: string;
  guests: number;
  expiresAt: number;
};

function tokenSecret() {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET_NOT_CONFIGURED");
  return secret;
}

export function createNearbyReferralToken(input: Omit<NearbyReferralPayload, "expiresAt">) {
  const payload: NearbyReferralPayload = { ...input, expiresAt: Date.now() + TOKEN_LIFETIME_MS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", tokenSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyNearbyReferralToken(token: string): NearbyReferralPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = createHmac("sha256", tokenSecret()).update(encoded).digest("base64url");
  const givenBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (givenBuffer.length !== expectedBuffer.length || !timingSafeEqual(givenBuffer, expectedBuffer)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as NearbyReferralPayload;
    if (!payload.sourceRestaurantId || !payload.destinationRestaurantId || !Number.isInteger(payload.guests) || payload.guests < 1 || payload.expiresAt <= Date.now()) return null;
    if (Number.isNaN(new Date(payload.date).getTime())) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function ensureRestaurantReferralPartner(restaurantId: string, userId: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, userId },
    select: { id: true, name: true, email: true, phone: true, billingCity: true, outboundReferralPartnerId: true, user: { select: { email: true } } },
  });
  if (!restaurant) return null;
  if (restaurant.outboundReferralPartnerId) {
    return prisma.referralPartner.findUnique({ where: { id: restaurant.outboundReferralPartnerId } });
  }

  const email = (restaurant.email || restaurant.user?.email || "").trim().toLowerCase();
  if (!email) throw new Error("RESTAURANT_EMAIL_REQUIRED");
  const existing = await prisma.referralPartner.findFirst({ where: { OR: [{ userId }, { email }] } });
  const partner = existing || await prisma.referralPartner.create({
    data: {
      userId,
      businessName: restaurant.name,
      partnerCode: createReferralCode(),
      partnerType: "RESTAURANT",
      email,
      phone: restaurant.phone,
      city: restaurant.billingCity,
      status: "PENDING",
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
      termsVersion: "restaurant-referrals-v1-2026-08-18",
    },
  });
  await prisma.restaurant.update({ where: { id: restaurant.id }, data: { outboundReferralPartnerId: partner.id } });
  return partner;
}

type AvailabilityRestaurant = {
  reservationMode: string;
  totalCapacity: number | null;
  tables: Array<{ capacity: number; reservations: Array<{ date: Date; status: string | null }> }>;
  reservations: Array<{ date: Date; guests: number; status: string | null }>;
};

const inactiveStatuses = ["CANCELLED", "FINISHED", "REJECTED", "NO_SHOW"];

export function hasLiveAvailability(restaurant: AvailabilityRestaurant, date: Date, guests: number) {
  const windowStart = new Date(date.getTime() - 2 * 60 * 60 * 1000);
  const windowEnd = new Date(date.getTime() + 2 * 60 * 60 * 1000);
  if (restaurant.reservationMode === "CAPACITY") {
    const booked = restaurant.reservations
      .filter((reservation) => !inactiveStatuses.includes(reservation.status || "") && reservation.date >= windowStart && reservation.date < windowEnd)
      .reduce((sum, reservation) => sum + reservation.guests, 0);
    return (restaurant.totalCapacity || 0) >= booked + guests;
  }
  return restaurant.tables.some((table) => table.capacity >= guests && !table.reservations.some((reservation) =>
    !inactiveStatuses.includes(reservation.status || "") && reservation.date >= windowStart && reservation.date < windowEnd,
  ));
}

export function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const radius = 6371;
  const rad = (value: number) => value * Math.PI / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function isRestaurantOpenAt(restaurant: Record<string, unknown>, date: Date) {
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const key = weekdays[date.getDay()];
  const minute = date.getHours() * 60 + date.getMinutes();
  const ranges = [restaurant[`${key}Lunch`], restaurant[`${key}Dinner`]].filter((value): value is string => typeof value === "string");
  return ranges.some((range) => {
    const [start, end] = range.split("-").map((part) => part.trim());
    if (!start || !end) return false;
    const toMinutes = (value: string) => {
      const [hour, minutes] = value.split(":").map(Number);
      return hour * 60 + minutes;
    };
    const startMinute = toMinutes(start);
    let endMinute = toMinutes(end);
    let selectedMinute = minute;
    if (endMinute <= startMinute) {
      endMinute += 24 * 60;
      if (selectedMinute < startMinute) selectedMinute += 24 * 60;
    }
    return selectedMinute >= startMinute && selectedMinute <= endMinute;
  });
}

export type ReferralTx = Prisma.TransactionClient;
