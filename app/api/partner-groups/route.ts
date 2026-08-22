import { NextResponse } from "next/server";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { prisma } from "@/lib/prisma";
import {
  REFERRAL_ACCESSIBILITY_TAGS,
  REFERRAL_DIETARY_TAGS,
  REFERRAL_OCCASION_TAGS,
  REFERRAL_REQUIREMENT_TAGS,
} from "@/lib/referral-tags";
import { InstantReferralBookingError, finalizeInstantReferralBooking } from "@/lib/referral-auto-booking";
import { MESALINK_REFERRAL_FEE_PERCENT, createReferralCode, isCommissionType } from "@/lib/referrals";
import {
  EXTERNAL_REFERRAL_COMMISSION_PER_PERSON,
  EXTERNAL_REFERRAL_MAX_ADVANCE_DAYS,
  issueExternalReferralAccess,
} from "@/lib/external-referral-requests";
import { getGoogleRestaurant } from "@/lib/google-places";
import { discoverRestaurantEmail, isValidPublicRestaurantEmail } from "@/lib/restaurant-contact-discovery";
import { safeReservationTimeZone, zonedDateTimeToUtc } from "@/lib/reservation-time-zone";

const EXTERNAL_PLACE_PROVIDERS = new Set(["GOOGLE_PLACES", "MESALINK"]);

