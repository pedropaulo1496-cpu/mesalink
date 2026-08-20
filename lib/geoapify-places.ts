const PROVIDER = "GEOAPIFY" as const;
const PAGE_SIZE = 20;

type GeoapifyProperties = {
  place_id?: string;
  name?: string;
  formatted?: string;
  address_line1?: string;
  address_line2?: string;
  lat?: number;
  lon?: number;
  categories?: string[];
  result_type?: string;
  website?: string;
  description?: string;
  opening_hours?: string;
  wiki_and_media?: {
    image?: string;
    wikidata?: string;
    wikipedia?: string;
    wikimedia_commons?: string;
  };
  catering?: {
    stars?: string | number;
    cuisine?: string;
    capacity?: string;
    reservation?: string;
  };
  contact?: { phone?: string; email?: string; website?: string };
  datasource?: {
    raw?: Record<string, unknown> & {
      amenity?: string;
      cuisine?: string;
      email?: string;
      phone?: string;
      website?: string;
      image?: string;
      stars?: string | number;
      description?: string;
      opening_hours?: string;
      price?: string | number;
      osm_id?: string | number;
      osm_type?: string;
    };
  };
};

type GeoapifyFeature = {
  properties?: GeoapifyProperties;
  geometry?: { coordinates?: [number, number] };
};

type GeoapifyPayload = {
  features?: GeoapifyFeature[];
  results?: GeoapifyProperties[];
  error?: string;
  message?: string;
};

export type ExternalRestaurantPlace = {
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
};

function apiKey() {
  const value = process.env.GEOAPIFY_API_KEY?.trim();
  if (!value) throw new Error("GEOAPIFY_NOT_CONFIGURED");
  return value;
}

export function externalPlacesConfigured() {
  return Boolean(process.env.GEOAPIFY_API_KEY?.trim());
}

export async function searchExternalRestaurants(input: {
  query?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  pageToken?: string;
}) {
  const query = clean(input.query, 80);
  const location = clean(input.location, 100);
  const offset = pageOffset(input.pageToken);
  const hasCoordinates = validCoordinate(input.latitude, -90, 90) && validCoordinate(input.longitude, -180, 180);

  if (!query && !location && !hasCoordinates) {
    return { restaurants: [] as ExternalRestaurantPlace[], nextPageToken: null };
  }

  const locationPlaceId = location ? await geocodeLocationPlaceId(location) : "";
  const url = locationPlaceId
    ? placesUrl({ placeId: locationPlaceId, query, offset })
    : hasCoordinates
      ? placesUrl({ latitude: input.latitude!, longitude: input.longitude!, query, offset })
      : geocodingAmenitySearchUrl(query, offset);
  const response = await fetch(url, {
    headers: { Accept: "application/json", "Accept-Language": "pt-PT,pt;q=0.9" },
    cache: "no-store",
    signal: AbortSignal.timeout(9000),
  });
  const payload = await response.json().catch(() => null) as GeoapifyPayload | null;
  if (!response.ok) throw new Error(`GEOAPIFY_${response.status}:${payload?.message || payload?.error || "SEARCH_FAILED"}`);
  const features = payload?.features || (payload?.results || []).map((properties) => ({ properties }));
  const restaurants = features.map(normalizePlace).filter((place): place is ExternalRestaurantPlace => Boolean(place));
  return {
    restaurants,
    nextPageToken: restaurants.length === PAGE_SIZE ? String(offset + PAGE_SIZE) : null,
  };
}

