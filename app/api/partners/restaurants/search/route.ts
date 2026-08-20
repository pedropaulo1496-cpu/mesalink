import { NextResponse } from "next/server";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { externalPlacesConfigured, searchExternalRestaurants } from "@/lib/geoapify-places";
import { prisma } from "@/lib/prisma";

const EXTERNAL_PROVIDER = "GEOAPIFY";

export async function GET(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  if (!externalPlacesConfigured()) return NextResponse.json({ error: "A pesquisa de restaurantes ainda não está configurada.", configured: false }, { status: 503 });

  const url = new URL(request.url);
  const latitude = numberOrNull(url.searchParams.get("lat"));
  const longitude = numberOrNull(url.searchParams.get("lng"));
  try {
    const result = await searchExternalRestaurants({
      query: url.searchParams.get("q") || "",
      location: url.searchParams.get("location") || "",
      latitude,
      longitude,
      pageToken: url.searchParams.get("pageToken") || "",
    });
    const placeIds = result.restaurants.map((restaurant) => restaurant.placeId);
    const [existing, cachedProfiles] = placeIds.length ? await Promise.all([
      prisma.restaurant.findMany({
        where: { externalPlaceProvider: EXTERNAL_PROVIDER, externalPlaceId: { in: placeIds } },
        select: {
          id: true,
          externalPlaceId: true,
          email: true,
          referralNetworkEnabled: true,
          referralAutoAcceptEnabled: true,
          referralPaymentMethodId: true,
          referralPaymentBlockedAt: true,
        },
      }),
      prisma.externalRestaurantPlace.findMany({
        where: { provider: EXTERNAL_PROVIDER, placeId: { in: placeIds } },
        select: { placeId: true, websiteUrl: true, heroImage: true, galleryImages: true, description: true, openingHours: true, rating: true, reviewCount: true, ratingSource: true, priceLevel: true, contactEmail: true },
      }),
    ]) : [[], []];
    const byPlaceId = new Map(existing.filter((item) => item.externalPlaceId).map((item) => [item.externalPlaceId!, item]));
    const profileByPlaceId = new Map(cachedProfiles.map((item) => [item.placeId, item]));
    if (placeIds.length) {
      const seenAt = new Date();
      await prisma.externalRestaurantPlace.createMany({ data: placeIds.map((placeId) => ({ provider: EXTERNAL_PROVIDER, placeId, lastSeenAt: seenAt })), skipDuplicates: true });
      await prisma.externalRestaurantPlace.updateMany({ where: { provider: EXTERNAL_PROVIDER, placeId: { in: placeIds } }, data: { lastSeenAt: seenAt } });
    }
    return NextResponse.json({
      configured: true,
      restaurants: result.restaurants.map((restaurant) => {
        const local = byPlaceId.get(restaurant.placeId);
        const profile = profileByPlaceId.get(restaurant.placeId);
        const bookingReady = Boolean(local?.referralNetworkEnabled && local.referralAutoAcceptEnabled && local.referralPaymentMethodId && !local.referralPaymentBlockedAt);
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
          mesalinkRestaurantId: bookingReady ? local!.id : null,
          bookingReady,
          contactKnown: Boolean(local?.email || profile?.contactEmail || restaurant.email),
        };
      }),
      nextPageToken: result.nextPageToken,
    });
  } catch (error) {
    console.error("External restaurant search failed", error);
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
