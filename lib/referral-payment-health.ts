import type Stripe from "stripe";
import { nextReferralPayoutAt } from "@/lib/referral-deadlines";
import { issueCapturedReferralInvoice } from "@/lib/referral-invoices";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const REFERRAL_DEBT_STATUSES = ["AUTHORIZATION_EXPIRED", "PAYMENT_FAILED"] as const;

export async function blockRestaurantReferralPayments(restaurantId: string, reason: string) {
  return prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      referralAutoAcceptEnabled: false,
      referralPaymentBlockedAt: new Date(),
      referralPaymentBlockReason: reason.slice(0, 500),
    },
  });
}

export async function recoverRestaurantReferralDebt({
  restaurantId,
  customerId,
  paymentMethodId,
}: {
  restaurantId: string;
  customerId: string;
  paymentMethodId: string;
}) {
  const payments = await prisma.referralPayment.findMany({
    where: {
      status: { in: [...REFERRAL_DEBT_STATUSES] },
      group: { acceptedRestaurantId: restaurantId },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      groupId: true,
      currency: true,
      grossCommission: true,
      serviceFee: true,
      taxAmount: true,
      checkoutAttempt: true,
    },
  });

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { referralPaymentMethodId: paymentMethodId },
  });

  let recoveredAmount = 0;
  for (const payment of payments) {
    const amount = Math.round((Number(payment.grossCommission) + Number(payment.serviceFee) + Number(payment.taxAmount)) * 100);
    const attempt = payment.checkoutAttempt + 1;
    try {
      const intent = await stripe.paymentIntents.create({
        amount,
        currency: payment.currency.toLowerCase(),
        customer: customerId,
        payment_method: paymentMethodId,
        payment_method_types: ["card"],
        confirm: true,
        off_session: true,
        error_on_requires_action: true,
        description: `Regularização MesaLink Partner ${payment.groupId}`,
        transfer_group: `REFERRAL_${payment.groupId}`,
        metadata: {
          kind: "REFERRAL_DEBT_RECOVERY",
          referralPaymentId: payment.id,
          referralGroupId: payment.groupId,
          restaurantId,
        },
        expand: ["latest_charge"],
      }, { idempotencyKey: `referral_debt_${payment.id}_${attempt}` });
      if (intent.status !== "succeeded") throw new Error(`PAYMENT_${intent.status.toUpperCase()}`);

      const charge = typeof intent.latest_charge === "string" || !intent.latest_charge
        ? null
        : intent.latest_charge as Stripe.Charge;
      await prisma.referralPayment.update({
        where: { id: payment.id },
        data: {
          status: "CAPTURED_AWAITING_PAYOUT",
          stripePaymentIntentId: intent.id,
          stripeChargeId: charge?.id || null,
          checkoutAttempt: attempt,
          failedAt: null,
          capturedAt: new Date(),
          paidAt: new Date(),
          payoutDueAt: nextReferralPayoutAt(),
          lastError: null,
        },
      });
      recoveredAmount += amount / 100;
      await issueCapturedReferralInvoice(payment.id).catch((error) => {
        console.error("Issue recovered referral invoice error", error);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível cobrar o valor em atraso.";
      await prisma.$transaction([
        prisma.referralPayment.update({
          where: { id: payment.id },
          data: { status: "PAYMENT_FAILED", checkoutAttempt: attempt, failedAt: new Date(), lastError: message.slice(0, 500) },
        }),
        prisma.restaurant.update({
          where: { id: restaurantId },
          data: {
            referralAutoAcceptEnabled: false,
            referralPaymentBlockedAt: new Date(),
            referralPaymentBlockReason: "Não foi possível liquidar todas as comissões Partner em atraso.",
          },
        }),
      ]);
      return { success: false as const, recoveredAmount, remainingPayments: payments.length };
    }
  }

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      referralNetworkEnabled: true,
      referralAutoAcceptEnabled: true,
      referralPaymentMethodId: paymentMethodId,
      referralPaymentBlockedAt: null,
      referralPaymentBlockReason: null,
    },
  });
  return { success: true as const, recoveredAmount, remainingPayments: 0 };
}
