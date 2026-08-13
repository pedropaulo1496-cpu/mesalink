import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL("/login", request.url));
  const restaurant = await prisma.restaurant.findFirst({ where: { id, user: { email: session.user.email } }, select: { paymentsStripeAccountId: true } });
  if (!restaurant?.paymentsStripeAccountId) return NextResponse.redirect(new URL(`/restaurants/${id}/revenue?tab=protect&result=connect-required`, request.url));
  const account = await stripe.accounts.retrieve(restaurant.paymentsStripeAccountId);
  const complete = Boolean(account.details_submitted && account.payouts_enabled);
  await prisma.restaurant.update({ where: { id }, data: { paymentsStripeOnboardingComplete: complete } });
  return NextResponse.redirect(new URL(`/restaurants/${id}/revenue?tab=protect&result=${complete ? "connected" : "connect-required"}`, request.url));
}
