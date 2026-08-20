import { NextResponse } from "next/server";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { getExternalRestaurant } from "@/lib/geoapify-places";
import { prisma } from "@/lib/prisma";
import { discoverRestaurantEmail } from "@/lib/restaurant-contact-discovery";

const EXTERNAL_PROVIDER = "GEOAPIFY";

export async function POST(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const provider = body?.provider === EXTERNAL_PROVIDER ? EXTERNAL_PROVIDER : "";
  const placeId = typeof body?.placeId === "string" ? body.placeId.trim().slice(0, 500) : "";
  if (!provider || !placeId) return NextResponse.json({ error: "Restaurante inválido." }, { status: 400 });
  try {
    const [place, knownRestaurant, catalog] = await Promise.all([
      getExternalRestaurant(placeId),
      prisma.restaurant.findFirst({ where: { externalPlaceProvider: EXTERNAL_PROVIDER, externalPlaceId: placeId }, select: { email: true } }),
      prisma.externalRestaurantPlace.findUnique({ where: { placeId }, select: { contactEmail: true, contactCheckedAt: true } }),
    ]);
    let email = knownRestaurant?.email || catalog?.contactEmail || place.email || null;
    const recentlyChecked = catalog?.contactCheckedAt && catalog.contactCheckedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (!email && !recentlyChecked && place.websiteUrl) email = await discoverRestaurantEmail(place.websiteUrl);
    await prisma.externalRestaurantPlace.upsert({
      where: { placeId },
      create: { provider: EXTERNAL_PROVIDER, placeId, contactEmail: email, contactCheckedAt: new Date(), lastSelectedAt: new Date(), selectionCount: 1 },
      update: { contactEmail: email || undefined, contactCheckedAt: new Date(), lastSelectedAt: new Date(), selectionCount: { increment: 1 } },
    });
    return NextResponse.json({ email, found: Boolean(email) });
  } catch (error) {
    console.error("Restaurant contact discovery failed", error);
    return NextResponse.json({ email: null, found: false });
  }
}
