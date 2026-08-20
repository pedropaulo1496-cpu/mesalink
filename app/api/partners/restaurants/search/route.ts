import { NextResponse } from "next/server";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { externalPlacesConfigured, searchExternalRestaurants } from "@/lib/geoapify-places";
import { prisma } from "@/lib/prisma";

const GEO_PROVIDER = "GEOAPIFY";
const CURATED_PROVIDER = "CURATED";

export async function GET(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() || "";
  const location = url.searchParams.get("location")?.trim() || "";
  const latitude = numberOrNull(url.searchParams.get("lat"));
  const longitude = numberOrNull(url.searchParams.get("lng"));
  const pageToken = url.searchParams.get("pageToken") || "";

  try {
    const curatedRows = await prisma.externalRestaurantPlace.findMany({
      where: { provider: CURATED_PROVIDER, published: true, contactEmail: { not: null }, heroImage: { not: null } },
      orderBy: [{ city: "asc" }, { name: "asc" }],
      take: 120,
    });
    const curated = curatedRows
      .filter((row) => matchesDirectory(row, query, location))
      .map((row) => ({
        provider: CURATED_PROVIDER,
        placeId: row.placeId,
        name: row.name || "Restaurante",
        address: row.address || row.city || "Portugal",
        latitude: row.latitude,
        longitude: row.longitude,
        cuisine: row.cuisine || "Restaurante",
        rating: row.rating,
        reviewCount: row.reviewCount,
        priceLevel: row.priceLevel,
        mapUrl: row.mapUrl || mapSearchUrl(row.name || "Restaurante", row.address || row.city || "Portugal"),
        businessStatus: "OPERATIONAL",
        phone: row.phone || "",
        email: row.contactEmail || "",
        contactEmail: row.contactEmail || "",
        websiteUrl: row.websiteUrl || "",
        heroImage: row.heroImage || "",
        galleryImages: stringArray(row.galleryImages),
        description: row.description || "",
        openingHours: row.openingHours || "",
        ratingSource: row.ratingSource || "",
      }));

    let geoResult: Awaited<ReturnType<typeof searchExternalRestaurants>> = { restaurants: [], nextPageToken: null };
    if (externalPlacesConfigured() && (query || location || (latitude !== null && longitude !== null))) {
      try {
        geoResult = await searchExternalRestaurants({ query, location, latitude, longitude, pageToken });
      } catch (error) {
        console.error("Geoapify restaurant search failed; serving curated directory", error);
      }
    }

    const geoPlaceIds = geoResult.restaurants.map((restaurant) => restaurant.placeId);
    const cachedProfiles = geoPlaceIds.length ? await prisma.externalRestaurantPlace.findMany({
      where: { provider: GEO_PROVIDER, placeId: { in: geoPlaceIds } },
      select: { placeId: true, websiteUrl: true, heroImage: true, galleryImages: true, description: true, openingHours: true, rating: true, reviewCount: true, ratingSource: true, priceLevel: true, contactEmail: true },
    }) : [];
    const profileByPlaceId = new Map(cachedProfiles.map((item) => [item.placeId, item]));
    if (geoPlaceIds.length) {
      const seenAt = new Date();
      await prisma.externalRestaurantPlace.createMany({ data: geoPlaceIds.map((placeId) => ({ provider: GEO_PROVIDER, placeId, lastSeenAt: seenAt })), skipDuplicates: true });
      await prisma.externalRestaurantPlace.updateMany({ where: { provider: GEO_PROVIDER, placeId: { in: geoPlaceIds } }, data: { lastSeenAt: seenAt } });
    }
    const geo = geoResult.restaurants.map((restaurant) => {
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

    const combined = deduplicate([...curated, ...geo]);
    const externalKeys = combined.map((item) => ({ provider: item.provider, placeId: item.placeId }));
    const existing = externalKeys.length ? await prisma.restaurant.findMany({
      where: { OR: externalKeys.map((key) => ({ externalPlaceProvider: key.provider, externalPlaceId: key.placeId })) },
      select: {
        id: true,
        email: true,
        externalPlaceProvider: true,
        externalPlaceId: true,
        referralNetworkEnabled: true,
        referralAutoAcceptEnabled: true,
        referralPaymentMethodId: true,
        referralPaymentBlockedAt: true,
      },
    }) : [];
    const localByKey = new Map(existing.map((item) => [`${item.externalPlaceProvider}:${item.externalPlaceId}`, item]));
    const restaurants = combined.map((restaurant) => {
      const local = localByKey.get(`${restaurant.provider}:${restaurant.placeId}`);
      const bookingReady = Boolean(local?.referralNetworkEnabled && local.referralAutoAcceptEnabled && local.referralPaymentMethodId && !local.referralPaymentBlockedAt);
      return {
        ...restaurant,
        mesalinkRestaurantId: bookingReady ? local!.id : null,
        bookingReady,
        contactKnown: Boolean(local?.email || restaurant.contactEmail),
      };
    });

    return NextResponse.json({ configured: curatedRows.length > 0 || externalPlacesConfigured(), restaurants, nextPageToken: geoResult.nextPageToken });
  } catch (error) {
    console.error("External restaurant search failed", error);
    return NextResponse.json({ error: "Não foi possível pesquisar restaurantes agora.", configured: true }, { status: 502 });
  }
}

function matchesDirectory(row: { name: string | null; city: string | null; address: string | null; cuisine: string | null; description: string | null }, query: string, location: string) {
  const identity = normalize(`${row.name || ""} ${row.cuisine || ""} ${row.description || ""}`);
  const place = normalize(`${row.city || ""} ${row.address || ""}`);
  return (!query || identity.includes(normalize(query))) && (!location || place.includes(normalize(location)));
}

function deduplicate<T extends { provider: string; placeId: string; name: string; address: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalize(`${item.name}:${item.address}`).replace(/\b(portugal|pt)\b/g, "").replace(/\d{4}-\d{3}/g, "");
    const providerKey = `${item.provider}:${item.placeId}`;
    if (seen.has(key) || seen.has(providerKey)) return false;
    seen.add(key);
    seen.add(providerKey);
    return true;
  });
}

function mapSearchUrl(name: string, address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}`;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, 4) : [];
}

function numberOrNull(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
