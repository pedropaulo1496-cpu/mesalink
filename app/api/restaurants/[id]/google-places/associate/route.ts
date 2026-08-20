import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getGoogleRestaurant } from "@/lib/google-places";
import { prisma } from "@/lib/prisma";

const PROVIDER = "GOOGLE_PLACES";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const owned = await prisma.restaurant.findFirst({
    where: { id, user: { email: session.user.email } },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const placeId = typeof body?.placeId === "string" ? body.placeId.trim() : "";
  if (!placeId) return NextResponse.json({ error: "Escolhe um restaurante do Google Maps." }, { status: 400 });

  try {
    const place = await getGoogleRestaurant(placeId);
    const now = new Date();
    await prisma.$transaction([
      prisma.restaurant.update({
        where: { id },
        data: {
          externalPlaceProvider: PROVIDER,
          externalPlaceId: place.placeId,
          externalPlaceSyncedAt: now,
          externalMapUrl: place.mapUrl,
          googlePlaceId: place.placeId,
          googleReviewUrl: place.mapUrl,
          googleRating: place.rating,
          googleReviewCount: place.reviewCount,
          googlePriceLevel: place.priceLevel,
          googleBusinessTitle: place.name,
          googleBusinessAddress: place.address,
          googleBusinessSyncedAt: now,
        },
      }),
      prisma.externalRestaurantPlace.upsert({
        where: { placeId: place.placeId },
        create: {
          provider: PROVIDER,
          placeId: place.placeId,
          name: place.name,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          phone: place.phone,
          cuisine: place.cuisine,
          mapUrl: place.mapUrl,
          websiteUrl: place.websiteUrl,
          description: place.description,
          openingHours: place.openingHours,
          rating: place.rating,
          reviewCount: place.reviewCount,
          ratingSource: place.ratingSource,
          priceLevel: place.priceLevel,
          lastSeenAt: now,
        },
        update: {
          provider: PROVIDER,
          name: place.name,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          phone: place.phone,
          cuisine: place.cuisine,
          mapUrl: place.mapUrl,
          websiteUrl: place.websiteUrl,
          description: place.description,
          openingHours: place.openingHours,
          rating: place.rating,
          reviewCount: place.reviewCount,
          ratingSource: place.ratingSource,
          priceLevel: place.priceLevel,
          lastSeenAt: now,
        },
      }),
    ]);
    revalidatePath(`/restaurants/${id}/partner-network`);
    return NextResponse.json({ success: true, name: place.name, mapUrl: place.mapUrl });
  } catch (error) {
    console.error("Google Maps association failed", error);
    return NextResponse.json({ error: "Não foi possível associar este restaurante agora." }, { status: 502 });
  }
}
