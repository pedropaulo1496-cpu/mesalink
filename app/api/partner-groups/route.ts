import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    const restaurantIds: string[] = Array.isArray(body?.restaurantIds)
      ? Array.from(
          new Set<string>(
            (body.restaurantIds as unknown[]).flatMap((value) =>
              typeof value === "string" ? [value] : [],
            ),
          ),
        ).slice(0, 10)
      : [];
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

    if (
      restaurantIds.length === 0 ||
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
    ) {
      return NextResponse.json({ error: "Revê a data, o grupo, a comissão e os restaurantes." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { referralPartner: true },
    });
    const partner = user?.referralPartner;

    if (!partner || partner.status === "SUSPENDED") {
      return NextResponse.json({ error: "A conta Partner não está disponível." }, { status: 403 });
    }

    const openGroups = await prisma.referralGroup.count({ where: { partnerId: partner.id, status: "OPEN" } });
    if (openGroups >= 20) return NextResponse.json({ error: "Conclui ou cancela pedidos em aberto antes de publicar novos grupos." }, { status: 429 });

    const [restaurants, agreements] = await Promise.all([
      prisma.restaurant.findMany({
        where: { id: { in: restaurantIds }, referralNetworkEnabled: true },
        select: { id: true },
      }),
      prisma.referralAgreement.findMany({
        where: {
          partnerId: partner.id,
          restaurantId: { in: restaurantIds },
          active: true,
          OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
        },
      }),
    ]);

    if (restaurants.length !== restaurantIds.length) {
      return NextResponse.json({ error: "Um dos restaurantes já não está disponível na rede." }, { status: 409 });
    }

    const agreementByRestaurant = new Map(agreements.map((item) => [item.restaurantId, item]));
    const publicCode = createReferralCode();
    const expiresAt = new Date(Math.min(desiredDate.getTime() - 2 * 60 * 60 * 1000, Date.now() + 48 * 60 * 60 * 1000));
    const occasionLabels: Record<string, string> = {
      BIRTHDAY: "Ocasião: aniversário.",
      BUSINESS: "Ocasião: jantar de empresa.",
      CELEBRATION: "Ocasião: celebração.",
    };
    const accessibilityLabels: Record<string, string> = {
      STEP_FREE: "Acessibilidade: acesso sem degraus.",
      WHEELCHAIR: "Acessibilidade: espaço para cadeira de rodas.",
    };
    const dietaryLabels: Record<string, string> = {
      VEGETARIAN: "Alimentação: opções vegetarianas.",
      VEGAN: "Alimentação: opções vegan.",
      GLUTEN_FREE: "Alimentação: opções sem glúten.",
      MIXED: "Alimentação: necessidades variadas.",
    };
    const notes = [
      occasionLabels[String(body?.occasion || "")],
      accessibilityLabels[String(body?.accessibility || "")],
      dietaryLabels[String(body?.dietary || "")],
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
        cuisineTypes: Array.isArray(body?.cuisineTypes)
          ? body.cuisineTypes.filter((item: unknown): item is string => typeof item === "string").map((item: string) => item.slice(0, 60)).slice(0, 6)
          : [],
        city: typeof body?.city === "string" ? body.city.trim().slice(0, 100) || null : null,
        area: typeof body?.area === "string" ? body.area.trim().slice(0, 120) || null : null,
        budgetPerPerson: Number.isFinite(budgetPerPerson) && Number(budgetPerPerson) > 0 ? Number(budgetPerPerson) : null,
        notes,
        commissionType,
        commissionAmount,
        platformFeePercent: MESALINK_REFERRAL_FEE_PERCENT,
        expiresAt,
        offers: {
          create: restaurantIds.map((restaurantId) => {
            const agreement = agreementByRestaurant.get(restaurantId);
            return {
              restaurantId,
              commissionType: agreement?.commissionType || commissionType,
              commissionAmount: agreement?.commissionAmount || commissionAmount,
              platformFeePercent: MESALINK_REFERRAL_FEE_PERCENT,
            };
          }),
        },
      },
    });

    return NextResponse.json({ success: true, id: group.id, publicCode: group.publicCode });
  } catch (error) {
    console.error("Create referral group error:", error);
    return NextResponse.json({ error: "Não foi possível publicar o grupo." }, { status: 500 });
  }
}
