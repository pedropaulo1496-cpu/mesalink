import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recoverRestaurantReferralDebt } from "@/lib/referral-payment-health";
import { stripe } from "@/lib/stripe";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessionId = new URL(request.url).searchParams.get("session_id");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !sessionId) return NextResponse.redirect(new URL("/login", request.url), 303);

  const checkout = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["setup_intent"] });
  if (checkout.metadata?.kind !== "REFERRAL_AUTO_ACCEPT_SETUP" || checkout.metadata.restaurantId !== id) {
    return NextResponse.redirect(new URL(`/restaurants/${id}/partner-network?result=card-error`, request.url), 303);
  }

  const setupIntent = checkout.setup_intent as Stripe.SetupIntent | null;
  const paymentMethodId = typeof setupIntent?.payment_method === "string" ? setupIntent.payment_method : setupIntent?.payment_method?.id;
  const customerId = typeof checkout.customer === "string" ? checkout.customer : checkout.customer?.id;
  if (checkout.status !== "complete" || setupIntent?.status !== "succeeded" || !paymentMethodId || !customerId) {
    return NextResponse.redirect(new URL(`/restaurants/${id}/partner-network?result=card-error`, request.url), 303);
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, user: { email: session.user.email } },
    select: { id: true, billingLegalName: true, billingTaxId: true, billingAddressLine1: true, billingPostalCode: true, billingCity: true, billingCountry: true },
  });
  if (!restaurant) return NextResponse.redirect(new URL("/dashboard", request.url), 303);

  const billingComplete = Boolean(restaurant.billingLegalName && restaurant.billingTaxId && restaurant.billingAddressLine1 && restaurant.billingPostalCode && restaurant.billingCity && restaurant.billingCountry);
  if (!billingComplete) {
    return NextResponse.redirect(new URL(`/restaurants/${id}/partner-network?result=fiscal-required`, request.url), 303);
  }

  await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } });
  const recovery = await recoverRestaurantReferralDebt({ restaurantId: id, customerId, paymentMethodId });
  if (!recovery.success) {
    return NextResponse.redirect(new URL(`/restaurants/${id}/partner-network?result=debt-payment-failed`, request.url), 303);
  }

  const result = recovery.recoveredAmount > 0 ? "debt-settled" : "auto-accept-ready";
  return NextResponse.redirect(new URL(`/restaurants/${id}/partner-network?result=${result}`, request.url), 303);
}
