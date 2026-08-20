import { prisma } from "@/lib/prisma";

const PROVIDER = "GOOGLE_PLACES" as const;
const PAGE_SIZE = 20;

type GoogleAuthorAttribution = {
  displayName?: string;
  uri?: string;
};

type GooglePhoto = {
  name?: string;
  authorAttributions?: GoogleAuthorAttribution[];
};

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  primaryTypeDisplayName?: { text?: string };
  businessStatus?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  editorialSummary?: { text?: string };
  photos?: GooglePhoto[];
};

type GoogleSearchResponse = {
  places?: GooglePlace[];
  nextPageToken?: string;
  error?: { message?: string };
};

export type GoogleRestaurantPlace = {
  provider: typeof PROVIDER;
  placeId: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  cuisine: string;
  rating: number | null;
  reviewCount: number | null;
  priceLevel: number | null;
  mapUrl: string;
  businessStatus: string;
  phone: string;
  email: string;
  websiteUrl: string;
  heroImage: string;
  galleryImages: string[];
  description: string;
  openingHours: string;
  ratingSource: string;
  photoAttribution: string;
  photoAttributionUri: string;
};

function apiKey() {
  const value = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!value) throw new Error("GOOGLE_PLACES_NOT_CONFIGURED");
  return value;
}

export function googlePlacesConfigured() {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY?.trim());
}

export async function searchGoogleRestaurants(input: {
  query?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  pageToken?: string;
}) {
  const query = clean(input.query, 80);
  const location = clean(input.location, 100);
  const pageToken = clean(input.pageToken, 1000);
  const hasCoordinates = validCoordinate(input.latitude, -90, 90) && validCoordinate(input.longitude, -180, 180);
  if (!query && !location && !hasCoordinates) return { restaurants: [] as GoogleRestaurantPlace[], nextPageToken: null };

  const textSearch = Boolean(query || location || pageToken);
  const endpoint = textSearch
    ? "https://places.googleapis.com/v1/places:searchText"
    : "https://places.googleapis.com/v1/places:searchNearby";
  const body = textSearch
    ? {
        textQuery: [query || "restaurantes", location ? `em ${location}` : ""].filter(Boolean).join(" "),
        pageSize: PAGE_SIZE,
        pageToken: pageToken || undefined,
        languageCode: "pt-PT",
        regionCode: "PT",
        includedType: "restaurant",
        strictTypeFiltering: true,
      }
    : {
        includedTypes: ["restaurant"],
        maxResultCount: PAGE_SIZE,
        languageCode: "pt-PT",
        regionCode: "PT",
        rankPreference: "POPULARITY",
        locationRestriction: {
          circle: { center: { latitude: input.latitude, longitude: input.longitude }, radius: 30000 },
        },
      };
  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.primaryTypeDisplayName",
    "places.businessStatus",
    "places.googleMapsUri",
    "places.websiteUri",
    "places.nationalPhoneNumber",
    "places.rating",
    "places.userRatingCount",
    "places.priceLevel",
    ...(textSearch ? ["nextPageToken"] : []),
  ].join(",");
  await claimGooglePlacesCalls(1);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey(),
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  const payload = await response.json().catch(() => null) as GoogleSearchResponse | null;
  if (!response.ok) throw new Error(`GOOGLE_PLACES_${response.status}:${payload?.error?.message || "SEARCH_FAILED"}`);
  return {
    restaurants: (payload?.places || []).map((place) => normalizePlace(place)).filter((place): place is GoogleRestaurantPlace => Boolean(place)),
    nextPageToken: payload?.nextPageToken || null,
  };
}

