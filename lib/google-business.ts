import { createCipheriv, createDecipheriv, createHmac, createHash, randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const SCOPE = "https://www.googleapis.com/auth/business.manage";

type GoogleLocation = {
  name: string;
  title?: string;
  storefrontAddress?: { addressLines?: string[]; postalCode?: string; locality?: string; administrativeArea?: string; regionCode?: string };
  metadata?: { placeId?: string; mapsUri?: string; newReviewUri?: string };
};

function secret() {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("NEXTAUTH_SECRET is required");
  return value;
}

function oauthConfig() {
  const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET;
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
  if (!clientId || !clientSecret || !baseUrl) return null;
  return { clientId, clientSecret, redirectUri: `${baseUrl}/api/google-business/callback` };
}

export function googleBusinessConfigured() {
  return Boolean(oauthConfig());
}

export function googleBusinessAuthorizationUrl(restaurantId: string, userId: string) {
  const config = oauthConfig();
  if (!config) return null;
  const state = signState({ restaurantId, userId, expiresAt: Date.now() + 10 * 60 * 1000 });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  return url.toString();
}

export function verifyGoogleBusinessState(value: string) {
  try {
    const [payload, signature] = value.split(".");
    if (!payload || !signature) return null;
    const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { restaurantId?: string; userId?: string; expiresAt?: number };
    if (!data.restaurantId || !data.userId || !data.expiresAt || data.expiresAt < Date.now()) return null;
    return data as { restaurantId: string; userId: string; expiresAt: number };
  } catch {
    return null;
  }
}

export async function connectGoogleBusiness({ restaurantId, code }: { restaurantId: string; code: string }) {
  const config = oauthConfig();
  if (!config) throw new Error("GOOGLE_NOT_CONFIGURED");
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: config.redirectUri, grant_type: "authorization_code" }),
  });
  const tokens = await tokenResponse.json() as { access_token?: string; refresh_token?: string; error?: string };
  if (!tokenResponse.ok || !tokens.access_token || !tokens.refresh_token) throw new Error(tokens.error || "GOOGLE_TOKEN_FAILED");

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { id: true, name: true, address: true } });
  if (!restaurant) throw new Error("RESTAURANT_NOT_FOUND");
  const accountsPayload = await googleGet<{ accounts?: Array<{ name: string }> }>("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", tokens.access_token);
  const locations: Array<{ accountName: string; location: GoogleLocation }> = [];
  for (const account of (accountsPayload.accounts || []).slice(0, 10)) {
    const url = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`);
    url.searchParams.set("readMask", "name,title,storefrontAddress,metadata");
    url.searchParams.set("pageSize", "100");
    const payload = await googleGet<{ locations?: GoogleLocation[] }>(url.toString(), tokens.access_token);
    for (const location of payload.locations || []) locations.push({ accountName: account.name, location });
  }
  const match = [...locations].sort((a, b) => locationScore(b.location, restaurant) - locationScore(a.location, restaurant))[0];
  if (!match) throw new Error("GOOGLE_LOCATION_NOT_FOUND");

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      googleBusinessAccountName: match.accountName,
      googleBusinessLocationName: match.location.name,
      googleBusinessRefreshToken: encrypt(tokens.refresh_token),
      googleBusinessTitle: match.location.title || restaurant.name,
      googleBusinessAddress: formatAddress(match.location.storefrontAddress) || restaurant.address,
      googlePlaceId: match.location.metadata?.placeId || null,
      googleReviewUrl: match.location.metadata?.mapsUri || match.location.metadata?.newReviewUri || null,
      googleBusinessConnectedAt: new Date(),
    },
  });
  return syncGoogleBusinessProfile(restaurantId);
}

export async function syncGoogleBusinessProfile(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { googleBusinessAccountName: true, googleBusinessLocationName: true, googleBusinessRefreshToken: true },
  });
  if (!restaurant?.googleBusinessAccountName || !restaurant.googleBusinessLocationName || !restaurant.googleBusinessRefreshToken) throw new Error("GOOGLE_NOT_CONNECTED");
  const accessToken = await refreshAccessToken(decrypt(restaurant.googleBusinessRefreshToken));
  const accountId = restaurant.googleBusinessAccountName.split("/").pop();
  const locationId = restaurant.googleBusinessLocationName.split("/").pop();
  if (!accountId || !locationId) throw new Error("GOOGLE_LOCATION_INVALID");
  const parent = `accounts/${accountId}/locations/${locationId}`;
  const [reviews, media] = await Promise.all([
    googleGet<{ averageRating?: number; totalReviewCount?: number }>(`https://mybusiness.googleapis.com/v4/${parent}/reviews?pageSize=1`, accessToken),
    googleGet<{ mediaItems?: Array<{ mediaFormat?: string; googleUrl?: string; thumbnailUrl?: string; locationAssociation?: { category?: string } }> }>(`https://mybusiness.googleapis.com/v4/${parent}/media?pageSize=100`, accessToken),
  ]);
  const photos = (media.mediaItems || [])
    .filter((item) => item.mediaFormat === "PHOTO" && (item.googleUrl || item.thumbnailUrl))
    .sort((a, b) => photoPriority(b.locationAssociation?.category) - photoPriority(a.locationAssociation?.category))
    .map((item) => item.googleUrl || item.thumbnailUrl!)
    .slice(0, 7);
  return prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      googleRating: typeof reviews.averageRating === "number" ? reviews.averageRating : null,
      googleReviewCount: typeof reviews.totalReviewCount === "number" ? reviews.totalReviewCount : null,
      googleBusinessPhotos: photos,
      googleBusinessSyncedAt: new Date(),
    },
  });
}

