import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { calculatePartnerInvoiceAmounts, calculateReferralCommission, calculateReferralServiceFee, isCommissionType } from "@/lib/referrals";
import { issueCapturedReferralInvoice } from "@/lib/referral-invoices";
import { blockRestaurantReferralPayments } from "@/lib/referral-payment-health";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { checkoutTaxAmount, proportionalTaxAmount } from "@/lib/stripe-tax";

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
  const targetSubtotal = Math.round((amounts.gross + serviceFee) * 100);
  let targetTax = proportionalTaxAmount({
    originalSubtotal: Math.max(1, Math.round((Number(group.payment.grossCommission) + Number(group.payment.serviceFee)) * 100)),
    originalTax: Math.round(Number(group.payment.taxAmount) * 100),
    targetSubtotal,
  });

  try {
    const checkout = group.payment.stripeCheckoutSessionId
      ? await stripe.checkout.sessions.retrieve(group.payment.stripeCheckoutSessionId)
      : null;
    const originalSubtotal = checkout?.amount_subtotal || Math.round((Number(group.payment.grossCommission) + Number(group.payment.serviceFee)) * 100);
    const originalTax = checkout ? checkoutTaxAmount(checkout) : Math.round(Number(group.payment.taxAmount) * 100);
    const originalTotal = checkout?.amount_total || originalSubtotal + originalTax;
    targetTax = proportionalTaxAmount({ originalSubtotal, originalTax, targetSubtotal });
    const partnerInvoice = calculatePartnerInvoiceAmounts({
      partnerNet: amounts.partnerNet,
      grossCommission: amounts.gross,
      serviceFee,
      taxAmount: targetTax / 100,
    });
    const targetTotal = targetSubtotal + targetTax;
    const attendanceAdjustment = Math.max(0, originalTotal - targetTotal);
    const intent = await stripe.paymentIntents.retrieve(group.payment.stripePaymentIntentId);
    if (intent.status !== "requires_capture" || intent.amount_capturable < originalTotal) {
      throw new Error("AUTHORIZATION_NOT_CAPTURABLE");
    }
    const capturedIntent = await stripe.paymentIntents.capture(intent.id, {
      amount_to_capture: originalTotal,
      metadata: { actualGuests: String(actualGuests), referralGroupId: group.id },
    }, { idempotencyKey: `referral_capture_${group.payment.id}_${actualGuests}` });
    if (attendanceAdjustment > 0) {
      await stripe.refunds.create({
        payment_intent: capturedIntent.id,
        amount: attendanceAdjustment,
        reason: "requested_by_customer",
        metadata: {
          kind: "REFERRAL_ATTENDANCE_ADJUSTMENT",
          referralPaymentId: group.payment.id,
          actualGuests: String(actualGuests),
        },
      }, { idempotencyKey: `referral_attendance_adjustment_${group.payment.id}_${actualGuests}` });
    }

    await prisma.$transaction([
      prisma.referralGroup.update({ where: { id: group.id }, data: { status: "COMPLETED", actualGuests } }),
      prisma.referralPayment.update({
        where: { id: group.payment.id },
        data: {
          grossCommission: amounts.gross,
          platformFee: amounts.platformFee,
          partnerNet: amounts.partnerNet,
          serviceFee,
          taxAmount: targetTax / 100,
          taxCountry: checkout?.customer_details?.address?.country || group.payment.taxCountry,
          partnerInvoiceBase: partnerInvoice.base,
          partnerInvoiceTax: partnerInvoice.tax,
          partnerInvoiceTotal: partnerInvoice.total,
          refundedAmount: attendanceAdjustment / 100,
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
    const message = error instanceof Error ? error.message.slice(0, 500) : "Capture failed";
    const partnerInvoice = calculatePartnerInvoiceAmounts({
      partnerNet: amounts.partnerNet,
      grossCommission: amounts.gross,
      serviceFee,
      taxAmount: targetTax / 100,
    });
    await prisma.$transaction([
      prisma.referralGroup.update({ where: { id: group.id }, data: { status: "COMPLETED", actualGuests } }),
      prisma.referralPayment.update({
        where: { id: group.payment.id },
        data: {
          grossCommission: amounts.gross,
          platformFee: amounts.platformFee,
          partnerNet: amounts.partnerNet,
          serviceFee,
          taxAmount: targetTax / 100,
          partnerInvoiceBase: partnerInvoice.base,
          partnerInvoiceTax: partnerInvoice.tax,
          partnerInvoiceTotal: partnerInvoice.total,
          status: "PAYMENT_FAILED",
          failedAt: new Date(),
          lastError: message,
        },
      }),
      ...(group.reservationId ? [prisma.reservation.update({ where: { id: group.reservationId }, data: { status: "FINISHED", guests: actualGuests } })] : []),
    ]);
    await blockRestaurantReferralPayments(group.acceptedRestaurantId, "Existe uma comissão Partner em atraso. Substitui o cartão para a liquidar e reativar as reservas.");
    backUrl.searchParams.set("result", "payment-blocked");
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
