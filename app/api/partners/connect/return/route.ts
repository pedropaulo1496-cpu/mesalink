import { NextResponse } from "next/server";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.redirect(new URL("/partners/login", request.url));

  if (!partner?.stripeAccountId) return NextResponse.redirect(new URL("/partners/app?tab=account&connect=missing", request.url));

  const account = await stripe.accounts.retrieve(partner.stripeAccountId);
  const complete = Boolean(account.details_submitted && account.payouts_enabled);

  if (complete) {
    try {
      await stripe.balanceSettings.update(
        {
          payments: {
            payouts: {
              schedule: { interval: "weekly", weekly_payout_days: ["monday"] },
            },
          },
        },
        { stripeAccount: account.id },
      );
    } catch (error) {
      console.warn("Could not configure weekly partner payouts", error);
    }
  }

  await prisma.referralPartner.update({
    where: { id: partner.id },
    data: {
      stripeOnboardingComplete: complete,
      status: complete ? "ACTIVE" : partner.status,
    },
  });

  return NextResponse.redirect(new URL(`/partners/app?tab=account&connect=${complete ? "complete" : "pending"}`, request.url));
}
