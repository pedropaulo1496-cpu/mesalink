import { NextResponse } from "next/server";
import { EXTERNAL_REFERRAL_MAX_ADVANCE_DAYS, findExternalReferralOffer, isExternalReferralSimulation, notifyExternalReferralOutcome } from "@/lib/external-referral-requests";
import { prisma } from "@/lib/prisma";
import { reservationTimeZone, zonedDateTimeToUtc } from "@/lib/reservation-time-zone";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const offer = await findExternalReferralOffer(token);
  const backUrl = new URL(`/partner-reservation/${token}`, request.url);
  if (!offer || offer.group.targetMode !== "EXTERNAL" || offer.status !== "PENDING" || offer.group.status !== "OPEN") return NextResponse.redirect(backUrl, 303);
  const data = await request.formData();
  const timeZone = reservationTimeZone(offer.restaurant);
  const alternativeDate = zonedDateTimeToUtc(String(data.get("alternativeDate") || ""), timeZone);
  const minDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const maxDate = new Date(Date.now() + EXTERNAL_REFERRAL_MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000);
  if (!alternativeDate || alternativeDate <= minDate || alternativeDate > maxDate) {
    backUrl.searchParams.set("result", "invalid-alternative");
    return NextResponse.redirect(backUrl, 303);
  }
  if (isExternalReferralSimulation(offer)) {
    backUrl.searchParams.set("result", "simulated-alternative");
    return NextResponse.redirect(backUrl, 303);
  }
  await prisma.$transaction([
    prisma.referralOffer.update({ where: { id: offer.id }, data: { status: "ALTERNATIVE_PROPOSED", respondedAt: new Date() } }),
    prisma.referralGroup.update({ where: { id: offer.groupId }, data: { status: "ALTERNATIVE_PROPOSED", alternativeDate } }),
  ]);
  await notifyExternalReferralOutcome(offer.id, "ALTERNATIVE").catch((error) => console.error("External referral alternative notification failed", error));
  return NextResponse.redirect(backUrl, 303);
}
