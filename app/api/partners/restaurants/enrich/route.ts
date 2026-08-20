import { NextResponse } from "next/server";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { getGoogleRestaurant } from "@/lib/google-places";
import { prisma } from "@/lib/prisma";
import { discoverRestaurantContact, discoverRestaurantPresentation } from "@/lib/restaurant-contact-discovery";

const GOOGLE_PROVIDER = "GOOGLE_PLACES";
const MAX_PLACES = 8;
const CACHE_MS = 30 * 24 * 60 * 60 * 1000;

export const maxDuration = 15;

export async function POST(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const provider = body?.provider === GOOGLE_PROVIDER ? GOOGLE_PROVIDER : "";
  const rawPlaceIds: unknown[] = Array.isArray(body?.placeIds) ? body.placeIds : [];
  const validPlaceIds = rawPlaceIds.filter((value): value is string => typeof value === "string" && /^[A-Za-z0-9:_-]{8,500}$/.test(value));
  const placeIds: string[] = [...new Set(validPlaceIds.slice(0, MAX_PLACES))];
  if (!provider || !placeIds.length) return NextResponse.json({ restaurants: [] });

  const cachedRows = await prisma.externalRestaurantPlace.findMany({
    where: { provider, placeId: { in: placeIds } },
    select: profileSelect,
  });
  const cached = new Map(cachedRows.map((row) => [row.placeId, row]));
  const freshAfter = new Date(Date.now() - CACHE_MS);
  const restaurants = await Promise.all(placeIds.map(async (placeId) => {
    const row = cached.get(placeId);
    const photoAlreadyChecked = Boolean(row?.photoCheckedAt && row.photoCheckedAt > freshAfter);
    const contactAlreadyChecked = Boolean(row?.contactCheckedAt && row.contactCheckedAt > freshAfter);
    if (row?.enrichedAt && row.enrichedAt > freshAfter && (row.heroImage || photoAlreadyChecked) && contactAlreadyChecked) return profileFromRow(row);
    try {
      const place = await getGoogleRestaurant(placeId);
      const [websiteProfile, discoveredContact] = await Promise.all([
        place.websiteUrl ? discoverRestaurantPresentation(place.websiteUrl) : null,
        place.email ? Promise.resolve({ email: place.email, sourceUrl: place.websiteUrl }) : place.websiteUrl ? discoverRestaurantContact(place.websiteUrl) : null,
      ]);
      const officialHeroImage = websiteProfile?.heroImage || "";
      const liveHeroImage = officialHeroImage || place.heroImage;
      const galleryImages = uniqueStrings([...(websiteProfile?.galleryImages || []), ...place.galleryImages]).slice(0, 4);
      const rating = websiteProfile?.rating ?? place.rating;
      const reviewCount = websiteProfile?.rating != null ? websiteProfile.reviewCount : place.reviewCount;
      const ratingSource = websiteProfile?.rating != null ? websiteProfile.ratingSource : place.ratingSource;
      const profile = {
        provider,
        placeId,
        websiteUrl: websiteProfile?.websiteUrl || place.websiteUrl || null,
        heroImage: liveHeroImage || null,
        galleryImages: officialHeroImage ? galleryImages : [],
        description: websiteProfile?.description || place.description || null,
        openingHours: websiteProfile?.openingHours || place.openingHours || null,
        rating,
        reviewCount,
        ratingSource: ratingSource || null,
        priceLevel: websiteProfile?.priceLevel ?? place.priceLevel,
        contactEmail: discoveredContact?.email || null,
        contactCheckedAt: new Date(),
        contactSourceUrl: discoveredContact?.sourceUrl || null,
        photoSourceUrl: officialHeroImage ? websiteProfile?.websiteUrl || place.websiteUrl || null : null,
        published: Boolean(discoveredContact?.email && liveHeroImage),
        verifiedAt: discoveredContact?.email && liveHeroImage ? new Date() : null,
        enrichedAt: new Date(),
        photoCheckedAt: new Date(),
      };
      const saved = await prisma.externalRestaurantPlace.upsert({
        where: { placeId },
        create: { ...profile, firstSeenAt: new Date(), lastSeenAt: new Date() },
        update: profile,
        select: profileSelect,
      });
      return {
        ...profileFromRow(saved),
        heroImage: saved.heroImage || liveHeroImage,
        galleryImages: stringArray(saved.galleryImages).length ? stringArray(saved.galleryImages) : place.galleryImages,
        rating: place.rating ?? saved.rating,
        reviewCount: place.reviewCount ?? saved.reviewCount,
        ratingSource: place.ratingSource || saved.ratingSource || "",
        priceLevel: place.priceLevel ?? saved.priceLevel,
        photoAttribution: "photoAttribution" in place ? place.photoAttribution : "",
        photoAttributionUri: "photoAttributionUri" in place ? place.photoAttributionUri : "",
      };
    } catch (error) {
      console.error("External restaurant enrichment failed", placeId, error);
      return row ? profileFromRow(row) : null;
    }
  }));
  return NextResponse.json({ restaurants: restaurants.filter(Boolean) });
}

const profileSelect = {
  provider: true,
  placeId: true,
  websiteUrl: true,
  heroImage: true,
  galleryImages: true,
  description: true,
  openingHours: true,
  rating: true,
  reviewCount: true,
  ratingSource: true,
  priceLevel: true,
  contactEmail: true,
  contactCheckedAt: true,
  contactSourceUrl: true,
  enrichedAt: true,
  photoCheckedAt: true,
} as const;

function profileFromRow(row: {
  provider: string;
  placeId: string;
  websiteUrl: string | null;
  heroImage: string | null;
  galleryImages: unknown;
  description: string | null;
  openingHours: string | null;
  rating: number | null;
  reviewCount: number | null;
  ratingSource: string | null;
  priceLevel: number | null;
  contactEmail: string | null;
  contactCheckedAt: Date | null;
  enrichedAt: Date | null;
  photoCheckedAt: Date | null;
}) {
  return {
    provider: row.provider,
    placeId: row.placeId,
    websiteUrl: row.websiteUrl || "",
    heroImage: row.heroImage || "",
    galleryImages: stringArray(row.galleryImages),
    description: row.description || "",
    openingHours: row.openingHours || "",
    rating: row.rating,
    reviewCount: row.reviewCount,
    ratingSource: row.ratingSource || "",
    priceLevel: row.priceLevel,
    contactEmail: row.contactEmail || "",
  };
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, 4) : [];
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
