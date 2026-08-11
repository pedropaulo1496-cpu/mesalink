import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { calculateReferralCommission, calculateReferralServiceFee, isCommissionType } from "@/lib/referrals";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL("/login", request.url), 303);

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  const offer = user
    ? await prisma.referralOffer.findFirst({
        where: { id: offerId, restaurant: { userId: user.id } },
        include: { group: true },
      })
    : null;

  if (!offer) return NextResponse.json({ error: "Oferta não encontrada." }, { status: 404 });
  const backUrl = new URL(`/restaurants/${offer.restaurantId}/partner-network`, request.url);

  if (offer.status !== "PENDING" || offer.group.status !== "OPEN" || offer.group.desiredDate <= new Date() || (offer.group.expiresAt && offer.group.expiresAt <= new Date())) {
    backUrl.searchParams.set("result", "unavailable");
    return NextResponse.redirect(backUrl, 303);
  }

  const commissionType = isCommissionType(offer.commissionType) ? offer.commissionType : "TOTAL";
  const amounts = calculateReferralCommission({
    guests: offer.group.guests,
    commissionType,
    commissionAmount: Number(offer.commissionAmount),
    platformFeePercent: Number(offer.platformFeePercent),
  });

  try {
    await prisma.$transaction(async (tx) => {
      const claim = await tx.referralGroup.updateMany({
        where: { id: offer.groupId, status: "OPEN", acceptedRestaurantId: null },
        data: {
          status: "ACCEPTED",
          acceptedRestaurantId: offer.restaurantId,
          commissionType: offer.commissionType,
          commissionAmount: offer.commissionAmount,
          platformFeePercent: offer.platformFeePercent,
        },
      });

      if (claim.count !== 1) throw new Error("GROUP_ALREADY_ACCEPTED");

      const reservation = await tx.reservation.create({
        data: {
          restaurantId: offer.restaurantId,
          customerName: `Grupo ${offer.group.publicCode}`,
          phone: "PRIVATE",
          email: null,
          date: offer.group.desiredDate,
          guests: offer.group.guests,
          status: "CONFIRMED",
          source: "PARTNER_NETWORK",
          notes: [
            `Referência anónima ${offer.group.publicCode}.`,
            offer.group.area ? `Zona pedida: ${offer.group.area}.` : "",
            offer.group.notes || "",
          ].filter(Boolean).join(" "),
        },
      });

      await Promise.all([
        tx.referralGroup.update({ where: { id: offer.groupId }, data: { reservationId: reservation.id, status: "BOOKED" } }),
        tx.referralOffer.update({ where: { id: offer.id }, data: { status: "ACCEPTED", respondedAt: new Date() } }),
        tx.referralOffer.updateMany({ where: { groupId: offer.groupId, id: { not: offer.id }, status: "PENDING" }, data: { status: "CLOSED", respondedAt: new Date() } }),
        tx.referralPayment.create({
          data: {
            groupId: offer.groupId,
            partnerId: offer.group.partnerId,
            grossCommission: amounts.gross,
            platformFee: amounts.platformFee,
            partnerNet: amounts.partnerNet,
            serviceFee: calculateReferralServiceFee(amounts.gross),
            status: "PENDING",
          },
        }),
      ]);
    });

    backUrl.searchParams.set("result", "accepted");
    return NextResponse.redirect(backUrl, 303);
  } catch (error) {
    console.error("Accept referral offer error:", error);
    backUrl.searchParams.set("result", "unavailable");
    return NextResponse.redirect(backUrl, 303);
  }
}
