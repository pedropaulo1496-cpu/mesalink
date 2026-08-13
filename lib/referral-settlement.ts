import type Stripe from "stripe";
import { referralAttendanceDeadline, referralInvoiceDeadline, nextReferralPayoutAt } from "@/lib/referral-deadlines";
import { issueCapturedReferralInvoice } from "@/lib/referral-invoices";
import { blockRestaurantReferralPayments } from "@/lib/referral-payment-health";
import { calculatePartnerInvoiceAmounts, calculateReferralCommission, calculateReferralServiceFee, isCommissionType } from "@/lib/referrals";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { checkoutTaxAmount, proportionalTaxAmount } from "@/lib/stripe-tax";
import { recordSalesCommission } from "@/lib/sales-commissions";

export type ReferralAttendanceOutcome = "ATTENDED" | "NO_SHOW";

export class ReferralSettlementError extends Error {
  constructor(public code: "NOT_FOUND" | "TOO_EARLY" | "CONFIRMATION_EXPIRED" | "INVALID_ATTENDANCE" | "ALREADY_SETTLED" | "PAYMENT_FAILED") {
    super(code);
  }
}

export async function settleReferralAttendance({
  groupId,
  outcome,
  actualGuests,
  restaurantUserId,
  automatic = false,
}: {
  groupId: string;
  outcome: ReferralAttendanceOutcome;
  actualGuests?: number;
  restaurantUserId?: string;
  automatic?: boolean;
}) {
  const group = await prisma.referralGroup.findFirst({
    where: {
      id: groupId,
      ...(restaurantUserId ? { acceptedRestaurant: { userId: restaurantUserId } } : {}),
    },
    include: {
      reservation: true,
      payment: true,
      acceptedRestaurant: { select: { userId: true } },
    },
  });

  if (!group?.acceptedRestaurantId || !group.payment?.stripePaymentIntentId) {
    throw new ReferralSettlementError("NOT_FOUND");
  }
  if (group.status !== "BOOKED") throw new ReferralSettlementError("ALREADY_SETTLED");

  const now = new Date();
  if (group.desiredDate > now) throw new ReferralSettlementError("TOO_EARLY");
  const confirmationDeadline = referralAttendanceDeadline(group.desiredDate);
  if (!automatic && now >= confirmationDeadline) throw new ReferralSettlementError("CONFIRMATION_EXPIRED");

  if (outcome === "NO_SHOW") {
    const intent = await stripe.paymentIntents.retrieve(group.payment.stripePaymentIntentId);
    if (intent.status === "requires_capture") {
      await stripe.paymentIntents.cancel(intent.id, {}, { idempotencyKey: `referral_no_show_${group.payment.id}` });
    } else if (intent.status !== "canceled") {
      throw new ReferralSettlementError("ALREADY_SETTLED");
    }
    await prisma.$transaction([
      prisma.referralGroup.update({ where: { id: group.id }, data: { status: "NO_SHOW", actualGuests: 0 } }),
      prisma.referralPayment.update({ where: { id: group.payment.id }, data: { status: "CANCELLED_NO_SHOW", failedAt: null, lastError: null } }),
      ...(group.reservationId ? [prisma.reservation.update({ where: { id: group.reservationId }, data: { status: "NO_SHOW" } })] : []),
    ]);
    return { status: "NO_SHOW" as const, actualGuests: 0, confirmationDeadline };
  }

  const confirmedGuests = automatic ? group.guests : Number(actualGuests);
  if (!Number.isInteger(confirmedGuests) || confirmedGuests < 1 || confirmedGuests > group.guests) {
    throw new ReferralSettlementError("INVALID_ATTENDANCE");
  }

  const type = isCommissionType(group.commissionType) ? group.commissionType : "TOTAL";
  const amounts = calculateReferralCommission({
    guests: confirmedGuests,
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
      metadata: {
        actualGuests: String(confirmedGuests),
        referralGroupId: group.id,
        settlement: automatic ? "automatic_after_3_days" : "restaurant_confirmation",
      },
    }, { idempotencyKey: `referral_capture_${group.payment.id}_${confirmedGuests}` });
    if (attendanceAdjustment > 0) {
      await stripe.refunds.create({
        payment_intent: capturedIntent.id,
        amount: attendanceAdjustment,
        reason: "requested_by_customer",
        metadata: {
          kind: "REFERRAL_ATTENDANCE_ADJUSTMENT",
          referralPaymentId: group.payment.id,
          actualGuests: String(confirmedGuests),
        },
      }, { idempotencyKey: `referral_attendance_adjustment_${group.payment.id}_${confirmedGuests}` });
    }

    const capturedAt = new Date();
    await prisma.$transaction([
      prisma.referralGroup.update({ where: { id: group.id }, data: { status: "COMPLETED", actualGuests: confirmedGuests } }),
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
          capturedAt,
          paidAt: capturedAt,
          payoutDueAt: nextReferralPayoutAt(capturedAt),
          failedAt: null,
          lastError: null,
        },
      }),
      ...(group.reservationId ? [prisma.reservation.update({ where: { id: group.reservationId }, data: { status: "FINISHED", guests: confirmedGuests } })] : []),
    ]);

    // Extras dos comerciais incidem apenas sobre a receita MesaLink da rede
    // (a taxa de plataforma). Custos Stripe/serviço e impostos nunca entram na
    // base de comissão.
    if (group.acceptedRestaurant?.userId && amounts.platformFee > 0) {
      await recordSalesCommission({
        userId: group.acceptedRestaurant.userId,
        sourceType: "PARTNER_NETWORK",
        sourceId: group.payment.id,
        description: `Rede de Parceiros · margem MesaLink ${Number(group.platformFeePercent)}% · ${group.publicCode}`,
        grossCents: Math.round(amounts.platformFee * 100),
        currency: group.payment.currency,
        earnedAt: capturedAt,
      }).catch((error) => console.error("Record referral sales commission error", error));
    }

    await issueCapturedReferralInvoice(group.payment.id).catch(async (error) => {
      console.error("Issue captured referral invoice error", error);
      await prisma.referralPayment.update({
        where: { id: group.payment!.id },
        data: { lastError: error instanceof Error ? `Fatura Stripe: ${error.message}`.slice(0, 500) : "Não foi possível emitir a fatura Stripe." },
      });
    });

    return {
      status: "CAPTURED" as const,
      actualGuests: confirmedGuests,
      capturedAt,
      invoiceDeadline: referralInvoiceDeadline(capturedAt),
    };
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
      prisma.referralGroup.update({ where: { id: group.id }, data: { status: "COMPLETED", actualGuests: confirmedGuests } }),
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
      ...(group.reservationId ? [prisma.reservation.update({ where: { id: group.reservationId }, data: { status: "FINISHED", guests: confirmedGuests } })] : []),
    ]);
    await blockRestaurantReferralPayments(group.acceptedRestaurantId, "Existe uma comissão Partner em atraso. Substitui o cartão para a liquidar e reativar as reservas.");
    throw new ReferralSettlementError("PAYMENT_FAILED");
  }
}

