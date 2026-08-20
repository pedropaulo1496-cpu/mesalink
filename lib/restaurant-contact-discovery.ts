import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const CONTACT_PATHS = ["/", "/contactos", "/contact", "/reservas"];

export async function discoverRestaurantEmail(websiteUrl: string) {
  const root = await safePublicUrl(websiteUrl);
  if (!root) return null;
  const pages = await Promise.all(CONTACT_PATHS.map((path) => fetchHtml(new URL(path, root)).catch(() => null)));
  const emails = [...new Set(pages.flatMap((page) => page ? extractEmails(page.html) : []))];
  return emails.find((email) => /^(reservas|reserva|reservations|reservation|booking|bookings)@/i.test(email))
    || emails.find((email) => /^(info|geral|contacto|contact)@/i.test(email))
    || emails[0]
    || null;
}

export type RestaurantPresentation = {
  heroImage: string;
  galleryImages: string[];
  description: string;
  openingHours: string;
  rating: number | null;
  reviewCount: number | null;
  ratingSource: string;
  priceLevel: number | null;
  websiteUrl: string;
};

export async function discoverRestaurantPresentation(websiteUrl: string): Promise<RestaurantPresentation | null> {
  const root = await safePublicUrl(websiteUrl);
  if (!root) return null;
  const page = await fetchHtml(root).catch(() => null);
  if (!page) return null;

  const schema = extractStructuredRestaurant(page.html);
  const imageCandidates = [
    metaContent(page.html, "property", "og:image"),
    metaContent(page.html, "name", "twitter:image"),
    ...schemaImages(schema?.image),
  ].filter(Boolean);
  const galleryImages: string[] = [];
  for (const candidate of imageCandidates.slice(0, 8)) {
    const absolute = absoluteUrl(candidate, page.url);
    if (!absolute) continue;
    const safe = await safePublicUrl(absolute).catch(() => null);
    if (safe && !galleryImages.includes(safe.toString())) galleryImages.push(safe.toString());
    if (galleryImages.length >= 4) break;
  }

  const aggregate = objectValue(schema?.aggregateRating);
  const rating = normalizeSchemaRating(aggregate);
  const reviewCount = positiveInteger(aggregate?.reviewCount ?? aggregate?.ratingCount);
  const description = cleanText(stringValue(schema?.description) || metaContent(page.html, "property", "og:description") || metaContent(page.html, "name", "description"), 500);
  const openingHours = openingHoursValue(schema?.openingHours ?? schema?.openingHoursSpecification);
  return {
    heroImage: galleryImages[0] || "",
    galleryImages,
    description,
    openingHours,
    rating,
    reviewCount,
    ratingSource: rating === null ? "" : "SITE_OFICIAL",
    priceLevel: priceLevel(stringValue(schema?.priceRange)),
    websiteUrl: page.url.toString(),
  };
}

async function fetchHtml(initialUrl: URL) {
  let current = initialUrl;
  for (let redirects = 0; redirects < 4; redirects += 1) {
    const safe = await safePublicUrl(current.toString());
    if (!safe) return null;
    const response = await fetch(safe, {
      headers: { "User-Agent": "MesaLink-Reservation-Contact/1.0", Accept: "text/html,application/xhtml+xml" },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return null;
      current = new URL(location, safe);
      continue;
    }
    if (!response.ok || !(response.headers.get("content-type") || "").toLowerCase().includes("text/html")) return null;
    const length = Number(response.headers.get("content-length") || 0);
    if (length > 750_000) return null;
    return { html: (await response.text()).slice(0, 750_000), url: safe };
  }
  return null;
}

async function safePublicUrl(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { return null; }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) return null;
  const addresses = isIP(hostname) ? [{ address: hostname }] : await lookup(hostname, { all: true, verbatim: true }).catch(() => []);
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) return null;
  url.hash = "";
  return url;
}

function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized === "::" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  const ipv4 = mapped || (isIP(normalized) === 4 ? normalized : null);
  if (!ipv4) return false;
  const [a, b] = ipv4.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

