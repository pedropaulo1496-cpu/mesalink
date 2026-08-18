import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL("/login", request.url));
  const restaurant = await prisma.restaurant.findFirst({
    where: { id, user: { email: session.user.email } },
    include: { outboundReferralPartner: true },
  });
  if (!restaurant?.outboundReferralPartner?.stripeAccountId) return NextResponse.redirect(new URL(`/restaurants/${id}/partner-network?nearby=missing`, request.url));
  const account = await stripe.accounts.retrieve(restaurant.outboundReferralPartner.stripeAccountId);
  const complete = Boolean(account.details_submitted && account.payouts_enabled);
  await prisma.$transaction([
    prisma.referralPartner.update({ where: { id: restaurant.outboundReferralPartner.id }, data: { stripeOnboardingComplete: complete, status: complete ? "ACTIVE" : "PENDING" } }),
    prisma.restaurant.update({ where: { id }, data: { nearbyReferralEnabled: complete } }),
  ]);
  return NextResponse.redirect(new URL(`/restaurants/${id}/partner-network?nearby=${complete ? "complete" : "pending"}`, request.url));
}
