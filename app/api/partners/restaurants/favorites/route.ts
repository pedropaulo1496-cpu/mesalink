import { NextResponse } from "next/server";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { getGoogleRestaurant } from "@/lib/google-places";
import { prisma } from "@/lib/prisma";
import { isValidPublicRestaurantEmail } from "@/lib/restaurant-contact-discovery";

const GOOGLE_PROVIDER = "GOOGLE_PLACES";

export async function GET() {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const favorites = await prisma.referralPartnerFavorite.findMany({
    where: { partnerId: partner.id },
    orderBy: { createdAt: "desc" },
    select: { provider: true, placeId: true, name: true, address: true },
  });
  return NextResponse.json({ favorites });
}

export async function POST(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const input = await favoriteInput(request);
  if (!input) return NextResponse.json({ error: "Restaurante inválido." }, { status: 400 });
  const [place, cached] = await Promise.all([
    getGoogleRestaurant(input.placeId).catch(() => null),
    prisma.externalRestaurantPlace.findUnique({ where: { placeId: input.placeId }, select: { contactEmail: true, heroImage: true } }),
  ]);
  if (!place || !isValidPublicRestaurantEmail(cached?.contactEmail || "") || !(cached?.heroImage || place.heroImage)) {
    return NextResponse.json({ error: "Este restaurante ainda não tem fotografia e email público validados." }, { status: 409 });
  }
  const favorite = await prisma.referralPartnerFavorite.upsert({
    where: { partnerId_provider_placeId: { partnerId: partner.id, provider: input.provider, placeId: input.placeId } },
    create: { partnerId: partner.id, provider: input.provider, placeId: input.placeId, name: place.name, address: place.address || null },
    update: { name: place.name, address: place.address || null },
    select: { provider: true, placeId: true, name: true, address: true },
  });
  return NextResponse.json({ favorite });
}

export async function DELETE(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const input = await favoriteInput(request);
  if (!input) return NextResponse.json({ error: "Restaurante inválido." }, { status: 400 });
  await prisma.referralPartnerFavorite.deleteMany({
    where: { partnerId: partner.id, provider: input.provider, placeId: input.placeId },
  });
  return NextResponse.json({ success: true });
}

async function favoriteInput(request: Request) {
  const body = await request.json().catch(() => null);
  const provider = body?.provider === GOOGLE_PROVIDER ? GOOGLE_PROVIDER : "";
  const placeId = typeof body?.placeId === "string" && /^[A-Za-z0-9:_-]{8,500}$/.test(body.placeId) ? body.placeId : "";
  return provider && placeId ? { provider, placeId } : null;
}
