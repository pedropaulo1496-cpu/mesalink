import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL("/login?callbackUrl=/partners/app", request.url), 303);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { referralPartner: true },
  });
  const partner = user?.referralPartner;

  if (!partner) return NextResponse.redirect(new URL("/partners/app", request.url), 303);

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
      refresh_url: `${origin}/partners/app?connect=refresh`,
      return_url: `${origin}/api/partners/connect/return`,
      type: "account_onboarding",
    });

    return NextResponse.redirect(accountLink.url, 303);
  } catch (error) {
    console.error("Stripe Connect onboarding error", error);
    const message = error instanceof Error ? error.message : "";
    let code = message.includes("signed up for Connect") ? "platform-not-enabled" : "unavailable";
    if (code === "platform-not-enabled") {
      const platform = await stripe.account.retrieve(null).catch(() => null);
      if (platform?.capabilities?.transfers === "active") code = "retry";
    }
    return NextResponse.redirect(new URL(`/partners/app?connect=${code}`, request.url), 303);
  }
}
