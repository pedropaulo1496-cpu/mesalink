import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCommissionType } from "@/lib/referrals";

const partnerTypes = new Set(["HOTEL", "CONCIERGE", "GUIDE", "AGENCY", "COMPANY"]);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const businessName = typeof body?.businessName === "string" ? body.businessName.trim().slice(0, 120) : "";
  const partnerType = partnerTypes.has(body?.partnerType) ? body.partnerType : "HOTEL";
  const commissionType = isCommissionType(body?.commissionType) ? body.commissionType : "PER_PERSON";
  const commissionAmount = Number(body?.commissionAmount);
  const acceptedTerms = body?.acceptedTerms === "on" || body?.acceptedTerms === true;
  const acceptedPrivacy = body?.acceptedPrivacy === "on" || body?.acceptedPrivacy === true;

  if (!businessName || !acceptedTerms || !acceptedPrivacy || !Number.isFinite(commissionAmount) || commissionAmount <= 0 || commissionAmount > 1000) {
    return NextResponse.json({ error: "Dados de parceiro inválidos." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });

  const partner = await prisma.referralPartner.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      businessName,
      contactName: user.name,
      email: user.email,
      partnerType,
      status: "PENDING",
      defaultCommissionType: commissionType,
      defaultCommissionAmount: commissionAmount,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
      termsVersion: "partners-v1-2026-08-11",
    },
  });

  return NextResponse.json({ success: true, partnerId: partner.id });
}
