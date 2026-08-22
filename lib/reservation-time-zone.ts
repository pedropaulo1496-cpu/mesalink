type ReservationLocation = {
  country?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

const COUNTRY_TIME_ZONES: Record<string, string> = {
  PT: "Europe/Lisbon",
  ES: "Europe/Madrid",
  FR: "Europe/Paris",
  GB: "Europe/London",
  IE: "Europe/Dublin",
  DE: "Europe/Berlin",
  IT: "Europe/Rome",
  BE: "Europe/Brussels",
  NL: "Europe/Amsterdam",
  LU: "Europe/Luxembourg",
  CH: "Europe/Zurich",
  AT: "Europe/Vienna",
  DK: "Europe/Copenhagen",
  NO: "Europe/Oslo",
  SE: "Europe/Stockholm",
  FI: "Europe/Helsinki",
  PL: "Europe/Warsaw",
  CZ: "Europe/Prague",
  GR: "Europe/Athens",
};

const ADDRESS_COUNTRIES: Array<[RegExp, string]> = [
  [/\bportugal\b/i, "PT"],
  [/\bespanha\b|\bspain\b|\bespaña\b/i, "ES"],
  [/\bfrança\b|\bfrance\b/i, "FR"],
  [/\breino unido\b|\bunited kingdom\b/i, "GB"],
  [/\birlanda\b|\bireland\b/i, "IE"],
  [/\balemanha\b|\bgermany\b/i, "DE"],
  [/\bitália\b|\bitaly\b/i, "IT"],
];

export function reservationTimeZone(location?: ReservationLocation | null) {
  const country = normalizedCountry(location?.country) || countryFromAddress(location?.address);
  const longitude = finiteNumber(location?.longitude);

  if (country === "PT") {
    // Os Açores usam um fuso diferente do continente e da Madeira.
    if (longitude !== null && longitude < -20) return "Atlantic/Azores";
    return "Europe/Lisbon";
  }
  if (country === "ES" && longitude !== null && longitude < -12) return "Atlantic/Canary";
  return COUNTRY_TIME_ZONES[country] || "Europe/Lisbon";
}

export function safeReservationTimeZone(value: unknown, fallback = "Europe/Lisbon") {
  const candidate = typeof value === "string" ? value.trim() : "";
  if (!candidate) return fallback;
  try {
    new Intl.DateTimeFormat("en", { timeZone: candidate }).format(new Date(0));
    return candidate;
  } catch {
    return fallback;
  }
}

export function zonedDateTimeToUtc(value: unknown, timeZone: string) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;

  // Mantém compatibilidade com clientes que já enviam um instante ISO completo.
  if (/(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized)) {
    const absolute = new Date(normalized);
    return Number.isNaN(absolute.getTime()) ? null : absolute;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(normalized);
  if (!match) return null;
  const expected = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] || 0),
  };
  if (!validWallClock(expected)) return null;

  const zone = safeReservationTimeZone(timeZone);
  const targetAsUtc = Date.UTC(expected.year, expected.month - 1, expected.day, expected.hour, expected.minute, expected.second);
  let instant = targetAsUtc;

  // Converge para o instante cujo relógio civil no restaurante contém exatamente
  // os valores escolhidos, incluindo as mudanças de hora de verão/inverno.
  for (let index = 0; index < 4; index += 1) {
    const represented = datePartsInTimeZone(new Date(instant), zone);
    const representedAsUtc = Date.UTC(represented.year, represented.month - 1, represented.day, represented.hour, represented.minute, represented.second);
    const correction = targetAsUtc - representedAsUtc;
    if (correction === 0) break;
    instant += correction;
  }

  const result = new Date(instant);
  const verified = datePartsInTimeZone(result, zone);
  return sameWallClock(expected, verified) ? result : null;
}

export function dateTimeInputInTimeZone(value: Date | string, timeZone: string) {
  const parts = datePartsInTimeZone(new Date(value), safeReservationTimeZone(timeZone));
  return `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function formatDateTimeInTimeZone(value: Date | string, timeZone: string, dateStyle: "short" | "medium" | "long" = "medium") {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle,
    timeStyle: "short",
    timeZone: safeReservationTimeZone(timeZone),
  }).format(new Date(value));
}

function datePartsInTimeZone(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value || 0);
  return { year: part("year"), month: part("month"), day: part("day"), hour: part("hour"), minute: part("minute"), second: part("second") };
}

function validWallClock(value: { year: number; month: number; day: number; hour: number; minute: number; second: number }) {
  if (value.year < 2000 || value.year > 2200 || value.month < 1 || value.month > 12 || value.day < 1 || value.day > 31 || value.hour < 0 || value.hour > 23 || value.minute < 0 || value.minute > 59 || value.second < 0 || value.second > 59) return false;
  const check = new Date(Date.UTC(value.year, value.month - 1, value.day, value.hour, value.minute, value.second));
  return check.getUTCFullYear() === value.year && check.getUTCMonth() + 1 === value.month && check.getUTCDate() === value.day;
}

function sameWallClock(left: ReturnType<typeof datePartsInTimeZone>, right: ReturnType<typeof datePartsInTimeZone>) {
  return left.year === right.year && left.month === right.month && left.day === right.day && left.hour === right.hour && left.minute === right.minute && left.second === right.second;
}

function normalizedCountry(value?: string | null) {
  const country = value?.trim().toUpperCase() || "";
  if (country === "UK") return "GB";
  return /^[A-Z]{2}$/.test(country) ? country : "";
}

function countryFromAddress(address?: string | null) {
  const value = address?.trim() || "";
  return ADDRESS_COUNTRIES.find(([pattern]) => pattern.test(value))?.[1] || "PT";
}

function finiteNumber(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function pad(value: number, length = 2) {
  return String(value).padStart(length, "0");
}
