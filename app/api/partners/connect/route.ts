import { NextResponse } from "next/server";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.redirect(new URL("/partners/login", request.url), 303);

  try {
    let accountId = partner.stripeAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "PT",
        email: partner.email,
        capabilities: { transfers: { requested: true } },
        business_type: ["HOTEL", "AGENCY", "COMPANY"].includes(partner.partnerType) ? "company" : "individual",
        business_profile: {
          name: partner.businessName,
          product_description: "Referências profissionais de grupos para restaurantes",
        },
        metadata: { referralPartnerId: partner.id },
      });
      accountId = account.id;
      await prisma.referralPartner.update({ where: { id: partner.id }, data: { stripeAccountId: accountId } });
    }

    const origin = new URL(request.url).origin;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/partners/app?tab=account&connect=refresh`,
      return_url: `${origin}/api/partners/connect/return`,
      type: "account_onboarding",
    });

    return NextResponse.redirect(accountLink.url, 303);
  } catch (error) {
    console.error("Stripe Connect onboarding error", error);
    const message = error instanceof Error ? error.message : "";
    const code = message.includes("signed up for Connect") ? "platform-not-enabled" : "unavailable";
    return NextResponse.redirect(new URL(`/partners/app?tab=account&connect=${code}`, request.url), 303);
  }
}
