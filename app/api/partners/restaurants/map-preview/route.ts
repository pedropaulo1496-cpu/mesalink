import { NextResponse } from "next/server";
import { getPartnerIdentity } from "@/lib/partner-auth";

export async function GET(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const url = new URL(request.url);
  const latitude = Number(url.searchParams.get("lat"));
  const longitude = Number(url.searchParams.get("lng"));
  if (!validPortugalCoordinate(latitude, longitude)) return NextResponse.json({ error: "Localização inválida." }, { status: 400 });
  const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "Mapa indisponível." }, { status: 503 });

  const mapUrl = new URL("https://maps.geoapify.com/v1/staticmap");
  mapUrl.searchParams.set("style", "osm-bright-grey");
  mapUrl.searchParams.set("width", "360");
  mapUrl.searchParams.set("height", "220");
  mapUrl.searchParams.set("format", "jpeg");
  mapUrl.searchParams.set("center", `lonlat:${longitude},${latitude}`);
  mapUrl.searchParams.set("zoom", "16");
  mapUrl.searchParams.set("lang", "pt");
  mapUrl.searchParams.set("marker", `lonlat:${longitude},${latitude};type:circle;color:#B88745;size:52;text:M;contentcolor:#17120D;whitecircle:yes;shadow:auto`);
  mapUrl.searchParams.set("apiKey", apiKey);

  const response = await fetch(mapUrl, { headers: { Accept: "image/jpeg" }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) return NextResponse.json({ error: "Mapa indisponível." }, { status: 502 });
  return new Response(await response.arrayBuffer(), {
    headers: {
      "Content-Type": response.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function validPortugalCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= 32 && latitude <= 43 && longitude >= -32 && longitude <= -5;
}
