import { NextResponse } from "next/server";
import { findExternalReferralOffer, isExternalReferralSimulation, notifyExternalReferralOutcome } from "@/lib/external-referral-requests";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const offer = await findExternalReferralOffer(token);
  const backUrl = new URL(`/partner-reservation/${token}`, request.url);
  if (!offer || offer.group.targetMode !== "EXTERNAL" || offer.status !== "PENDING" || offer.group.status !== "OPEN") return NextResponse.redirect(backUrl, 303);
  if (isExternalReferralSimulation(offer)) {
    backUrl.searchParams.set("result", "simulated-declined");
    return NextResponse.redirect(backUrl, 303);
  }
  await prisma.$transaction([
    prisma.referralOffer.update({ where: { id: offer.id }, data: { status: "DECLINED", respondedAt: new Date() } }),
    prisma.referralGroup.update({ where: { id: offer.groupId }, data: { status: "CANCELLED" } }),
  ]);
  await notifyExternalReferralOutcome(offer.id, "DECLINED").catch((error) => console.error("External referral decline notification failed", error));
  return NextResponse.redirect(backUrl, 303);
}
