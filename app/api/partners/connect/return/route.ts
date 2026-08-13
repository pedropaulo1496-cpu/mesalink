import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL("/login?callbackUrl=/partners/app", request.url));

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { referralPartner: true },
  });
  const partner = user?.referralPartner;

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
