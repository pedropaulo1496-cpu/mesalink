import { NextResponse } from "next/server";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { issueExternalReferralAccess } from "@/lib/external-referral-requests";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const { groupId } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action === "ACCEPT" ? "ACCEPT" : body?.action === "REJECT" ? "REJECT" : null;
  if (!action) return NextResponse.json({ error: "Resposta inválida." }, { status: 400 });

  const group = await prisma.referralGroup.findFirst({
    where: { id: groupId, partnerId: partner.id, targetMode: "EXTERNAL", status: "ALTERNATIVE_PROPOSED" },
    include: { offers: { where: { status: "ALTERNATIVE_PROPOSED" }, take: 1 } },
  });
  const offer = group?.offers[0];
  if (!group || !offer || !group.alternativeDate || group.alternativeDate <= new Date(Date.now() + 2 * 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Esta proposta já não está disponível." }, { status: 409 });
  }

  if (action === "REJECT") {
    await prisma.$transaction([
      prisma.referralGroup.update({ where: { id: group.id }, data: { status: "CANCELLED" } }),
      prisma.referralOffer.update({ where: { id: offer.id }, data: { status: "DECLINED", respondedAt: new Date() } }),
    ]);
    return NextResponse.json({ success: true, status: "CANCELLED" });
  }

  await prisma.$transaction([
    prisma.referralGroup.update({ where: { id: group.id }, data: { desiredDate: group.alternativeDate, alternativeDate: null, status: "OPEN", expiresAt: group.alternativeDate } }),
    prisma.referralOffer.update({ where: { id: offer.id }, data: { status: "PENDING", respondedAt: null } }),
  ]);
  try {
    await issueExternalReferralAccess(offer.id, request.url);
  } catch (error) {
    console.error("Resend accepted alternative to restaurant failed", error);
    await prisma.$transaction([
      prisma.referralGroup.update({ where: { id: group.id }, data: { desiredDate: group.desiredDate, alternativeDate: group.alternativeDate, status: "ALTERNATIVE_PROPOSED", expiresAt: group.desiredDate } }),
      prisma.referralOffer.update({ where: { id: offer.id }, data: { status: "ALTERNATIVE_PROPOSED", respondedAt: offer.respondedAt } }),
    ]);
    return NextResponse.json({ error: "Não conseguimos avisar o restaurante. A proposta continua disponível para tentares novamente dentro de alguns minutos." }, { status: 502 });
  }
  return NextResponse.json({ success: true, status: "OPEN" });
}