export async function refundReferralWithoutValidInvoice(paymentId: string, now = new Date()) {
  const payment = await prisma.referralPayment.findUnique({
    where: { id: paymentId },
    include: { group: true },
  });
  if (!payment || payment.status !== "CAPTURED_AWAITING_PAYOUT" || !payment.capturedAt || !payment.stripePaymentIntentId || payment.stripeTransferId) {
    return { status: "ignored" as const };
  }
  if (!["MISSING", "REJECTED"].includes(payment.partnerInvoiceStatus)) return { status: "invoice-present" as const };
  if (referralInvoiceDeadline(payment.capturedAt) > now) return { status: "not-due" as const };

  const intent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId, { expand: ["latest_charge"] });
  const charge = typeof intent.latest_charge === "string" || !intent.latest_charge
    ? null
    : intent.latest_charge as Stripe.Charge;
  const remainingCents = charge ? Math.max(0, charge.amount - charge.amount_refunded) : Math.max(0, intent.amount_received);
  if (remainingCents > 0) {
    await stripe.refunds.create({
      payment_intent: intent.id,
      amount: remainingCents,
      reason: "requested_by_customer",
      metadata: {
        kind: "REFERRAL_INVOICE_DEADLINE_EXPIRED",
        referralPaymentId: payment.id,
        referralGroupId: payment.groupId,
      },
    }, { idempotencyKey: `referral_invoice_expiry_refund_${payment.id}` });
  }

  let creditNoteError: string | null = null;
  if (payment.stripeInvoiceId) {
    try {
      const invoice = await stripe.invoices.retrieve(payment.stripeInvoiceId);
      const creditAmount = Math.max(0, invoice.amount_paid - invoice.post_payment_credit_notes_amount);
      if (creditAmount > 0) {
        await stripe.creditNotes.create({
          invoice: invoice.id,
          amount: creditAmount,
          out_of_band_amount: creditAmount,
          reason: "order_change",
          email_type: "credit_note",
          memo: `Reserva ${payment.group.publicCode}: comissão devolvida por falta de fatura válida do parceiro dentro de 30 dias.`,
          metadata: { referralPaymentId: payment.id, referralGroupId: payment.groupId },
        }, { idempotencyKey: `referral_invoice_expiry_credit_note_${payment.id}` });
      }
    } catch (error) {
      creditNoteError = error instanceof Error ? error.message.slice(0, 350) : "Não foi possível emitir a nota de crédito Stripe.";
      console.error("Referral invoice expiry credit note failed", payment.id, error);
    }
  }

  const refundTotal = Number(payment.refundedAmount) + remainingCents / 100;
  await prisma.$transaction([
    prisma.referralPayment.update({
      where: { id: payment.id },
      data: {
        status: "REFUNDED_INVOICE_EXPIRED",
        refundedAmount: refundTotal,
        reversedAmount: payment.partnerInvoiceTotal,
        refundedAt: now,
        lastError: creditNoteError ? `Nota de crédito Stripe: ${creditNoteError}` : null,
      },
    }),
    prisma.referralGroup.update({ where: { id: payment.groupId }, data: { status: "REFUNDED" } }),
  ]);
  return { status: "refunded" as const, amount: remainingCents / 100 };
}
