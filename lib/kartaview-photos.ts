import type { ExternalRestaurantPlace } from "@/lib/geoapify-places";

const API_URL = "https://api.openstreetcam.org/1.0/list/nearby-photos/";
const IMAGE_ROOT = "https://api.openstreetcam.org/";

type KartaViewPhoto = {
  id?: string | number;
  sequence_id?: string | number;
  sequence_index?: string | number;
  lat?: string | number;
  lng?: string | number;
  name?: string;
  lth_name?: string;
  th_name?: string;
  shot_date?: string;
  date_added?: string;
  username?: string;
};

type KartaViewPayload = {
  currentPageItems?: KartaViewPhoto[];
  status?: { httpCode?: number; apiCode?: string };
};

export type KartaViewStreetPhoto = {
  imageUrl: string;
  sourceUrl: string;
  capturedAt: string;
  contributor: string;
};

export async function findKartaViewStreetPhoto(place: ExternalRestaurantPlace): Promise<KartaViewStreetPhoto | null> {
  if (place.latitude === null || place.longitude === null) return null;
  const body = new URLSearchParams({
    lat: String(place.latitude),
    lng: String(place.longitude),
    radius: "40",
    page: "1",
    ipp: "8",
  });
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(6500),
  });
  const payload = await response.json().catch(() => null) as KartaViewPayload | null;
  if (!response.ok || payload?.status?.httpCode !== 200) return null;
  const photos = (payload.currentPageItems || []).map((photo) => normalizePhoto(photo, place)).filter((photo): photo is KartaViewStreetPhoto & { distance: number; timestamp: number } => Boolean(photo));
  photos.sort((left, right) => {
    const distanceDifference = left.distance - right.distance;
    if (Math.abs(distanceDifference) > 8) return distanceDifference;
    return right.timestamp - left.timestamp;
  });
  const selected = photos[0];
  if (!selected) return null;
  return {
    imageUrl: selected.imageUrl,
    sourceUrl: selected.sourceUrl,
    capturedAt: selected.capturedAt,
    contributor: selected.contributor,
  };
}

function normalizePhoto(photo: KartaViewPhoto, place: ExternalRestaurantPlace) {
  const latitude = finite(photo.lat);
  const longitude = finite(photo.lng);
  const imagePath = firstString(photo.name, photo.lth_name, photo.th_name).replace(/^\/+/, "");
  if (latitude === null || longitude === null || !/^storage\d+\/files\/photo\/.+\.(?:jpe?g|png)$/i.test(imagePath)) return null;
  const distance = distanceMetres(place.latitude!, place.longitude!, latitude, longitude);
  if (distance > 50) return null;
  const sequenceId = identifier(photo.sequence_id);
  const sequenceIndex = identifier(photo.sequence_index);
  const capturedAt = firstString(photo.shot_date, photo.date_added);
  const timestamp = capturedAt ? Date.parse(capturedAt.replace(" ", "T") + "Z") : 0;
  return {
    imageUrl: new URL(imagePath, IMAGE_ROOT).toString(),
    sourceUrl: sequenceId && sequenceIndex ? `https://kartaview.org/details/${sequenceId}/${sequenceIndex}/track-info` : "https://kartaview.org/",
    capturedAt,
    contributor: firstString(photo.username) || "KartaView contributors",
    distance,
    timestamp: Number.isFinite(timestamp) ? timestamp : 0,
  };
}

function distanceMetres(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function identifier(value: unknown) {
  const text = String(value ?? "").trim();
  return /^\d+$/.test(text) ? text : "";
}

function finite(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === "string" && Boolean(value.trim()))?.trim() || "";
}
