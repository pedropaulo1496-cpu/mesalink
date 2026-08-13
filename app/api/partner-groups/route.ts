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
    const adults = Number(body?.adults);
    const children = Number(body?.children);
    const guests = adults + children;
    const desiredDate = new Date(body?.desiredDate);
    const customerName = typeof body?.customerName === "string" ? body.customerName.trim().slice(0, 100) : "";
    const customerPhone = typeof body?.customerPhone === "string" ? body.customerPhone.trim().slice(0, 30) : "";
    const customerEmail = typeof body?.customerEmail === "string" ? body.customerEmail.trim().toLowerCase().slice(0, 160) : "";
    const requirements = Array.isArray(body?.requirements)
      ? Array.from(new Set(body.requirements.filter((item: unknown): item is string => typeof item === "string" && (REFERRAL_REQUIREMENT_TAGS as readonly string[]).includes(item)))).slice(0, 5)
      : [];
    if (
      !restaurantId
      || !Number.isInteger(adults) || adults < 1
      || !Number.isInteger(children) || children < 0
      || !Number.isInteger(guests) || guests < 1 || guests > 200
      || Number.isNaN(desiredDate.getTime()) || desiredDate <= new Date(Date.now() + 2 * 60 * 60 * 1000)
      || !customerName || customerPhone.replace(/\D/g, "").length < 7
      || (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail))
    ) return NextResponse.json({ error: "Revê o restaurante, data, número de pessoas e contacto." }, { status: 400 });

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
    if (!restaurant || (!isDemo && (!restaurant.referralNetworkEnabled || !restaurant.referralAutoAcceptEnabled || !restaurant.referralPaymentMethodId))) {
      return NextResponse.json({ error: "Este restaurante já não aceita reservas automáticas." }, { status: 409 });
    }

    const agreement = restaurant.referralAgreements[0];
    const commissionType = agreement && isCommissionType(agreement.commissionType)
      ? agreement.commissionType
      : isCommissionType(restaurant.referralDefaultCommissionType) ? restaurant.referralDefaultCommissionType : "PER_PERSON";
    const commissionAmount = isDemo ? 1.5 : Number(agreement?.commissionAmount ?? restaurant.referralDefaultCommissionAmount);
    const tagNote = (tags: readonly { value: string; note: string | null }[], value: unknown) => tags.find((tag) => tag.value === value)?.note;
    const notes = [
      tagNote(REFERRAL_OCCASION_TAGS, body?.occasion),
      tagNote(REFERRAL_ACCESSIBILITY_TAGS, body?.accessibility),
      tagNote(REFERRAL_DIETARY_TAGS, body?.dietary),
      requirements.length ? `Pedidos: ${requirements.join(", ")}.` : null,
    ].filter(Boolean).join(" ") || null;
    const publicCode = createReferralCode();
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
        customerEmail: customerEmail || null,
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
