import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import sharp from "sharp";

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const CONTACT_PATHS = ["/", "/contactos", "/contact", "/reservas", "/reservations", "/booking"];
const BOOKING_PREFIX = /^(reservas?|reservations?|bookings?|mesas?|table)@/i;
const CONTACT_PREFIX = /^(info|geral|contacto|contact|hello|ola)@/i;

export type RestaurantContact = { email: string; sourceUrl: string };

export async function discoverRestaurantEmail(websiteUrl: string) {
  return (await discoverRestaurantContact(websiteUrl))?.email || null;
}

export async function discoverRestaurantContact(websiteUrl: string): Promise<RestaurantContact | null> {
  const root = await safePublicUrl(websiteUrl);
  if (!root) return null;
  const pageUrls = [...new Map([root, ...CONTACT_PATHS.map((path) => new URL(path, root))].map((url) => [url.toString(), url])).values()];
  const pages = await Promise.all(pageUrls.map((url) => fetchHtml(url).catch(() => null)));
  const candidates = pages.flatMap((page) => page ? extractEmails(page.html).map((email) => ({ email, sourceUrl: page.url.toString() })) : []);
  const unique = [...new Map(candidates.map((candidate) => [candidate.email, candidate])).values()];
  const officialDomain = registrableDomain(root.hostname);
  return unique.sort((a, b) => emailScore(b.email, officialDomain) - emailScore(a.email, officialDomain))[0] || null;
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
    ...contentImages(page.html),
  ].filter(Boolean);
  const galleryImages: string[] = [];
  for (const candidate of imageCandidates.slice(0, 20)) {
    const absolute = absoluteUrl(candidate, page.url);
    if (!absolute || !isEligibleRestaurantImage(absolute)) continue;
    const safe = await safePublicUrl(absolute).catch(() => null);
    if (safe && !galleryImages.includes(safe.toString()) && await isRealRestaurantPhoto(safe)) galleryImages.push(safe.toString());
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
    .filter(isValidPublicRestaurantEmail)
    .filter((email) => !/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(email));
}

export function isValidPublicRestaurantEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(normalized)) return false;
  if (/(^|[.@_-])(example|teste?|sample|yourname|email|name)([.@_-]|$)/i.test(normalized)) return false;
  if (/@(?:websystems|wixpress|sentry|domain|hosting|wordpress)\./i.test(normalized)) return false;
  return true;
}

function emailScore(email: string, officialDomain: string) {
  const domain = email.split("@")[1] || "";
  let score = BOOKING_PREFIX.test(email) ? 100 : CONTACT_PREFIX.test(email) ? 60 : 20;
  if (registrableDomain(domain) === officialDomain) score += 40;
  if (/^(admin|developer|dev|support|webmaster|marketing|press|jobs?|rh|careers?)@/i.test(email)) score -= 70;
  return score;
}

function registrableDomain(hostname: string) {
  const parts = hostname.toLowerCase().replace(/^www\./, "").split(".").filter(Boolean);
  if (parts.length <= 2) return parts.join(".");
  const suffix = parts.slice(-2).join(".");
  return /^(com|net|org|gov|edu)\.pt$/.test(suffix) ? parts.slice(-3).join(".") : suffix;
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

function contentImages(html: string) {
  const candidates: string[] = [];
  for (const tag of html.match(/<(?:img|source)\b[^>]*>/gi) || []) {
    const attributes = tagAttributes(tag);
    const direct = attributes.src || attributes["data-src"] || attributes["data-lazy-src"] || attributes["data-original"];
    if (direct) candidates.push(direct);
    const srcset = attributes.srcset || attributes["data-srcset"];
    if (srcset) {
      const largest = srcset.split(",").map((item) => item.trim().split(/\s+/)[0]).filter(Boolean).at(-1);
      if (largest) candidates.push(largest);
    }
  }
  for (const match of html.matchAll(/(?:background-image|background)\s*:\s*[^;{}]*url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    if (match[1]) candidates.push(match[1]);
  }
  return candidates;
}

export function isEligibleRestaurantImage(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { return false; }
  const identity = decodeURIComponent(`${url.pathname} ${url.search}`).toLowerCase();
  if (/\.(?:svg|gif)(?:$|\?)/i.test(url.pathname)) return false;
  if (/(?:^|[\/_\-.])(logo|favicon|icon|sprite|avatar|placeholder|default(?:[-_ ]?(?:share|image))?|loader|spinner|pixel|blank|badge|payment|tripadvisor)(?:[\/_\-.]|$)/i.test(identity)) return false;
  if (/^(data|blob):/i.test(value)) return false;
  return true;
}

export async function isRealRestaurantPhoto(value: string | URL) {
  const safe = await safePublicUrl(value.toString()).catch(() => null);
  if (!safe || !isEligibleRestaurantImage(safe.toString())) return false;
  const response = await fetchPublicImage(safe).catch(() => null);
  if (!response?.ok || !/^image\/(?:avif|webp|png|jpe?g)$/i.test(response.headers.get("content-type") || "")) return false;
  const declaredSize = Number(response.headers.get("content-length") || 0);
  if (declaredSize > 5_000_000) return false;
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 24_000 || bytes.length > 5_000_000) return false;
  const image = sharp(bytes, { failOn: "warning" });
  const [metadata, stats] = await Promise.all([image.metadata(), image.stats()]).catch(() => [null, null] as const);
  if (!metadata?.width || !metadata.height || !stats) return false;
  const ratio = Math.max(metadata.width / metadata.height, metadata.height / metadata.width);
  return metadata.width >= 600 && metadata.height >= 350 && ratio <= 3.5 && stats.entropy >= 3.15;
}

async function fetchPublicImage(initialUrl: URL) {
  let current = initialUrl;
  for (let redirects = 0; redirects < 4; redirects += 1) {
    const safe = await safePublicUrl(current.toString());
    if (!safe) return null;
    const response = await fetch(safe, {
      headers: { "User-Agent": "MesaLink-Restaurant-Directory/1.0", Accept: "image/avif,image/webp,image/png,image/jpeg" },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return null;
      current = new URL(location, safe);
      continue;
    }
    return response;
  }
  return null;
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
  try {
    const url = new URL(decodeHtml(value), base);
    if (url.protocol === "http:" && /(?:squarespace|squarespace-cdn)\.com$/i.test(url.hostname)) url.protocol = "https:";
    return url.toString();
  } catch { return ""; }
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
