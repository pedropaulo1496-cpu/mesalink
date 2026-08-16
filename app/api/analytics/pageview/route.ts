import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const botPattern = /bot|crawler|spider|slurp|headless|lighthouse|facebookexternalhit|preview|monitor|uptime/i;

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : null;
}

function sourceFromReferrer(referrer: string | null) {
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.endsWith("mesalink.pt")) return "internal";
    if (host.includes("google.")) return "google";
    if (host.includes("bing.")) return "bing";
    if (host.includes("instagram.")) return "instagram";
    if (host.includes("facebook.") || host.includes("fb.")) return "facebook";
    if (host.includes("linkedin.")) return "linkedin";
    return host.replace(/^www\./, "");
  } catch {
    return "referral";
  }
}

function deviceFromUserAgent(userAgent: string) {
  if (/ipad|tablet|kindle/i.test(userAgent)) return "tablet";
  if (/mobile|iphone|ipod|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

function browserFromUserAgent(userAgent: string) {
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/opr\//i.test(userAgent)) return "Opera";
  if (/firefox\//i.test(userAgent)) return "Firefox";
  if (/chrome\//i.test(userAgent)) return "Chrome";
  if (/safari\//i.test(userAgent)) return "Safari";
  return "Outro";
}

export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  if (!userAgent || botPattern.test(userAgent)) return new NextResponse(null, { status: 204 });

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.nextUrl.host) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
    } catch {
      return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const eventKey = clean(body.eventKey, 80);
  const visitorId = clean(body.visitorId, 80);
  const sessionId = clean(body.sessionId, 80);
  const path = clean(body.path, 500);
  if (!eventKey || !visitorId || !sessionId || !path || !path.startsWith("/")) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const referrer = clean(body.referrer, 1000);
  const suppliedSource = clean(body.source, 100);
  const source = suppliedSource || sourceFromReferrer(referrer);

  try {
    await prisma.sitePageView.create({
      data: {
        eventKey,
        visitorId,
        sessionId,
        path,
        title: clean(body.title, 300),
        referrer,
        source,
        medium: clean(body.medium, 100),
        campaign: clean(body.campaign, 160),
        country: clean(request.headers.get("x-vercel-ip-country"), 2),
        region: clean(request.headers.get("x-vercel-ip-country-region"), 100),
        city: clean(request.headers.get("x-vercel-ip-city"), 160),
        device: deviceFromUserAgent(userAgent),
        browser: browserFromUserAgent(userAgent),
        language: clean(body.language, 30),
        isNewVisitor: body.isNewVisitor === true,
      },
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return new NextResponse(null, { status: 204 });
    }
    console.error("Site analytics pageview failed", error);
    return NextResponse.json({ error: "Não foi possível registar a visita." }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
