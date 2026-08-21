import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AggregateRow = {
  views: number;
  visitors: number;
  sessions: number;
  newVisitors: number;
  mobileVisitors: number;
};

type DailyRow = { day: Date; views: number; visitors: number; sessions: number };
type PageRow = { path: string; views: number; visitors: number };
type SourceRow = { source: string; visitors: number; views: number };
type CountryRow = { country: string; visitors: number };
type DeviceRow = { device: string; visitors: number; views: number };
type SessionQualityRow = { pagesPerSession: number; singlePageRate: number };

const emptyAggregate: AggregateRow = { views: 0, visitors: 0, sessions: 0, newVisitors: 0, mobileVisitors: 0 };

function lisbonDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
}

function lisbonOffsetMilliseconds(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second)) - Math.floor(date.getTime() / 1000) * 1000;
}

function startOfLisbonDay(date: Date) {
  const { year, month, day } = lisbonDateParts(date);
  const utcMidnight = new Date(Date.UTC(year, month - 1, day));
  return new Date(utcMidnight.getTime() - lisbonOffsetMilliseconds(utcMidnight));
}

function lisbonDateKey(date: Date) {
  const { year, month, day } = lisbonDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function rangeDates(days: number, now = new Date()) {
  const end = now;
  const start = startOfLisbonDay(new Date(now.getTime() - (days - 1) * 86_400_000));
  const previousEnd = start;
  const previousStart = startOfLisbonDay(new Date(previousEnd.getTime() - days * 86_400_000));
  return { start, end, previousStart, previousEnd };
}

async function aggregateBetween(start: Date, end: Date) {
  const rows = await prisma.$queryRaw<AggregateRow[]>(Prisma.sql`
    SELECT
      COUNT(*)::int AS "views",
      COUNT(DISTINCT "visitorId")::int AS "visitors",
      COUNT(DISTINCT "sessionId")::int AS "sessions",
      COUNT(DISTINCT CASE WHEN "isNewVisitor" THEN "visitorId" END)::int AS "newVisitors",
      COUNT(DISTINCT CASE WHEN "device" = 'mobile' THEN "visitorId" END)::int AS "mobileVisitors"
    FROM "SitePageView"
    WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
  `);
  return rows[0] || emptyAggregate;
}

export async function getSiteTrafficSummary(days = 30, now = new Date()) {
  const { start, end, previousStart, previousEnd } = rangeDates(days, now);
  const [current, previous, registrations] = await Promise.all([
    aggregateBetween(start, end),
    aggregateBetween(previousStart, previousEnd),
    prisma.user.count({ where: { createdAt: { gte: start, lt: end }, isAdmin: false, salesProfile: null, referralPartner: null } }),
  ]);
  return { days, current, previous, registrations };
}

export async function getSiteTrafficAnalytics(days = 1, now = new Date()) {
  const safeDays = [1, 7, 30, 90].includes(days) ? days : 1;
  const { start, end, previousStart, previousEnd } = rangeDates(safeDays, now);
  const todayStart = startOfLisbonDay(now);

  const [current, previous, today, daily, pages, sources, countries, devices, quality, registrations, previousRegistrations, registerVisitors] = await Promise.all([
    aggregateBetween(start, end),
    aggregateBetween(previousStart, previousEnd),
    aggregateBetween(todayStart, end),
    prisma.$queryRaw<DailyRow[]>(Prisma.sql`
      SELECT
        date_trunc('day', "createdAt" AT TIME ZONE 'Europe/Lisbon') AS "day",
        COUNT(*)::int AS "views",
        COUNT(DISTINCT "visitorId")::int AS "visitors",
        COUNT(DISTINCT "sessionId")::int AS "sessions"
      FROM "SitePageView"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
      GROUP BY 1 ORDER BY 1 ASC
    `),
    prisma.$queryRaw<PageRow[]>(Prisma.sql`
      SELECT "path", COUNT(*)::int AS "views", COUNT(DISTINCT "visitorId")::int AS "visitors"
      FROM "SitePageView"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
      GROUP BY "path" ORDER BY "views" DESC LIMIT 8
    `),
    prisma.$queryRaw<SourceRow[]>(Prisma.sql`
      SELECT COALESCE(NULLIF("source", ''), 'direct') AS "source",
        COUNT(DISTINCT "visitorId")::int AS "visitors", COUNT(*)::int AS "views"
      FROM "SitePageView"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${end} AND "source" <> 'internal'
      GROUP BY 1 ORDER BY "visitors" DESC LIMIT 8
    `),
    prisma.$queryRaw<CountryRow[]>(Prisma.sql`
      SELECT COALESCE(NULLIF("country", ''), '—') AS "country", COUNT(DISTINCT "visitorId")::int AS "visitors"
      FROM "SitePageView"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
      GROUP BY 1 ORDER BY "visitors" DESC LIMIT 8
    `),
    prisma.$queryRaw<DeviceRow[]>(Prisma.sql`
      SELECT "device", COUNT(DISTINCT "visitorId")::int AS "visitors", COUNT(*)::int AS "views"
      FROM "SitePageView"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
      GROUP BY "device" ORDER BY "visitors" DESC
    `),
    prisma.$queryRaw<SessionQualityRow[]>(Prisma.sql`
      WITH sessions AS (
        SELECT "sessionId", COUNT(*)::float AS page_views
        FROM "SitePageView"
        WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
        GROUP BY "sessionId"
      )
      SELECT
        COALESCE(AVG(page_views), 0)::float AS "pagesPerSession",
        COALESCE(100.0 * COUNT(*) FILTER (WHERE page_views = 1) / NULLIF(COUNT(*), 0), 0)::float AS "singlePageRate"
      FROM sessions
    `),
    prisma.user.count({ where: { createdAt: { gte: start, lt: end }, isAdmin: false, salesProfile: null, referralPartner: null } }),
    prisma.user.count({ where: { createdAt: { gte: previousStart, lt: previousEnd }, isAdmin: false, salesProfile: null, referralPartner: null } }),
    prisma.sitePageView.findMany({
      where: { createdAt: { gte: start, lt: end }, path: { startsWith: "/register" } },
      distinct: ["visitorId"],
      select: { visitorId: true },
    }),
  ]);

  const dailyByKey = new Map(daily.map((row) => [row.day.toISOString().slice(0, 10), row]));
  const firstLocalDate = new Date(`${lisbonDateKey(start)}T00:00:00.000Z`);
  const completeDaily = Array.from({ length: safeDays }, (_, index) => {
    const date = new Date(firstLocalDate.getTime() + index * 86_400_000);
    const key = date.toISOString().slice(0, 10);
    const row = dailyByKey.get(key);
    return { key, date, views: row?.views || 0, visitors: row?.visitors || 0, sessions: row?.sessions || 0 };
  });

  const currentQuality = quality[0] || { pagesPerSession: 0, singlePageRate: 0 };
  return {
    days: safeDays,
    start,
    end,
    current,
    previous,
    today,
    daily: completeDaily,
    pages,
    sources,
    countries,
    devices,
    registrations,
    previousRegistrations,
    registerVisitors: registerVisitors.length,
    pagesPerSession: Number(currentQuality.pagesPerSession || 0),
    singlePageRate: Number(currentQuality.singlePageRate || 0),
    returningVisitors: Math.max(0, current.visitors - current.newVisitors),
    conversionRate: current.visitors ? (registrations / current.visitors) * 100 : 0,
  };
}
