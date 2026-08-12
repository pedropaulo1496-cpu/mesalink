import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { authOptions } from "@/lib/auth";
import { calculateReferralCommission, calculateReferralServiceFee, isCommissionType } from "@/lib/referrals";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request, { params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL("/login", request.url), 303);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, subscription: { select: { stripeCustomerId: true } } },
  });
  const offer = user ? await prisma.referralOffer.findFirst({
    where: { id: offerId, restaurant: { userId: user.id } },
    include: { group: true, restaurant: { select: { id: true, name: true, email: true } } },
  }) : null;

  if (!offer) return NextResponse.json({ error: "Oferta não encontrada." }, { status: 404 });
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
  const backUrl = `${baseUrl}/restaurants/${offer.restaurantId}/partner-network`;
  if (offer.status !== "PENDING" || offer.group.status !== "OPEN" || offer.group.desiredDate <= new Date()) {
    return NextResponse.redirect(`${backUrl}?result=unavailable`, 303);
  }
  if (offer.group.publicCode.startsWith("DEMO-")) {
    return NextResponse.redirect(`${backUrl}?result=demo-safe`, 303);
  }

  const type = isCommissionType(offer.commissionType) ? offer.commissionType : "TOTAL";
  const amounts = calculateReferralCommission({
    guests: offer.group.guests,
    commissionType: type,
    commissionAmount: Number(offer.commissionAmount),
    platformFeePercent: Number(offer.platformFeePercent),
  });
  const serviceFee = calculateReferralServiceFee(amounts.gross);
  const checkoutParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    payment_method_types: ["card"],
    ...(user?.subscription?.stripeCustomerId
      ? { customer: user.subscription.stripeCustomerId, customer_update: { address: "auto" as const, name: "auto" as const } }
      : { customer_email: offer.restaurant.email || session.user.email, customer_creation: "always" as const }),
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    success_url: `${baseUrl}/api/referral-offers/${offer.id}/accept/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${backUrl}?result=authorization-cancelled`,
    locale: "auto",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(amounts.gross * 100),
          product_data: {
            name: `Garantia do grupo ${offer.group.publicCode}`,
            description: `${offer.group.guests} pessoas · comissão protegida até confirmar a presença`,
          },
        },
      },
      ...(serviceFee > 0 ? [{
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(serviceFee * 100),
          product_data: {
            name: "Proteção e processamento MesaLink",
            description: "Autorização do cartão, reserva e processamento do pagamento.",
          },
        },
      }] : []),
    ],
    metadata: {
      kind: "REFERRAL_AUTHORIZATION",
      offerId: offer.id,
      referralGroupId: offer.groupId,
      restaurantId: offer.restaurantId,
    },
    payment_intent_data: {
      capture_method: "manual",
      transfer_group: `REFERRAL_${offer.groupId}`,
      metadata: {
        kind: "REFERRAL_AUTHORIZATION",
        offerId: offer.id,
        referralGroupId: offer.groupId,
        restaurantId: offer.restaurantId,
      },
    },
    payment_method_options: {
      card: {
        request_extended_authorization: "if_available",
      },
    },
  };
  const attemptKey = `referral_authorization_${offer.id}_${Math.floor(Date.now() / 60000)}`;
  let checkout: Stripe.Checkout.Session;
  try {
    checkout = await stripe.checkout.sessions.create(checkoutParams, { idempotencyKey: attemptKey });
  } catch (error) {
    const stripeError = error as { code?: string; message?: string };
    if (stripeError.code !== "payment_intent_invalid_parameter" || !stripeError.message?.includes("not eligible")) throw error;
    const standardAuthorizationParams = { ...checkoutParams };
    delete standardAuthorizationParams.payment_method_options;
    checkout = await stripe.checkout.sessions.create(standardAuthorizationParams, { idempotencyKey: `${attemptKey}_standard` });
  }

  if (!checkout.url) return NextResponse.redirect(`${backUrl}?result=payment-error`, 303);
  return NextResponse.redirect(checkout.url, 303);
}
