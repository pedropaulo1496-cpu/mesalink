import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  REFERRAL_ACCESSIBILITY_TAGS,
  REFERRAL_DIETARY_TAGS,
  REFERRAL_OCCASION_TAGS,
  REFERRAL_REQUIREMENT_TAGS,
  isReferralCuisineTag,
} from "@/lib/referral-tags";
import {
  MESALINK_REFERRAL_FEE_PERCENT,
  createReferralCode,
  isCommissionType,
} from "@/lib/referrals";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const body = await request.json().catch(() => null);
    const submittedRestaurantIds: string[] = Array.isArray(body?.restaurantIds)
      ? Array.from(
          new Set<string>(
            (body.restaurantIds as unknown[]).flatMap((value) =>
              typeof value === "string" ? [value] : [],
            ),
          ),
        )
      : [];
    const targetMode = ["ALL", "FILTERED", "SELECTED"].includes(body?.targetMode) ? body.targetMode : "SELECTED";
    const restaurantQuery = typeof body?.restaurantQuery === "string" ? body.restaurantQuery.trim().slice(0, 100) : "";
    const restaurantCuisine = typeof body?.restaurantCuisine === "string" && body.restaurantCuisine !== "ALL" ? body.restaurantCuisine.trim().slice(0, 80) : "";
    const legacyGuests = Number(body?.guests);
    const requestedAdults = Number(body?.adults);
    const requestedChildren = Number(body?.children);
    const adults = Number.isInteger(requestedAdults) ? requestedAdults : legacyGuests;
    const children = Number.isInteger(requestedChildren) ? requestedChildren : 0;
    const guests = adults + children;
    const desiredDate = new Date(body?.desiredDate);
    const commissionType = isCommissionType(body?.commissionType) ? body.commissionType : null;
    const commissionAmount = Number(body?.commissionAmount);
    const budgetPerPerson = body?.budgetPerPerson ? Number(body.budgetPerPerson) : null;
    const customerName = typeof body?.customerName === "string" ? body.customerName.trim().slice(0, 100) : "";
    const customerPhone = typeof body?.customerPhone === "string" ? body.customerPhone.trim().slice(0, 30) : "";
    const customerEmail = typeof body?.customerEmail === "string" ? body.customerEmail.trim().toLowerCase().slice(0, 160) : "";
    const city = typeof body?.city === "string" ? body.city.trim().slice(0, 100) : "";
    const cuisineTypes: string[] = Array.isArray(body?.cuisineTypes)
      ? Array.from(new Set<string>((body.cuisineTypes as unknown[]).flatMap((item) => isReferralCuisineTag(item) ? [item] : []))).slice(0, 3)
      : [];
    const requirements = Array.isArray(body?.requirements)
      ? Array.from(new Set(body.requirements.filter(
          (item: unknown): item is string => typeof item === "string"
            && (REFERRAL_REQUIREMENT_TAGS as readonly string[]).includes(item),
        ))).slice(0, 5)
      : [];

    if (
      (targetMode === "SELECTED" && submittedRestaurantIds.length === 0) ||
      !Number.isInteger(adults) ||
      adults < 1 ||
      !Number.isInteger(children) ||
      children < 0 ||
      !Number.isInteger(guests) ||
      guests < 1 ||
      guests > 200 ||
      Number.isNaN(desiredDate.getTime()) ||
      desiredDate <= new Date(Date.now() + 2 * 60 * 60 * 1000) ||
      !commissionType ||
      !Number.isFinite(commissionAmount) ||
      commissionAmount <= 0 ||
      commissionAmount > 1000
      || !customerName
      || !city
      || cuisineTypes.length === 0
      || customerPhone.replace(/\D/g, "").length < 7
      || (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail))
    ) {
      return NextResponse.json({ error: "Revê a data, o grupo, a cidade, o tipo de cozinha, a comissão e os restaurantes." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { referralPartner: true },
    });
    const partner = user?.referralPartner;

    if (!partner || partner.status === "SUSPENDED") {
      return NextResponse.json({ error: "A conta Partner não está disponível." }, { status: 403 });
    }

    if (!partner.stripeOnboardingComplete || !partner.stripeAccountId) {
      return NextResponse.json({ error: "Adiciona e valida primeiro o teu IBAN para poderes publicar grupos." }, { status: 403 });
    }

    const openGroups = await prisma.referralGroup.count({ where: { partnerId: partner.id, status: "OPEN" } });
    if (openGroups >= 20) return NextResponse.json({ error: "Conclui ou cancela pedidos em aberto antes de publicar novos grupos." }, { status: 429 });

    const restaurantWhere = targetMode === "SELECTED"
      ? { id: { in: submittedRestaurantIds } }
      : {
          AND: [
            ...(restaurantCuisine ? [{ OR: [
              { websiteCuisine: { contains: restaurantCuisine, mode: "insensitive" as const } },
              { referralProfileCuisine: { contains: restaurantCuisine, mode: "insensitive" as const } },
            ] }] : []),
            ...(targetMode === "FILTERED" && restaurantQuery ? [{ OR: [
              { name: { contains: restaurantQuery, mode: "insensitive" as const } },
              { websiteCuisine: { contains: restaurantQuery, mode: "insensitive" as const } },
              { referralProfileCuisine: { contains: restaurantQuery, mode: "insensitive" as const } },
              { address: { contains: restaurantQuery, mode: "insensitive" as const } },
            ] }] : []),
          ],
        };
    const restaurantCandidates = await prisma.restaurant.findMany({
      where: restaurantWhere,
      orderBy: { name: "asc" },
      select: { id: true, referralMaxCommissionPerPerson: true },
    });
    const submittedGrossCommission = commissionType === "PER_PERSON" ? guests * commissionAmount : commissionAmount;
    const submittedCommissionPerPerson = submittedGrossCommission / Math.max(1, guests);
    const restaurants = restaurantCandidates.filter((restaurant) => restaurant.referralMaxCommissionPerPerson == null || submittedCommissionPerPerson <= Number(restaurant.referralMaxCommissionPerPerson));
    const restaurantIds = restaurants.map((restaurant) => restaurant.id);
    if (restaurantIds.length === 0) {
      return NextResponse.json({ error: "Os restaurantes escolhidos não recebem propostas acima deste valor por pessoa." }, { status: 400 });
    }

    if (targetMode === "SELECTED" && restaurantCandidates.length !== submittedRestaurantIds.length) {
      return NextResponse.json({ error: "Um dos restaurantes selecionados já não está disponível." }, { status: 409 });
    }

    const publicCode = createReferralCode();
    const expiresAt = new Date(Math.min(desiredDate.getTime() - 2 * 60 * 60 * 1000, Date.now() + 29 * 24 * 60 * 60 * 1000));
    const tagNote = (tags: readonly { value: string; note: string | null }[], value: unknown) => tags.find((tag) => tag.value === value)?.note;
    const notes = [
      tagNote(REFERRAL_OCCASION_TAGS, body?.occasion),
      tagNote(REFERRAL_ACCESSIBILITY_TAGS, body?.accessibility),
      tagNote(REFERRAL_DIETARY_TAGS, body?.dietary),
      requirements.length ? `Pedidos: ${requirements.join(", ")}.` : null,
    ].filter(Boolean).join(" ") || null;

    const group = await prisma.referralGroup.create({
      data: {
        publicCode,
        partnerId: partner.id,
        desiredDate,
        alternativeDate: body?.alternativeDate ? new Date(body.alternativeDate) : null,
        guests,
        adults,
        children,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        targetMode,
        targetSummary: targetMode === "ALL" ? "Todos os restaurantes MesaLink" : targetMode === "FILTERED" ? `${restaurantCuisine || "Todas as cozinhas"}${restaurantQuery ? ` · ${restaurantQuery}` : ""}` : `${restaurantIds.length} restaurantes selecionados`,
        cuisineTypes,
        city,
        area: typeof body?.area === "string" ? body.area.trim().slice(0, 120) || null : null,
        budgetPerPerson: Number.isFinite(budgetPerPerson) && Number(budgetPerPerson) > 0 ? Number(budgetPerPerson) : null,
        notes,
        commissionType,
        commissionAmount,
        platformFeePercent: MESALINK_REFERRAL_FEE_PERCENT,
        expiresAt,
        offers: {
          create: restaurantIds.map((restaurantId) => {
            return {
              restaurantId,
              commissionType,
              commissionAmount,
              platformFeePercent: MESALINK_REFERRAL_FEE_PERCENT,
            };
          }),
        },
      },
    });

    return NextResponse.json({ success: true, id: group.id, publicCode: group.publicCode, restaurantCount: restaurantIds.length });
  } catch (error) {
    console.error("Create referral group error:", error);
    return NextResponse.json({ error: "Não foi possível publicar o grupo." }, { status: 500 });
  }
}