function signState(data: object) {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function encryptionKey() {
  return createHash("sha256").update(secret()).digest();
}

function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((item) => item.toString("base64url")).join(".");
}

function decrypt(value: string) {
  const [iv, tag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

async function refreshAccessToken(refreshToken: string) {
  const config = oauthConfig();
  if (!config) throw new Error("GOOGLE_NOT_CONFIGURED");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ refresh_token: refreshToken, client_id: config.clientId, client_secret: config.clientSecret, grant_type: "refresh_token" }),
  });
  const payload = await response.json() as { access_token?: string; error?: string };
  if (!response.ok || !payload.access_token) throw new Error(payload.error || "GOOGLE_REFRESH_FAILED");
  return payload.access_token;
}

async function googleGet<T>(url: string, accessToken: string) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}`, "X-GOOG-API-FORMAT-VERSION": "2" }, cache: "no-store" });
  if (!response.ok) throw new Error(`GOOGLE_API_${response.status}:${await response.text()}`);
  return response.json() as Promise<T>;
}

function normalize(value?: string | null) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function locationScore(location: GoogleLocation, restaurant: { name: string; address: string | null }) {
  const title = normalize(location.title);
  const name = normalize(restaurant.name);
  const address = normalize(formatAddress(location.storefrontAddress));
  const expectedAddress = normalize(restaurant.address);
  let score = title === name ? 100 : title.includes(name) || name.includes(title) ? 60 : 0;
  for (const word of name.split(" ").filter((item) => item.length > 2)) if (title.includes(word)) score += 5;
  for (const word of expectedAddress.split(" ").filter((item) => item.length > 3)) if (address.includes(word)) score += 2;
  return score;
}

function formatAddress(address?: GoogleLocation["storefrontAddress"]) {
  if (!address) return "";
  return [...(address.addressLines || []), [address.postalCode, address.locality].filter(Boolean).join(" "), address.administrativeArea, address.regionCode].filter(Boolean).join(", ");
}

function photoPriority(category?: string) {
  return ({ COVER: 10, PROFILE: 9, FOOD_AND_DRINK: 8, INTERIOR: 7, EXTERIOR: 6, MENU: 5 } as Record<string, number>)[category || ""] || 0;
}