export async function getGoogleRestaurant(placeId: string) {
  const normalizedId = clean(placeId, 500);
  if (!normalizedId || !/^[A-Za-z0-9_-]+$/.test(normalizedId)) throw new Error("GOOGLE_PLACE_ID_INVALID");
  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(normalizedId)}`);
  url.searchParams.set("languageCode", "pt-PT");
  url.searchParams.set("regionCode", "PT");
  await claimGooglePlacesCalls(1);
  const response = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey(),
      "X-Goog-FieldMask": "id,displayName,formattedAddress,location,primaryTypeDisplayName,businessStatus,googleMapsUri,websiteUri,nationalPhoneNumber,rating,userRatingCount,priceLevel,regularOpeningHours,editorialSummary,photos",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(9000),
  });
  const payload = await response.json().catch(() => null) as (GooglePlace & { error?: { message?: string } }) | null;
  if (!response.ok) throw new Error(`GOOGLE_PLACES_${response.status}:${payload?.error?.message || "DETAILS_FAILED"}`);
  const place = payload ? normalizePlace(payload, true) : null;
  if (!place) throw new Error("GOOGLE_PLACE_NOT_RESTAURANT");
  return place;
}

export async function googlePhotoUri(placeId: string, maxWidthPx = 1200) {
  const normalizedId = clean(placeId, 500);
  if (!normalizedId || !/^[A-Za-z0-9_-]+$/.test(normalizedId)) throw new Error("GOOGLE_PLACE_ID_INVALID");
  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(normalizedId)}`);
  url.searchParams.set("languageCode", "pt-PT");
  await claimGooglePlacesCalls(1);
  const details = await fetch(url, {
    headers: { "X-Goog-Api-Key": apiKey(), "X-Goog-FieldMask": "photos" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const place = await details.json().catch(() => null) as GooglePlace | null;
  const photoName = place?.photos?.[0]?.name;
  if (!details.ok || !photoName) return null;
  const mediaUrl = new URL(`https://places.googleapis.com/v1/${photoName}/media`);
  mediaUrl.searchParams.set("maxWidthPx", String(Math.min(1600, Math.max(400, Math.round(maxWidthPx)))));
  mediaUrl.searchParams.set("skipHttpRedirect", "true");
  mediaUrl.searchParams.set("key", apiKey());
  await claimGooglePlacesCalls(1);
  const media = await fetch(mediaUrl, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  const payload = await media.json().catch(() => null) as { photoUri?: string } | null;
  return media.ok && payload?.photoUri ? payload.photoUri : null;
}

function normalizePlace(place: GooglePlace, includePhoto = false): GoogleRestaurantPlace | null {
  const placeId = place.id?.trim();
  const name = place.displayName?.text?.trim();
  if (!placeId || !name) return null;
  const photo = includePhoto ? place.photos?.[0] : undefined;
  const attribution = photo?.authorAttributions?.[0];
  return {
    provider: PROVIDER,
    placeId,
    name,
    address: place.formattedAddress?.trim() || "Portugal",
    latitude: finiteOrNull(place.location?.latitude),
    longitude: finiteOrNull(place.location?.longitude),
    cuisine: place.primaryTypeDisplayName?.text?.trim() || "Restaurante",
    rating: finiteOrNull(place.rating),
    reviewCount: integerOrNull(place.userRatingCount),
    priceLevel: googlePriceLevel(place.priceLevel),
    mapUrl: place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId)}`,
    businessStatus: place.businessStatus || "OPERATIONAL",
    phone: place.nationalPhoneNumber?.trim() || "",
    email: "",
    websiteUrl: place.websiteUri?.trim() || "",
    heroImage: photo?.name ? `/api/partners/restaurants/photo?placeId=${encodeURIComponent(placeId)}` : "",
    galleryImages: [],
    description: place.editorialSummary?.text?.trim() || "",
    openingHours: place.regularOpeningHours?.weekdayDescriptions?.join(" · ") || "",
    ratingSource: place.rating == null ? "" : "GOOGLE",
    photoAttribution: attribution?.displayName?.trim() || "",
    photoAttributionUri: attribution?.uri?.trim() || "",
  };
}

function googlePriceLevel(value?: string) {
  return ({ PRICE_LEVEL_FREE: 1, PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4 } as Record<string, number>)[value || ""] || null;
}

function finiteOrNull(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function integerOrNull(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : null;
}

function validCoordinate(value: number | null | undefined, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function claimGooglePlacesCalls(units: number) {
  const limit = Math.max(50, Math.min(10000, Number(process.env.GOOGLE_PLACES_DAILY_CALL_LIMIT || 500) || 500));
  const period = new Date().toISOString().slice(0, 10);
  const usage = await prisma.externalApiUsage.upsert({
    where: { id: `${PROVIDER}:${period}` },
    create: { id: `${PROVIDER}:${period}`, provider: PROVIDER, period, callCount: units },
    update: { callCount: { increment: units } },
    select: { callCount: true },
  });
  if (usage.callCount > limit) throw new Error("GOOGLE_PLACES_DAILY_LIMIT_REACHED");
}
