import { NextResponse } from "next/server";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { googlePlacesConfigured, searchGoogleRestaurants } from "@/lib/google-places";
import { prisma } from "@/lib/prisma";

const GOOGLE_PROVIDER = "GOOGLE_PLACES";

export async function GET(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() || "";
  const location = url.searchParams.get("location")?.trim() || "";
  const latitude = numberOrNull(url.searchParams.get("lat"));
  const longitude = numberOrNull(url.searchParams.get("lng"));
  const pageToken = url.searchParams.get("pageToken") || "";
  const hasSearch = Boolean(query || location || (latitude !== null && longitude !== null));

  if (!googlePlacesConfigured()) {
    return NextResponse.json({ error: "A pesquisa de restaurantes está temporariamente indisponível.", configured: false }, { status: 503 });
  }

  try {
    const liveResult = hasSearch
      ? await searchGoogleRestaurants({ query, location, latitude, longitude, pageToken })
      : { restaurants: [], nextPageToken: null };
    const livePlaceIds = liveResult.restaurants.map((restaurant) => restaurant.placeId);
    const cachedProfiles = livePlaceIds.length ? await prisma.externalRestaurantPlace.findMany({
      where: { provider: GOOGLE_PROVIDER, placeId: { in: livePlaceIds } },
      select: { placeId: true, websiteUrl: true, heroImage: true, galleryImages: true, description: true, openingHours: true, rating: true, reviewCount: true, ratingSource: true, priceLevel: true, contactEmail: true },
    }) : [];
    const profileByPlaceId = new Map(cachedProfiles.map((item) => [item.placeId, item]));

    if (livePlaceIds.length) {
      const seenAt = new Date();
      await prisma.externalRestaurantPlace.createMany({
        data: livePlaceIds.map((placeId) => ({ provider: GOOGLE_PROVIDER, placeId, lastSeenAt: seenAt })),
        skipDuplicates: true,
      });
      await prisma.externalRestaurantPlace.updateMany({
        where: { provider: GOOGLE_PROVIDER, placeId: { in: livePlaceIds } },
        data: { lastSeenAt: seenAt },
      });
    }

    const live = liveResult.restaurants.map((restaurant) => {
      const profile = profileByPlaceId.get(restaurant.placeId);
      return {
        ...restaurant,
        websiteUrl: profile?.websiteUrl || restaurant.websiteUrl,
        heroImage: profile?.heroImage || restaurant.heroImage,
        galleryImages: stringArray(profile?.galleryImages).length ? stringArray(profile?.galleryImages) : restaurant.galleryImages,
        description: profile?.description || restaurant.description,
        openingHours: profile?.openingHours || restaurant.openingHours,
        rating: profile?.rating ?? restaurant.rating,
        reviewCount: profile?.reviewCount ?? restaurant.reviewCount,
        ratingSource: profile?.ratingSource || restaurant.ratingSource,
        priceLevel: profile?.priceLevel ?? restaurant.priceLevel,
        contactEmail: profile?.contactEmail || restaurant.email,
      };
    });

    const existing = livePlaceIds.length ? await prisma.restaurant.findMany({
      where: { externalPlaceProvider: GOOGLE_PROVIDER, externalPlaceId: { in: livePlaceIds } },
      select: {
        id: true,
        email: true,
        externalPlaceId: true,
        referralNetworkEnabled: true,
        referralAutoAcceptEnabled: true,
        referralPaymentMethodId: true,
        referralPaymentBlockedAt: true,
      },
    }) : [];
    const localByPlaceId = new Map(existing.map((item) => [item.externalPlaceId, item]));
    const restaurants = live.map((restaurant) => {
      const local = localByPlaceId.get(restaurant.placeId);
      const bookingReady = Boolean(local?.referralNetworkEnabled && local.referralAutoAcceptEnabled && local.referralPaymentMethodId && !local.referralPaymentBlockedAt);
      return {
        ...restaurant,
        mesalinkRestaurantId: bookingReady ? local!.id : null,
        bookingReady,
        contactKnown: Boolean(local?.email || restaurant.contactEmail),
      };
    });

    return NextResponse.json({
      configured: true,
      source: GOOGLE_PROVIDER,
      restaurants,
      nextPageToken: liveResult.nextPageToken,
    });
  } catch (error) {
    console.error("Google restaurant search failed", error);
    return NextResponse.json({ error: "Não foi possível pesquisar restaurantes agora.", configured: true }, { status: 502 });
  }
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, 4) : [];
}

function numberOrNull(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
