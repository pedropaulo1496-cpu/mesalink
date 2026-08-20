import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { calculateReferralCommission, calculateReferralServiceFee, isCommissionType } from "@/lib/referrals";
import { externalReferralBaseUrl, findExternalReferralOffer, isExternalReferralSimulation } from "@/lib/external-referral-requests";
import { referralPriceData } from "@/lib/stripe-tax";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const offer = await findExternalReferralOffer(token);
  const baseUrl = externalReferralBaseUrl(request.url);
  const backUrl = `${baseUrl}/partner-reservation/${token}`;
  if (!offer || offer.group.targetMode !== "EXTERNAL" || offer.status !== "PENDING" || offer.group.status !== "OPEN" || !offer.publicAccessExpiresAt || offer.publicAccessExpiresAt <= new Date() || offer.group.desiredDate <= new Date()) {
    return NextResponse.redirect(`${backUrl}?result=unavailable`, 303);
  }
  if (isExternalReferralSimulation(offer)) return NextResponse.redirect(`${backUrl}?result=simulated-accepted`, 303);

  const type = isCommissionType(offer.commissionType) ? offer.commissionType : "PER_PERSON";
  const amounts = calculateReferralCommission({ guests: offer.group.guests, commissionType: type, commissionAmount: Number(offer.commissionAmount), platformFeePercent: Number(offer.platformFeePercent) });
  const serviceFee = calculateReferralServiceFee(amounts.gross);
  const checkoutParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    customer_email: offer.restaurant.email || undefined,
    customer_creation: "always",
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    automatic_tax: { enabled: true },
    success_url: `${baseUrl}/api/public/partner-reservations/${token}/accept/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${backUrl}?result=cancelled`,
    locale: "pt",
    line_items: [
      { quantity: 1, price_data: referralPriceData({ currency: "eur", unitAmount: Math.round(amounts.gross * 100), name: `Garantia da reserva ${offer.group.publicCode}`, description: `${offer.group.guests} pessoas · comissão de ${amounts.gross.toFixed(2)} €` }) },
      ...(serviceFee > 0 ? [{ quantity: 1, price_data: referralPriceData({ currency: "eur", unitAmount: Math.round(serviceFee * 100), name: "Proteção e processamento MesaLink", description: "Autorização do cartão, gestão da reserva e processamento" }) }] : []),
    ],
    metadata: { kind: "REFERRAL_AUTHORIZATION", offerId: offer.id, referralGroupId: offer.groupId, restaurantId: offer.restaurantId, external: "true" },
    payment_intent_data: { capture_method: "manual", transfer_group: `REFERRAL_${offer.groupId}`, metadata: { kind: "REFERRAL_AUTHORIZATION", offerId: offer.id, referralGroupId: offer.groupId, restaurantId: offer.restaurantId, external: "true" } },
    payment_method_options: { card: { request_extended_authorization: "if_available" } },
  };
  const attemptKey = `external_referral_${offer.id}_${Math.floor(Date.now() / 60000)}`;
  let checkout: Stripe.Checkout.Session;
  try {
    checkout = await stripe.checkout.sessions.create(checkoutParams, { idempotencyKey: attemptKey });
  } catch (error) {
    const stripeError = error as { code?: string; message?: string };
    if (stripeError.code !== "payment_intent_invalid_parameter" || !stripeError.message?.includes("not eligible")) throw error;
    const standard = { ...checkoutParams };
    delete standard.payment_method_options;
    checkout = await stripe.checkout.sessions.create(standard, { idempotencyKey: `${attemptKey}_standard` });
  }
  return checkout.url ? NextResponse.redirect(checkout.url, 303) : NextResponse.redirect(`${backUrl}?result=payment-error`, 303);
}
