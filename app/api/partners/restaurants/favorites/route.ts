import { NextResponse } from "next/server";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { getGoogleRestaurant } from "@/lib/google-places";
import { prisma } from "@/lib/prisma";
import { isValidPublicRestaurantEmail } from "@/lib/restaurant-contact-discovery";

const GOOGLE_PROVIDER = "GOOGLE_PLACES";

export async function GET() {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const favorites = await prisma.referralPartnerFavorite.findMany({
    where: { partnerId: partner.id },
    orderBy: { createdAt: "desc" },
    select: { provider: true, placeId: true, name: true, address: true },
  });
  const placeIds = favorites.map((favorite) => favorite.placeId);
  const [profiles, localRestaurants] = placeIds.length ? await Promise.all([
    prisma.externalRestaurantPlace.findMany({
      where: { provider: GOOGLE_PROVIDER, placeId: { in: placeIds } },
      select: { provider: true, placeId: true, name: true, address: true, latitude: true, longitude: true, cuisine: true, rating: true, reviewCount: true, priceLevel: true, mapUrl: true, websiteUrl: true, heroImage: true, galleryImages: true, description: true, openingHours: true, ratingSource: true, contactEmail: true },
    }),
    prisma.restaurant.findMany({
      where: { externalPlaceProvider: GOOGLE_PROVIDER, externalPlaceId: { in: placeIds } },
      select: { id: true, externalPlaceId: true, referralNetworkEnabled: true, referralAutoAcceptEnabled: true, referralPaymentMethodId: true, referralPaymentBlockedAt: true },
    }),
  ]) : [[], []];
  const profileById = new Map(profiles.map((profile) => [profile.placeId, profile]));
  const localById = new Map(localRestaurants.map((restaurant) => [restaurant.externalPlaceId, restaurant]));
  return NextResponse.json({
    favorites: favorites.map((favorite) => {
      const profile = profileById.get(favorite.placeId);
      const local = localById.get(favorite.placeId);
      const bookingReady = Boolean(local?.referralNetworkEnabled && local.referralAutoAcceptEnabled && local.referralPaymentMethodId && !local.referralPaymentBlockedAt);
      return {
        ...favorite,
        restaurant: profile ? {
          provider: profile.provider,
          placeId: profile.placeId,
          name: profile.name || favorite.name,
          primaryType: "restaurant",
          address: profile.address || favorite.address || "Portugal",
          latitude: profile.latitude,
          longitude: profile.longitude,
          cuisine: profile.cuisine || "Restaurante",
          rating: profile.rating,
          reviewCount: profile.reviewCount,
          priceLevel: profile.priceLevel,
          mapUrl: profile.mapUrl || "",
          websiteUrl: profile.websiteUrl || "",
          heroImage: profile.heroImage || "",
          galleryImages: stringArray(profile.galleryImages),
          description: profile.description || "Restaurante disponível para pedido de reserva.",
          openingHours: profile.openingHours || "",
          ratingSource: profile.ratingSource || "",
          contactEmail: profile.contactEmail || "",
          mesalinkRestaurantId: bookingReady ? local!.id : null,
          bookingReady,
        } : null,
      };
    }),
  });
}

export async function POST(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const input = await favoriteInput(request);
  if (!input) return NextResponse.json({ error: "Restaurante inválido." }, { status: 400 });
  const [place, cached] = await Promise.all([
    getGoogleRestaurant(input.placeId).catch(() => null),
    prisma.externalRestaurantPlace.findUnique({ where: { placeId: input.placeId }, select: { contactEmail: true, heroImage: true } }),
  ]);
  if (!place || !isValidPublicRestaurantEmail(cached?.contactEmail || "") || !(cached?.heroImage || place.heroImage)) {
    return NextResponse.json({ error: "Este restaurante ainda não tem fotografia e email público validados." }, { status: 409 });
  }
  const favorite = await prisma.referralPartnerFavorite.upsert({
    where: { partnerId_provider_placeId: { partnerId: partner.id, provider: input.provider, placeId: input.placeId } },
    create: { partnerId: partner.id, provider: input.provider, placeId: input.placeId, name: place.name, address: place.address || null },
    update: { name: place.name, address: place.address || null },
    select: { provider: true, placeId: true, name: true, address: true },
  });
  return NextResponse.json({ favorite });
}

export async function DELETE(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const input = await favoriteInput(request);
  if (!input) return NextResponse.json({ error: "Restaurante inválido." }, { status: 400 });
  await prisma.referralPartnerFavorite.deleteMany({
    where: { partnerId: partner.id, provider: input.provider, placeId: input.placeId },
  });
  return NextResponse.json({ success: true });
}

async function favoriteInput(request: Request) {
  const body = await request.json().catch(() => null);
  const provider = body?.provider === GOOGLE_PROVIDER ? GOOGLE_PROVIDER : "";
  const placeId = typeof body?.placeId === "string" && /^[A-Za-z0-9:_-]{8,500}$/.test(body.placeId) ? body.placeId : "";
  return provider && placeId ? { provider, placeId } : null;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, 4) : [];
}
