import { NextResponse } from "next/server";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { getGoogleRestaurant } from "@/lib/google-places";
import { prisma } from "@/lib/prisma";
import { isValidPublicRestaurantEmail } from "@/lib/restaurant-contact-discovery";

const GOOGLE_PROVIDER = "GOOGLE_PLACES";
const MESALINK_PROVIDER = "MESALINK";

export async function GET() {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const favorites = await prisma.referralPartnerFavorite.findMany({
    where: { partnerId: partner.id },
    orderBy: { createdAt: "desc" },
    select: { provider: true, placeId: true, name: true, address: true },
  });
  const googlePlaceIds = favorites.filter((favorite) => favorite.provider === GOOGLE_PROVIDER).map((favorite) => favorite.placeId);
  const mesalinkRestaurantIds = favorites.filter((favorite) => favorite.provider === MESALINK_PROVIDER).map((favorite) => favorite.placeId);
  const [profiles, localRestaurants] = favorites.length ? await Promise.all([
    prisma.externalRestaurantPlace.findMany({
      where: { provider: GOOGLE_PROVIDER, placeId: { in: googlePlaceIds } },
      select: { provider: true, placeId: true, name: true, address: true, latitude: true, longitude: true, cuisine: true, rating: true, reviewCount: true, priceLevel: true, mapUrl: true, websiteUrl: true, heroImage: true, galleryImages: true, description: true, openingHours: true, ratingSource: true, contactEmail: true },
    }),
    prisma.restaurant.findMany({
      where: { OR: [{ id: { in: mesalinkRestaurantIds } }, { externalPlaceProvider: GOOGLE_PROVIDER, externalPlaceId: { in: googlePlaceIds } }] },
      select: { id: true, externalPlaceProvider: true, externalPlaceId: true, name: true, email: true, address: true, latitude: true, longitude: true, referralProfileCuisine: true, referralProfileDescription: true, referralProfileHeroImage: true, referralProfileGallery: true, websiteCuisine: true, websiteDescription: true, websiteHeroImage: true, websiteGalleryImage1: true, websiteGalleryImage2: true, websiteGalleryImage3: true, websiteGalleryImage4: true, googleRating: true, googleReviewCount: true, googlePriceLevel: true, externalMapUrl: true, referralNetworkEnabled: true, referralAutoAcceptEnabled: true, referralPaymentMethodId: true, referralPaymentBlockedAt: true },
    }),
  ]) : [[], []];
  const profileById = new Map(profiles.map((profile) => [profile.placeId, profile]));
  const localByKey = new Map<string, (typeof localRestaurants)[number]>();
  for (const restaurant of localRestaurants) {
    localByKey.set(`${MESALINK_PROVIDER}:${restaurant.id}`, restaurant);
    if (restaurant.externalPlaceProvider && restaurant.externalPlaceId) localByKey.set(`${restaurant.externalPlaceProvider}:${restaurant.externalPlaceId}`, restaurant);
  }
  return NextResponse.json({
    favorites: favorites.map((favorite) => {
      const profile = favorite.provider === GOOGLE_PROVIDER ? profileById.get(favorite.placeId) : undefined;
      const local = localByKey.get(`${favorite.provider}:${favorite.placeId}`);
      const bookingReady = Boolean(local?.referralNetworkEnabled && local.referralAutoAcceptEnabled && local.referralPaymentMethodId && !local.referralPaymentBlockedAt);
      return {
        ...favorite,
        restaurant: profile || local ? {
          provider: favorite.provider,
          placeId: favorite.placeId,
          name: profile?.name || local?.name || favorite.name,
          primaryType: "restaurant",
          address: profile?.address || local?.address || favorite.address || "Portugal",
          latitude: profile?.latitude ?? local?.latitude ?? null,
          longitude: profile?.longitude ?? local?.longitude ?? null,
          cuisine: local?.referralProfileCuisine || local?.websiteCuisine || profile?.cuisine || "Restaurante",
          rating: profile?.rating ?? local?.googleRating ?? null,
          reviewCount: profile?.reviewCount ?? local?.googleReviewCount ?? null,
          priceLevel: profile?.priceLevel ?? local?.googlePriceLevel ?? null,
          mapUrl: profile?.mapUrl || local?.externalMapUrl || "",
          websiteUrl: profile?.websiteUrl || "",
          heroImage: local?.referralProfileHeroImage || local?.websiteHeroImage || profile?.heroImage || "",
          galleryImages: local ? uniqueStrings([...(local.referralProfileGallery || []), local.websiteGalleryImage1 || "", local.websiteGalleryImage2 || "", local.websiteGalleryImage3 || "", local.websiteGalleryImage4 || "", ...stringArray(profile?.galleryImages)]).slice(0, 4) : stringArray(profile?.galleryImages),
          description: local?.referralProfileDescription || local?.websiteDescription || profile?.description || "Restaurante disponível para pedido de reserva.",
          openingHours: profile?.openingHours || "",
          ratingSource: profile?.ratingSource || "",
          contactEmail: local?.email || profile?.contactEmail || "",
          mesalinkRestaurantId: bookingReady ? local!.id : null,
          bookingReady,
        } : null,
      };
    }),
  });
}

