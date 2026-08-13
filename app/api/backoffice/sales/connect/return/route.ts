import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffIdentity } from "@/lib/staff-auth";
import { stripe } from "@/lib/stripe";

export async function GET(request: Request) {
  const staff = await getStaffIdentity();
  if (!staff || staff.role !== "SALES" || !staff.salesRepresentativeId) {
    return NextResponse.redirect(new URL("/backoffice-access", request.url));
  }

  const representative = await prisma.salesRepresentative.findUnique({
    where: { id: staff.salesRepresentativeId },
    select: { stripeAccountId: true },
  });
  if (!representative?.stripeAccountId) {
    return NextResponse.redirect(new URL("/backoffice/commissions?connect=missing", request.url));
  }

  try {
    const account = await stripe.accounts.retrieve(representative.stripeAccountId);
    const complete = !("deleted" in account) && Boolean(account.details_submitted && account.payouts_enabled);
    await prisma.salesRepresentative.update({
      where: { id: staff.salesRepresentativeId },
      data: { stripeOnboardingComplete: complete },
    });
    return NextResponse.redirect(new URL(`/backoffice/commissions?connect=${complete ? "complete" : "pending"}`, request.url));
  } catch (error) {
    console.error("Sales Stripe Connect return error", error);
    return NextResponse.redirect(new URL("/backoffice/commissions?connect=unavailable", request.url));
  }
}
