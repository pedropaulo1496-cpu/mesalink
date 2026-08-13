import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffIdentity } from "@/lib/staff-auth";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const staff = await getStaffIdentity();
  if (!staff || staff.role !== "SALES" || !staff.salesRepresentativeId) {
    return NextResponse.redirect(new URL("/backoffice-access", request.url), 303);
  }

  try {
    const representative = await prisma.salesRepresentative.findUniqueOrThrow({
      where: { id: staff.salesRepresentativeId },
      select: { id: true, name: true, email: true, stripeAccountId: true },
    });
    let accountId = representative.stripeAccountId;
    if (!accountId) {
      const country = /^[A-Z]{2}$/.test(process.env.STRIPE_CONNECT_COUNTRY || "")
        ? process.env.STRIPE_CONNECT_COUNTRY!
        : "PT";
      const account = await stripe.accounts.create({
        type: "express",
        country,
        email: representative.email,
        capabilities: { transfers: { requested: true } },
        business_type: "individual",
        business_profile: {
          name: representative.name,
          product_description: "Serviços comerciais prestados à MesaLink",
        },
        metadata: { salesRepresentativeId: representative.id },
      });
      accountId = account.id;
      await prisma.salesRepresentative.update({
        where: { id: representative.id },
        data: { stripeAccountId: accountId, stripeOnboardingComplete: false },
      });
    }

    const origin = new URL(request.url).origin;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/backoffice/commissions?connect=refresh`,
      return_url: `${origin}/api/backoffice/sales/connect/return`,
      type: "account_onboarding",
    });
    return NextResponse.redirect(accountLink.url, 303);
  } catch (error) {
    console.error("Sales Stripe Connect onboarding error", error);
    return NextResponse.redirect(new URL("/backoffice/commissions?connect=unavailable", request.url), 303);
  }
}
