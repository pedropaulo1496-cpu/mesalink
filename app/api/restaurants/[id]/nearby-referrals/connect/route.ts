import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { ensureRestaurantReferralPartner } from "@/lib/nearby-referrals";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL("/login", request.url), 303);
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.redirect(new URL("/login", request.url), 303);
  try {
    const partner = await ensureRestaurantReferralPartner(id, user.id);
    if (!partner) return NextResponse.redirect(new URL(`/restaurants/${id}/partner-network?nearby=not-found`, request.url), 303);
    let accountId = partner.stripeAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "PT",
        email: partner.email,
        capabilities: { transfers: { requested: true } },
        business_type: "company",
        business_profile: { name: partner.businessName, product_description: "Comissões por encaminhamento de clientes entre restaurantes MesaLink" },
        metadata: { referralPartnerId: partner.id, sourceRestaurantId: id },
      });
      accountId = account.id;
      await prisma.referralPartner.update({ where: { id: partner.id }, data: { stripeAccountId: accountId } });
    }
    const origin = new URL(request.url).origin;
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/restaurants/${id}/partner-network?nearby=refresh`,
      return_url: `${origin}/api/restaurants/${id}/nearby-referrals/connect/return`,
      type: "account_onboarding",
    });
    return NextResponse.redirect(link.url, 303);
  } catch (error) {
    console.error("Restaurant referral payout onboarding failed", error);
    return NextResponse.redirect(new URL(`/restaurants/${id}/partner-network?nearby=unavailable`, request.url), 303);
  }
}
