import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL("/login", request.url), 303);

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, user: { email: session.user.email } },
    select: {
      id: true,
      name: true,
      email: true,
      user: { select: { id: true, subscription: { select: { stripeCustomerId: true } } } },
    },
  });
  if (!restaurant?.user) return NextResponse.redirect(new URL("/dashboard", request.url), 303);

  let customerId = restaurant.user.subscription?.stripeCustomerId || null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: restaurant.email || session.user.email,
      name: restaurant.name,
      metadata: { userId: restaurant.user.id, restaurantId: restaurant.id },
    });
    customerId = customer.id;
    await prisma.subscription.upsert({
      where: { userId: restaurant.user.id },
      create: { userId: restaurant.user.id, stripeCustomerId: customerId },
      update: { stripeCustomerId: customerId },
    });
  }

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
  const checkout = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    payment_method_types: ["card"],
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    customer_update: { address: "auto", name: "auto" },
    success_url: `${baseUrl}/api/restaurants/${id}/referral-auto-accept/setup/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/restaurants/${id}/partner-network?result=card-cancelled`,
    locale: "auto",
    metadata: { kind: "REFERRAL_AUTO_ACCEPT_SETUP", restaurantId: id },
  });

  if (!checkout.url) return NextResponse.redirect(new URL(`/restaurants/${id}/partner-network?result=card-error`, request.url), 303);
  return NextResponse.redirect(checkout.url, 303);
}