export async function POST(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const input = await favoriteInput(request);
  if (!input) return NextResponse.json({ error: "Restaurante inválido." }, { status: 400 });
  const [place, cached, local] = await Promise.all([
    getGoogleRestaurant(input.placeId).catch(() => null),
    prisma.externalRestaurantPlace.findUnique({ where: { placeId: input.placeId }, select: { contactEmail: true, heroImage: true } }),
    prisma.restaurant.findFirst({
      where: { externalPlaceProvider: input.provider, externalPlaceId: input.placeId },
      select: { id: true, name: true, email: true, address: true, latitude: true, longitude: true, referralProfileCuisine: true, referralProfileDescription: true, referralProfileHeroImage: true, referralProfileGallery: true, websiteCuisine: true, websiteDescription: true, websiteHeroImage: true, websiteGalleryImage1: true, websiteGalleryImage2: true, websiteGalleryImage3: true, websiteGalleryImage4: true, googleRating: true, googleReviewCount: true, googlePriceLevel: true, externalMapUrl: true, referralNetworkEnabled: true, referralAutoAcceptEnabled: true, referralPaymentMethodId: true, referralPaymentBlockedAt: true },
    }),
  ]);
  const contactEmail = local?.email || cached?.contactEmail || place?.email || "";
  const heroImage = local?.referralProfileHeroImage || local?.websiteHeroImage || cached?.heroImage || place?.heroImage || "";
  if (!place || !isValidPublicRestaurantEmail(contactEmail) || !heroImage) {
    return NextResponse.json({ error: "Este restaurante ainda não tem fotografia e email público validados." }, { status: 409 });
  }
  const galleryImages = uniqueStrings([...(local?.referralProfileGallery || []), local?.websiteGalleryImage1 || "", local?.websiteGalleryImage2 || "", local?.websiteGalleryImage3 || "", local?.websiteGalleryImage4 || "", ...place.galleryImages]).slice(0, 4);
  await prisma.externalRestaurantPlace.upsert({
    where: { placeId: input.placeId },
    create: { provider: input.provider, placeId: input.placeId, name: place.name, address: place.address || local?.address || null, latitude: place.latitude ?? local?.latitude ?? null, longitude: place.longitude ?? local?.longitude ?? null, cuisine: local?.referralProfileCuisine || local?.websiteCuisine || place.cuisine, rating: place.rating ?? local?.googleRating ?? null, reviewCount: place.reviewCount ?? local?.googleReviewCount ?? null, priceLevel: place.priceLevel ?? local?.googlePriceLevel ?? null, mapUrl: place.mapUrl || local?.externalMapUrl || null, websiteUrl: place.websiteUrl || null, heroImage, galleryImages, description: local?.referralProfileDescription || local?.websiteDescription || place.description || null, openingHours: place.openingHours || null, ratingSource: place.ratingSource || null, contactEmail, contactCheckedAt: new Date(), photoCheckedAt: new Date(), enrichedAt: new Date(), published: true, verifiedAt: new Date() },
    update: { name: place.name, address: place.address || local?.address || undefined, latitude: place.latitude ?? local?.latitude ?? undefined, longitude: place.longitude ?? local?.longitude ?? undefined, cuisine: local?.referralProfileCuisine || local?.websiteCuisine || place.cuisine, rating: place.rating ?? local?.googleRating ?? undefined, reviewCount: place.reviewCount ?? local?.googleReviewCount ?? undefined, priceLevel: place.priceLevel ?? local?.googlePriceLevel ?? undefined, mapUrl: place.mapUrl || local?.externalMapUrl || undefined, websiteUrl: place.websiteUrl || undefined, heroImage, galleryImages, description: local?.referralProfileDescription || local?.websiteDescription || place.description || undefined, openingHours: place.openingHours || undefined, ratingSource: place.ratingSource || undefined, contactEmail, contactCheckedAt: new Date(), photoCheckedAt: new Date(), enrichedAt: new Date(), published: true, verifiedAt: new Date() },
  });
  const favorite = await prisma.referralPartnerFavorite.upsert({
    where: { partnerId_provider_placeId: { partnerId: partner.id, provider: input.provider, placeId: input.placeId } },
    create: { partnerId: partner.id, provider: input.provider, placeId: input.placeId, name: place.name, address: place.address || null },
    update: { name: place.name, address: place.address || null },
    select: { provider: true, placeId: true, name: true, address: true },
  });
  const bookingReady = Boolean(local?.referralNetworkEnabled && local.referralAutoAcceptEnabled && local.referralPaymentMethodId && !local.referralPaymentBlockedAt);
  return NextResponse.json({ favorite: { ...favorite, restaurant: { provider: input.provider, placeId: input.placeId, name: place.name, primaryType: "restaurant", address: place.address || local?.address || "Portugal", latitude: place.latitude ?? local?.latitude ?? null, longitude: place.longitude ?? local?.longitude ?? null, cuisine: local?.referralProfileCuisine || local?.websiteCuisine || place.cuisine || "Restaurante", rating: place.rating ?? local?.googleRating ?? null, reviewCount: place.reviewCount ?? local?.googleReviewCount ?? null, priceLevel: place.priceLevel ?? local?.googlePriceLevel ?? null, mapUrl: place.mapUrl || local?.externalMapUrl || "", websiteUrl: place.websiteUrl || "", heroImage, galleryImages, description: local?.referralProfileDescription || local?.websiteDescription || place.description || "Restaurante disponível para pedido de reserva.", openingHours: place.openingHours || "", ratingSource: place.ratingSource || "", contactEmail, mesalinkRestaurantId: bookingReady ? local!.id : null, bookingReady } } });
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
  const provider = body?.provider === GOOGLE_PROVIDER ? GOOGLE_PROVIDER : body?.provider === MESALINK_PROVIDER ? MESALINK_PROVIDER : "";
  const placeId = typeof body?.placeId === "string" && /^[A-Za-z0-9:_-]{8,500}$/.test(body.placeId) ? body.placeId : "";
  return provider && placeId ? { provider, placeId } : null;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, 4) : [];
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
