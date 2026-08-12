import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { calculateReferralCommission, calculateReferralServiceFee, isCommissionType } from "@/lib/referrals";
import { issueCapturedReferralInvoice } from "@/lib/referral-invoices";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL("/login", request.url), 303);

  const form = await request.formData();
  const outcome = form.get("outcome") === "NO_SHOW" ? "NO_SHOW" : "ATTENDED";
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  const group = user ? await prisma.referralGroup.findFirst({
    where: { id: groupId, acceptedRestaurant: { userId: user.id }, status: "BOOKED" },
    include: { reservation: true, payment: true },
  }) : null;

  if (!group?.acceptedRestaurantId || !group.payment?.stripePaymentIntentId) {
    return NextResponse.json({ error: "Grupo ou autorização não encontrados." }, { status: 404 });
  }
  const backUrl = new URL(`/restaurants/${group.acceptedRestaurantId}/partner-network`, request.url);
  if (group.desiredDate > new Date()) {
    backUrl.searchParams.set("result", "too-early");
    return NextResponse.redirect(backUrl, 303);
  }

  if (outcome === "NO_SHOW") {
    await stripe.paymentIntents.cancel(group.payment.stripePaymentIntentId).catch((error) => {
      console.warn("Could not release no-show authorization", error);
    });
    await prisma.$transaction([
      prisma.referralGroup.update({ where: { id: group.id }, data: { status: "NO_SHOW", actualGuests: 0 } }),
      prisma.referralPayment.update({ where: { id: group.payment.id }, data: { status: "CANCELLED_NO_SHOW", failedAt: new Date() } }),
      ...(group.reservationId ? [prisma.reservation.update({ where: { id: group.reservationId }, data: { status: "NO_SHOW" } })] : []),
    ]);
    backUrl.searchParams.set("result", "no-show");
    return NextResponse.redirect(backUrl, 303);
  }

  const actualGuests = Number(form.get("actualGuests"));
  if (!Number.isInteger(actualGuests) || actualGuests < 1 || actualGuests > group.guests) {
    backUrl.searchParams.set("result", "invalid-attendance");
    return NextResponse.redirect(backUrl, 303);
  }

  const type = isCommissionType(group.commissionType) ? group.commissionType : "TOTAL";
  const amounts = calculateReferralCommission({
    guests: actualGuests,
    commissionType: type,
    commissionAmount: Number(group.commissionAmount),
    platformFeePercent: Number(group.platformFeePercent),
  });
  const serviceFee = calculateReferralServiceFee(amounts.gross);
  const amountToCapture = Math.round((amounts.gross + serviceFee) * 100);

  try {
    const intent = await stripe.paymentIntents.retrieve(group.payment.stripePaymentIntentId);
    if (intent.status !== "requires_capture" || intent.amount_capturable < amountToCapture) {
      throw new Error("AUTHORIZATION_NOT_CAPTURABLE");
    }
    await stripe.paymentIntents.capture(intent.id, {
      amount_to_capture: amountToCapture,
      metadata: { actualGuests: String(actualGuests), referralGroupId: group.id },
    }, { idempotencyKey: `referral_capture_${group.payment.id}_${actualGuests}` });

    await prisma.$transaction([
      prisma.referralGroup.update({ where: { id: group.id }, data: { status: "COMPLETED", actualGuests } }),
      prisma.referralPayment.update({
        where: { id: group.payment.id },
        data: {
          grossCommission: amounts.gross,
          platformFee: amounts.platformFee,
          partnerNet: amounts.partnerNet,
          serviceFee,
          status: "CAPTURED_AWAITING_PAYOUT",
          capturedAt: new Date(),
          paidAt: new Date(),
          payoutDueAt: nextMonday(),
          lastError: null,
        },
      }),
      ...(group.reservationId ? [prisma.reservation.update({ where: { id: group.reservationId }, data: { status: "FINISHED", guests: actualGuests } })] : []),
    ]);
  } catch (error) {
    console.error("Capture referral authorization error", error);
    await prisma.referralPayment.update({ where: { id: group.payment.id }, data: { status: "AUTHORIZATION_EXPIRED", failedAt: new Date(), lastError: error instanceof Error ? error.message.slice(0, 500) : "Capture failed" } });
    backUrl.searchParams.set("result", "authorization-expired");
    return NextResponse.redirect(backUrl, 303);
  }

  try {
    await issueCapturedReferralInvoice(group.payment.id);
  } catch (error) {
    console.error("Issue captured referral invoice error", error);
    await prisma.referralPayment.update({
      where: { id: group.payment.id },
      data: { lastError: error instanceof Error ? `Fatura Stripe: ${error.message}`.slice(0, 500) : "Não foi possível emitir a fatura Stripe." },
    });
  }

  backUrl.searchParams.set("result", "captured");
  return NextResponse.redirect(backUrl, 303);
}

function nextMonday() {
  const date = new Date();
  const days = ((8 - date.getUTCDay()) % 7) || 7;
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(9, 0, 0, 0);
  return date;
}
