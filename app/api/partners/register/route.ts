import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";
import { isCommissionType } from "@/lib/referrals";

const partnerTypes = new Set(["HOTEL", "CONCIERGE", "GUIDE", "AGENCY", "COMPANY"]);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const businessName = typeof body?.businessName === "string" ? body.businessName.trim().slice(0, 120) : "";
    const contactName = typeof body?.contactName === "string" ? body.contactName.trim().slice(0, 100) : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const partnerType = partnerTypes.has(body?.partnerType) ? body.partnerType : "HOTEL";
    const commissionType = isCommissionType(body?.commissionType) ? body.commissionType : "PER_PERSON";
    const commissionAmount = Number(body?.commissionAmount);
    const acceptedTerms = body?.acceptedTerms === "on" || body?.acceptedTerms === true;
    const acceptedPrivacy = body?.acceptedPrivacy === "on" || body?.acceptedPrivacy === true;

    if (!businessName || !contactName || !isValidEmail(email) || password.length < 8 || !acceptedTerms || !acceptedPrivacy) {
      return NextResponse.json(
        { error: "Preenche os dados e usa uma password com pelo menos 8 caracteres." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(commissionAmount) || commissionAmount <= 0 || commissionAmount > 1000) {
      return NextResponse.json({ error: "A comissão indicada não é válida." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.$transaction(async (tx) => {
      const existingPartner = await tx.referralPartner.findUnique({ where: { email } });
      if (existingPartner) throw new Error("PARTNER_EXISTS");

      let user = await tx.user.findUnique({ where: { email } });
      if (!user) {
        user = await tx.user.create({ data: { name: contactName, email } });
      } else if (!user.name) {
        user = await tx.user.update({ where: { id: user.id }, data: { name: contactName } });
      }

      await tx.referralPartner.create({
        data: {
          userId: user.id,
          businessName,
          contactName,
          email,
          passwordHash,
          partnerType,
          status: "PENDING",
          defaultCommissionType: commissionType,
          defaultCommissionAmount: commissionAmount,
          termsAcceptedAt: new Date(),
          privacyAcceptedAt: new Date(),
          termsVersion: "partners-v1-2026-08-11",
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "PARTNER_EXISTS") {
      return NextResponse.json({ error: "Já existe uma conta MesaLink Partners com este email." }, { status: 409 });
    }
    console.error("Partner registration error:", error);
    return NextResponse.json({ error: "Não foi possível criar a conta." }, { status: 500 });
  }
}