export async function POST(request: Request) {
  let createdGroupId: string | null = null;
  try {
    const partner = await getPartnerIdentity();
    if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
    if (partner.status === "SUSPENDED") return NextResponse.json({ error: "A conta Partner não está disponível." }, { status: 403 });
    if (!partner.stripeOnboardingComplete || !partner.stripeAccountId) {
      return NextResponse.json({ error: "Adiciona e valida primeiro o teu IBAN para receberes as comissões." }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const restaurantId = typeof body?.restaurantId === "string" ? body.restaurantId : "";
    const externalPlaceId = typeof body?.externalPlaceId === "string" ? body.externalPlaceId.trim().slice(0, 500) : "";
    const externalPlaceProvider = typeof body?.externalPlaceProvider === "string" && EXTERNAL_PLACE_PROVIDERS.has(body.externalPlaceProvider) ? body.externalPlaceProvider : "";
    const externalRestaurantEmail = typeof body?.externalRestaurantEmail === "string" ? body.externalRestaurantEmail.trim().toLowerCase().slice(0, 160) : "";
    const externalRequest = !restaurantId && Boolean(externalPlaceId && externalPlaceProvider);
    const adults = Number(body?.adults);
    const children = Number(body?.children);
    const guests = adults + children;
    const timeZone = safeReservationTimeZone(body?.timeZone);
    const desiredDate = zonedDateTimeToUtc(body?.desiredDate, timeZone);
    const customerName = typeof body?.customerName === "string" ? body.customerName.trim().slice(0, 100) : "";
    const customerPhone = typeof body?.customerPhone === "string" ? body.customerPhone.trim().slice(0, 30) : "";
    const customerEmail = typeof body?.customerEmail === "string" ? body.customerEmail.trim().toLowerCase().slice(0, 160) : "";
    const requirements = Array.isArray(body?.requirements)
      ? Array.from(new Set(body.requirements.filter((item: unknown): item is string => typeof item === "string" && (REFERRAL_REQUIREMENT_TAGS as readonly string[]).includes(item)))).slice(0, 5)
      : [];
    if (
      (!restaurantId && !externalRequest)
      || !Number.isInteger(adults) || adults < 1
      || !Number.isInteger(children) || children < 0
      || !Number.isInteger(guests) || guests < 1 || guests > 200
      || !desiredDate || desiredDate <= new Date(Date.now() + 2 * 60 * 60 * 1000)
      || !customerName || customerPhone.replace(/\D/g, "").length < 7
      || !customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)
    ) return NextResponse.json({ error: "Revê o restaurante, data, número de pessoas, telemóvel e email do cliente." }, { status: 400 });

    if (externalRequest) {
      const maxDate = new Date(Date.now() + EXTERNAL_REFERRAL_MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000);
      if (
        !externalPlaceId || !EXTERNAL_PLACE_PROVIDERS.has(externalPlaceProvider)
        || (externalRestaurantEmail && !isValidPublicRestaurantEmail(externalRestaurantEmail))
        || desiredDate > maxDate
      ) {
        return NextResponse.json({ error: `Escolhe um restaurante válido do catálogo e seleciona uma data nos próximos ${EXTERNAL_REFERRAL_MAX_ADVANCE_DAYS} dias.` }, { status: 400 });
      }
    }

    const tagNote = (tags: readonly { value: string; note: string | null }[], value: unknown) => tags.find((tag) => tag.value === value)?.note;
    const notes = [
      tagNote(REFERRAL_OCCASION_TAGS, body?.occasion),
      tagNote(REFERRAL_ACCESSIBILITY_TAGS, body?.accessibility),
      tagNote(REFERRAL_DIETARY_TAGS, body?.dietary),
      requirements.length ? `Pedidos: ${requirements.join(", ")}.` : null,
    ].filter(Boolean).join(" ") || null;
    const publicCode = createReferralCode();

    if (externalRequest) {
      if (externalPlaceProvider === "MESALINK") {
        const registeredRestaurant = await prisma.restaurant.findUnique({
          where: { id: externalPlaceId },
          select: { id: true, name: true, email: true, address: true, user: { select: { email: true } } },
        });
        const contactEmail = registeredRestaurant?.email || registeredRestaurant?.user?.email || "";
        if (!registeredRestaurant || !isValidPublicRestaurantEmail(contactEmail)) {
          return NextResponse.json({ error: "Este restaurante deixou de estar disponível. Escolhe outro restaurante." }, { status: 409 });
        }
        if (!registeredRestaurant.email) await prisma.restaurant.update({ where: { id: registeredRestaurant.id }, data: { email: contactEmail } });
        const group = await prisma.referralGroup.create({
          data: {
            publicCode,
            partnerId: partner.id,
            desiredDate,
            guests,
            adults,
            children,
            customerName,
            customerPhone,
            customerEmail,
            targetMode: "EXTERNAL",
            targetSummary: registeredRestaurant.name,
            area: registeredRestaurant.address || null,
            notes,
            commissionType: "PER_PERSON",
            commissionAmount: EXTERNAL_REFERRAL_COMMISSION_PER_PERSON,
            platformFeePercent: MESALINK_REFERRAL_FEE_PERCENT,
            expiresAt: desiredDate,
            offers: { create: { restaurantId: registeredRestaurant.id, commissionType: "PER_PERSON", commissionAmount: EXTERNAL_REFERRAL_COMMISSION_PER_PERSON, platformFeePercent: MESALINK_REFERRAL_FEE_PERCENT, status: "PENDING" } },
          },
          include: { offers: { select: { id: true } } },
        });
        createdGroupId = group.id;
        await issueExternalReferralAccess(group.offers[0].id, request.url);
        return NextResponse.json({ success: true, pending: true, publicCode: group.publicCode, restaurantName: registeredRestaurant.name });
      }
      const [catalog, placeRestaurant] = await Promise.all([
        prisma.externalRestaurantPlace.findFirst({
          where: { provider: externalPlaceProvider, placeId: externalPlaceId },
          select: { name: true, address: true, latitude: true, longitude: true, phone: true, mapUrl: true, websiteUrl: true, heroImage: true, contactEmail: true, published: true },
        }),
        prisma.restaurant.findFirst({
          where: { externalPlaceProvider, externalPlaceId },
          select: { id: true, name: true, email: true, externalPlaceProvider: true, externalPlaceId: true },
        }),
      ]);
      const place = await getGoogleRestaurant(externalPlaceId);
      let contactEmail = catalog?.contactEmail || placeRestaurant?.email || externalRestaurantEmail || place.email || "";
      if (!contactEmail && place.websiteUrl) contactEmail = await discoverRestaurantEmail(place.websiteUrl) || "";
      if (!isValidPublicRestaurantEmail(contactEmail)) {
        return NextResponse.json({ error: "Este restaurante deixou de estar disponível. Escolhe outro restaurante." }, { status: 409 });
      }

      let restaurant = placeRestaurant;
      if (!restaurant) {
        restaurant = await prisma.restaurant.findFirst({
          where: { email: { equals: contactEmail, mode: "insensitive" }, externalPlaceId: null },
          select: { id: true, name: true, email: true, externalPlaceProvider: true, externalPlaceId: true },
        });
      }
      if (!restaurant) {
        restaurant = await prisma.restaurant.create({
          data: {
            name: place.name,
            slug: `pending-${publicCode.toLowerCase()}`,
            email: contactEmail,
            phone: place.phone || null,
            address: place.address || null,
            latitude: place.latitude,
            longitude: place.longitude,
            externalPlaceProvider,
            externalPlaceId,
            externalMapUrl: place.mapUrl,
            externalPlaceSyncedAt: new Date(),
            onlineReservationsEnabled: false,
          },
          select: { id: true, name: true, email: true, externalPlaceProvider: true, externalPlaceId: true },
        });
      } else {
        restaurant = await prisma.restaurant.update({
          where: { id: restaurant.id },
          data: {
            name: place.name,
            email: contactEmail,
            phone: place.phone || undefined,
            address: place.address || undefined,
            latitude: place.latitude,
            longitude: place.longitude,
            externalPlaceProvider,
            externalPlaceId,
            externalMapUrl: place.mapUrl,
            externalPlaceSyncedAt: new Date(),
          },
          select: { id: true, name: true, email: true, externalPlaceProvider: true, externalPlaceId: true },
        });
      }

      await prisma.externalRestaurantPlace.upsert({
        where: { placeId: externalPlaceId },
        create: { provider: externalPlaceProvider, placeId: externalPlaceId, contactEmail, contactCheckedAt: new Date(), lastSelectedAt: new Date(), selectionCount: 1 },
        update: { contactEmail, contactCheckedAt: new Date(), lastSelectedAt: new Date(), selectionCount: { increment: 1 } },
      });

      const group = await prisma.referralGroup.create({
        data: {
          publicCode,
          partnerId: partner.id,
          desiredDate,
          guests,
          adults,
          children,
          customerName,
          customerPhone,
          customerEmail,
          targetMode: "EXTERNAL",
          targetSummary: place.name,
          area: place.address || null,
          notes,
          commissionType: "PER_PERSON",
          commissionAmount: EXTERNAL_REFERRAL_COMMISSION_PER_PERSON,
          platformFeePercent: MESALINK_REFERRAL_FEE_PERCENT,
          expiresAt: desiredDate,
          offers: {
            create: {
              restaurantId: restaurant.id,
              commissionType: "PER_PERSON",
              commissionAmount: EXTERNAL_REFERRAL_COMMISSION_PER_PERSON,
              platformFeePercent: MESALINK_REFERRAL_FEE_PERCENT,
              status: "PENDING",
            },
          },
        },
        include: { offers: { select: { id: true } } },
      });
      createdGroupId = group.id;
      await issueExternalReferralAccess(group.offers[0].id, request.url);
      return NextResponse.json({ success: true, pending: true, publicCode: group.publicCode, restaurantName: place.name });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        slug: true,
        referralNetworkEnabled: true,
        referralAutoAcceptEnabled: true,
        referralDefaultCommissionType: true,
        referralDefaultCommissionAmount: true,
        referralPaymentMethodId: true,
        referralPaymentBlockedAt: true,
        referralProfileCuisine: true,
        websiteCuisine: true,
        referralAgreements: {
          where: { partnerId: partner.id, active: true },
          take: 1,
          select: { commissionType: true, commissionAmount: true },
        },
      },
    });
    const isDemo = Boolean(restaurant?.slug.includes("demo"));
    if (!restaurant || !restaurant.referralNetworkEnabled || !restaurant.referralAutoAcceptEnabled || !restaurant.referralPaymentMethodId || restaurant.referralPaymentBlockedAt) {
      return NextResponse.json({ error: "Este restaurante já não aceita reservas automáticas." }, { status: 409 });
    }

    const agreement = restaurant.referralAgreements[0];
    const commissionType = agreement && isCommissionType(agreement.commissionType)
      ? agreement.commissionType
      : isCommissionType(restaurant.referralDefaultCommissionType) ? restaurant.referralDefaultCommissionType : "PER_PERSON";
    const commissionAmount = isDemo ? 1.5 : Number(agreement?.commissionAmount ?? restaurant.referralDefaultCommissionAmount);
    const group = await prisma.referralGroup.create({
      data: {
        publicCode,
        partnerId: partner.id,
        desiredDate,
        guests,
        adults,
        children,
        customerName,
        customerPhone,
        customerEmail,
        targetMode: "SELECTED",
        targetSummary: restaurant.name,
        cuisineTypes: [restaurant.referralProfileCuisine || restaurant.websiteCuisine || "Restaurante"],
        notes,
        commissionType,
        commissionAmount,
        platformFeePercent: MESALINK_REFERRAL_FEE_PERCENT,
        expiresAt: desiredDate,
        offers: { create: { restaurantId, commissionType, commissionAmount, platformFeePercent: MESALINK_REFERRAL_FEE_PERCENT, status: "PENDING" } },
      },
      include: { offers: { select: { id: true } } },
    });
    createdGroupId = group.id;
    const result = await finalizeInstantReferralBooking(group.offers[0].id);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (createdGroupId) await prisma.referralGroup.deleteMany({ where: { id: createdGroupId, status: "OPEN" } }).catch(() => undefined);
    if (error instanceof InstantReferralBookingError) {
      const messages = {
        UNAVAILABLE: "Este restaurante já não está disponível.",
        CAPACITY: "Entretanto os últimos lugares foram reservados. Escolhe outro restaurante.",
        PAYMENT: "O restaurante precisa de atualizar o cartão antes de receber novas reservas automáticas.",
        AUTHORIZATION_TOO_SHORT: "A data está demasiado distante para garantir a comissão neste cartão.",
        FISCAL: "O restaurante precisa de completar os dados fiscais antes de receber esta reserva.",
      };
      return NextResponse.json({ error: messages[error.code] }, { status: 409 });
    }
    console.error("Create instant referral booking error:", error);
    return NextResponse.json({ error: "Não foi possível confirmar a reserva." }, { status: 500 });
  }
}
