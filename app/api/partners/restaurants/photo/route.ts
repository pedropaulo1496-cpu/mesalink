import { NextResponse } from "next/server";
import { googlePhotoUri, googlePlacesConfigured } from "@/lib/google-places";
import { getPartnerIdentity } from "@/lib/partner-auth";

export async function GET(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  if (!googlePlacesConfigured()) return NextResponse.json({ error: "Fotografia indisponível." }, { status: 503 });
  const placeId = new URL(request.url).searchParams.get("placeId")?.trim() || "";
  if (!placeId) return NextResponse.json({ error: "Local inválido." }, { status: 400 });
  const photoUri = await googlePhotoUri(placeId).catch(() => null);
  if (!photoUri) return NextResponse.json({ error: "Este local não tem fotografia disponível." }, { status: 404 });
  const response = NextResponse.redirect(photoUri, 302);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
