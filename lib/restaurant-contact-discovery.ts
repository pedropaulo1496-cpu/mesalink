import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const CONTACT_PATHS = ["/", "/contactos", "/contact", "/reservas"];

export async function discoverRestaurantEmail(websiteUrl: string) {
  const root = await safePublicUrl(websiteUrl);
  if (!root) return null;
  for (const path of CONTACT_PATHS) {
    const pageUrl = new URL(path, root);
    const html = await fetchHtml(pageUrl).catch(() => null);
    if (!html) continue;
    const emails = extractEmails(html);
    const preferred = emails.find((email) => /^(reservas|reserva|booking|bookings|info|geral|contacto|contact)@/i.test(email));
    if (preferred) return preferred;
    if (emails[0]) return emails[0];
  }
  return null;
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
    return (await response.text()).slice(0, 750_000);
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