function extractEmails(html: string) {
  const decoded = html.replace(/&#64;|\[at\]/gi, "@").replace(/&#46;|\[dot\]/gi, ".");
  return [...new Set((decoded.match(EMAIL_PATTERN) || []).map((email) => email.toLowerCase().replace(/[),.;:]+$/, "")))]
    .filter((email) => !/^(noreply|no-reply|donotreply|privacy|abuse)@/i.test(email))
    .filter((email) => !/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(email));
}

function extractStructuredRestaurant(html: string) {
  const candidates: Record<string, unknown>[] = [];
  const scripts = html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of scripts) {
    try {
      const parsed = JSON.parse(match[1].trim());
      collectObjects(parsed, candidates, 0);
    } catch { /* Ignore malformed publisher markup. */ }
  }
  return candidates.find((item) => schemaTypes(item["@type"]).some((type) => /Restaurant|FoodEstablishment|LocalBusiness/i.test(type)) && (item.image || item.aggregateRating))
    || candidates.find((item) => Boolean(item.image || item.aggregateRating || item.openingHours))
    || null;
}

function collectObjects(value: unknown, output: Record<string, unknown>[], depth: number) {
  if (depth > 5 || !value) return;
  if (Array.isArray(value)) return value.forEach((item) => collectObjects(item, output, depth + 1));
  if (typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  output.push(record);
  if (record["@graph"]) collectObjects(record["@graph"], output, depth + 1);
}

function metaContent(html: string, attribute: "name" | "property", expected: string) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const attributes = tagAttributes(tag);
    if ((attributes[attribute] || "").toLowerCase() === expected.toLowerCase() && attributes.content) return decodeHtml(attributes.content);
  }
  return "";
}

function tagAttributes(tag: string) {
  const attributes: Record<string, string> = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attributes;
}

function schemaImages(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(schemaImages);
  if (typeof value === "string") return [value];
  const object = objectValue(value);
  return object ? [stringValue(object.url), stringValue(object.contentUrl), stringValue(object["@id"])].filter(Boolean) : [];
}

function normalizeSchemaRating(aggregate: Record<string, unknown> | null) {
  if (!aggregate) return null;
  const value = finiteNumber(aggregate.ratingValue);
  if (value === null) return null;
  const best = finiteNumber(aggregate.bestRating) ?? 5;
  const worst = finiteNumber(aggregate.worstRating) ?? 0;
  if (best <= worst || value < worst || value > best) return null;
  const normalized = ((value - worst) / (best - worst)) * 5;
  return Math.round(normalized * 10) / 10;
}

function openingHoursValue(value: unknown) {
  if (typeof value === "string") return cleanText(value, 300);
  if (Array.isArray(value)) {
    const direct = value.filter((item): item is string => typeof item === "string");
    if (direct.length) return cleanText(direct.join(" · "), 300);
    const rows = value.map((item) => {
      const record = objectValue(item);
      if (!record) return "";
      const days = Array.isArray(record.dayOfWeek) ? record.dayOfWeek.map(shortDay).join(", ") : shortDay(record.dayOfWeek);
      const opens = stringValue(record.opens);
      const closes = stringValue(record.closes);
      return [days, opens && closes ? `${opens}–${closes}` : ""].filter(Boolean).join(" ");
    }).filter(Boolean);
    return cleanText(rows.join(" · "), 300);
  }
  return "";
}

function shortDay(value: unknown) {
  const day = stringValue(value).split("/").at(-1) || "";
  return ({ Monday: "Seg", Tuesday: "Ter", Wednesday: "Qua", Thursday: "Qui", Friday: "Sex", Saturday: "Sáb", Sunday: "Dom" } as Record<string, string>)[day] || day;
}

function priceLevel(value: string) {
  const symbols = (value.match(/[€$£]/g) || []).length;
  return symbols ? Math.min(4, symbols) : null;
}

function absoluteUrl(value: string, base: URL) {
  try { return new URL(decodeHtml(value), base).toString(); } catch { return ""; }
}

function decodeHtml(value: string) {
  return value.replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}

function cleanText(value: string, max: number) {
  return decodeHtml(value.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim().slice(0, max);
}

function schemaTypes(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : typeof value === "string" ? [value] : [];
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function finiteNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(",", ".")) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function positiveInteger(value: unknown) {
  const parsed = finiteNumber(value);
  return parsed !== null && parsed >= 0 ? Math.round(parsed) : null;
}
