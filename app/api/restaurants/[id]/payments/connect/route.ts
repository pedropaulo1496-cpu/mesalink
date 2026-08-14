import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL("/login", request.url), 303);
  const restaurant = await prisma.restaurant.findFirst({ where: { id, user: { email: session.user.email } } });
  if (!restaurant) return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  try {
    let accountId = restaurant.paymentsStripeAccountId;
    if (!accountId) {
      const country = /^[A-Z]{2}$/.test(restaurant.billingCountry || "") ? restaurant.billingCountry! : "PT";
      const account = await stripe.accounts.create({
        type: "express",
        country,
        email: restaurant.billingEmail || restaurant.email || session.user.email,
        capabilities: { transfers: { requested: true } },
        business_profile: { name: restaurant.name, product_description: "Reservas, depósitos e experiências de restauração" },
        metadata: { restaurantId: restaurant.id, kind: "RESTAURANT_PAYMENTS" },
      });
      accountId = account.id;
      await prisma.restaurant.update({ where: { id }, data: { paymentsStripeAccountId: accountId } });
    }
    const origin = new URL(request.url).origin;
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/restaurants/${id}/no-show-protect?result=connect-required`,
      return_url: `${origin}/api/restaurants/${id}/payments/connect/return`,
      type: "account_onboarding",
    });
    return NextResponse.redirect(link.url, 303);
  } catch (error) {
    console.error("Restaurant payments Connect error", error);
    return NextResponse.redirect(new URL(`/restaurants/${id}/no-show-protect?result=connect-required`, request.url), 303);
  }
}