export async function getExternalRestaurant(placeId: string) {
  const normalizedId = clean(placeId, 500);
  if (!normalizedId || !/^[A-Za-z0-9:_-]+$/.test(normalizedId)) throw new Error("EXTERNAL_PLACE_ID_INVALID");
  const url = new URL("https://api.geoapify.com/v2/place-details");
  url.searchParams.set("id", normalizedId);
  url.searchParams.set("features", "details");
  url.searchParams.set("lang", "pt");
  url.searchParams.set("apiKey", apiKey());
  const response = await fetch(url, {
    headers: { Accept: "application/json", "Accept-Language": "pt-PT,pt;q=0.9" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const payload = await response.json().catch(() => null) as GeoapifyPayload | null;
  if (!response.ok) throw new Error(`GEOAPIFY_${response.status}:${payload?.message || payload?.error || "DETAILS_FAILED"}`);
  const place = payload?.features?.map(normalizePlace).find((item): item is ExternalRestaurantPlace => Boolean(item)) || null;
  if (!place) throw new Error("EXTERNAL_PLACE_NOT_RESTAURANT");
  return place;
}

async function geocodeLocationPlaceId(location: string) {
  const url = new URL("https://api.geoapify.com/v1/geocode/search");
  url.searchParams.set("text", location);
  url.searchParams.set("filter", "countrycode:pt");
  url.searchParams.set("type", "locality");
  url.searchParams.set("format", "geojson");
  url.searchParams.set("lang", "pt");
  url.searchParams.set("limit", "5");
  url.searchParams.set("apiKey", apiKey());
  const response = await fetch(url, {
    headers: { Accept: "application/json", "Accept-Language": "pt-PT,pt;q=0.9" },
    cache: "no-store",
    signal: AbortSignal.timeout(7000),
  });
  const payload = await response.json().catch(() => null) as GeoapifyPayload | null;
  if (!response.ok) throw new Error(`GEOAPIFY_${response.status}:${payload?.message || payload?.error || "LOCATION_FAILED"}`);
  const features = payload?.features || [];
  const preferred = features.find((feature) => ["city", "district", "postcode", "suburb"].includes(feature.properties?.result_type || "")) || features[0];
  return preferred?.properties?.place_id?.trim() || "";
}

function geocodingAmenitySearchUrl(query: string, offset: number) {
  const url = new URL("https://api.geoapify.com/v1/geocode/search");
  url.searchParams.set("name", query);
  url.searchParams.set("filter", "countrycode:pt");
  url.searchParams.set("type", "amenity");
  url.searchParams.set("format", "geojson");
  url.searchParams.set("lang", "pt");
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("apiKey", apiKey());
  return url;
}

function placesUrl(input: { placeId?: string; latitude?: number; longitude?: number; query: string; offset: number }) {
  const url = new URL("https://api.geoapify.com/v2/places");
  url.searchParams.set("categories", restaurantCategoryForQuery(input.query));
  if (input.placeId) {
    url.searchParams.set("filter", `place:${input.placeId}`);
  } else if (input.latitude !== undefined && input.longitude !== undefined) {
    url.searchParams.set("filter", `circle:${input.longitude},${input.latitude},30000`);
    url.searchParams.set("bias", `proximity:${input.longitude},${input.latitude}`);
  }
  if (input.query && restaurantCategoryForQuery(input.query) === "catering.restaurant") {
    url.searchParams.set("name", input.query);
  }
  url.searchParams.set("lang", "pt");
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("offset", String(input.offset));
  url.searchParams.set("apiKey", apiKey());
  return url;
}

function restaurantCategoryForQuery(query: string) {
  const normalized = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const cuisines: Record<string, string> = {
    italiano: "italian", italiana: "italian", italian: "italian", pizza: "pizza",
    chines: "chinese", chinesa: "chinese", chinese: "chinese",
    japones: "japanese", japonesa: "japanese", sushi: "japanese", japanese: "japanese",
    indiano: "indian", indiana: "indian", indian: "indian",
    mexicano: "mexican", mexicana: "mexican", mexican: "mexican",
    tailandes: "thai", tailandesa: "thai", thai: "thai",
    vegetariano: "vegetarian", vegetariana: "vegetarian", vegetarian: "vegetarian",
    portugues: "regional", portuguesa: "regional", regional: "regional",
  };
  return cuisines[normalized] ? `catering.restaurant.${cuisines[normalized]}` : "catering.restaurant";
}

function normalizePlace(feature: GeoapifyFeature): ExternalRestaurantPlace | null {
  const place = feature.properties || {};
  const raw = place.datasource?.raw || {};
  const categories = place.categories || [];
  const isRestaurant = categories.some((category) => category === "catering.restaurant" || category.startsWith("catering.restaurant."))
    || raw.amenity === "restaurant";
  const placeId = place.place_id?.trim();
  const name = place.name?.trim() || (typeof raw.name === "string" ? raw.name.trim() : "");
  if (!placeId || !name || !isRestaurant) return null;
  const longitude = finiteOrNull(place.lon ?? feature.geometry?.coordinates?.[0]);
  const latitude = finiteOrNull(place.lat ?? feature.geometry?.coordinates?.[1]);
  const websiteUrl = firstString(place.website, place.contact?.website, raw.website, raw["contact:website"]);
  const heroImage = firstString(place.wiki_and_media?.image, raw.image);
  const rating = ratingOrNull(place.catering?.stars ?? raw.stars);
  return {
    provider: PROVIDER,
    placeId,
    name,
    address: place.formatted?.trim() || [place.address_line1, place.address_line2].filter(Boolean).join(", "),
    latitude,
    longitude,
    cuisine: cuisineLabel(raw.cuisine, categories),
    rating,
    reviewCount: null,
    priceLevel: priceLevelOrNull(raw.price),
    mapUrl: openStreetMapUrl(raw, latitude, longitude),
    businessStatus: "OPERATIONAL",
    phone: firstString(place.contact?.phone, raw.phone, raw["contact:phone"]),
    email: firstString(place.contact?.email, raw.email, raw["contact:email"]),
    websiteUrl,
    heroImage,
    galleryImages: heroImage ? [heroImage] : [],
    description: firstString(place.description, raw.description),
    openingHours: firstString(place.opening_hours, raw.opening_hours),
    ratingSource: rating === null ? "" : "CLASSIFICACAO_ESTABELECIMENTO",
  };
}

function cuisineLabel(value: unknown, categories: string[]) {
  if (typeof value === "string" && value.trim()) {
    return value.split(/[;,]/).map((item) => item.trim()).filter(Boolean).map(titleCase).join(" · ");
  }
  const category = categories.find((item) => item.startsWith("catering.restaurant."));
  return category ? titleCase(category.split(".").at(-1) || "Restaurante") : "Restaurante";
}

function openStreetMapUrl(raw: Record<string, unknown>, latitude: number | null, longitude: number | null) {
  const osmId = typeof raw.osm_id === "number" || typeof raw.osm_id === "string" ? String(raw.osm_id) : "";
  const osmType = typeof raw.osm_type === "string" ? ({ n: "node", w: "way", r: "relation" }[raw.osm_type] || raw.osm_type) : "";
  if (osmId && ["node", "way", "relation"].includes(osmType)) return `https://www.openstreetmap.org/${osmType}/${encodeURIComponent(osmId)}`;
  if (latitude !== null && longitude !== null) return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`;
  return "https://www.openstreetmap.org/";
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === "string" && Boolean(value.trim()))?.trim() || "";
}

function titleCase(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

function pageOffset(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 1000 ? parsed : 0;
}

function finiteOrNull(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function ratingOrNull(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(",", ".").replace(/[^\d.]/g, "")) : NaN;
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 5 ? parsed : null;
}

function priceLevelOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.min(4, Math.max(1, Math.round(value)));
  if (typeof value !== "string") return null;
  const symbols = (value.match(/[€$£]/g) || []).length;
  if (symbols) return Math.min(4, symbols);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(4, Math.max(1, Math.round(parsed))) : null;
}

function validCoordinate(value: number | null | undefined, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
