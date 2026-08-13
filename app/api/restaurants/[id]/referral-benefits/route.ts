import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasAppAccess } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";
import { MARKETING_CARD_THEMES } from "@/lib/marketing-card-themes";

const benefitTypes = new Set(["PERCENT", "FIXED", "PERK"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 80) : "";
  const description = cleanOptional(body?.description, 240);
  const terms = cleanOptional(body?.terms, 400);
  const benefitType = benefitTypes.has(body?.benefitType) ? body.benefitType : null;
  const benefitLabel = cleanOptional(body?.benefitLabel, 40);
  const value = body?.value === "" || body?.value == null ? null : Number(body.value);
  const minSpend = body?.minSpend === "" || body?.minSpend == null ? null : Number(body.minSpend);
  const maxRedemptions = body?.maxRedemptions === "" || body?.maxRedemptions == null ? null : Number(body.maxRedemptions);
  const template = typeof body?.template === "string" && body.template in MARKETING_CARD_THEMES ? body.template : "GOLD";
  const validFrom = parseDate(body?.validFrom) || new Date();
  const validUntil = parseDate(body?.validUntil);

  const invalidValue = benefitType === "PERCENT"
    ? value == null || value <= 0 || value > 100
    : benefitType === "FIXED"
      ? value == null || value <= 0 || value > 10000
      : value != null && (value < 0 || value > 10000);

  if (
    title.length < 3 ||
    !benefitType ||
    (benefitType === "PERK" && (!benefitLabel || benefitLabel.length < 2)) ||
    invalidValue ||
    (minSpend != null && (!Number.isFinite(minSpend) || minSpend < 0 || minSpend > 100000)) ||
    (maxRedemptions != null && (!Number.isInteger(maxRedemptions) || maxRedemptions < 1 || maxRedemptions > 100000)) ||
    (validUntil && validUntil <= validFrom)
  ) {
    return NextResponse.json({ error: "Revê o benefício, o valor, a validade e os limites." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!hasAppAccess(user.subscription)) return NextResponse.json({ error: "É necessário um plano MesaLink ativo." }, { status: 403 });

  const restaurant = await prisma.restaurant.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });

  const benefit = await prisma.referralBenefit.create({
    data: {
      restaurantId: id,
      title,
      description,
      terms,
      benefitType,
      benefitLabel: benefitType === "PERK" ? benefitLabel : null,
      value,
      minSpend,
      maxRedemptions,
      template,
      validFrom,
      validUntil,
    },
  });

  return NextResponse.json({ success: true, benefitId: benefit.id });
}

function cleanOptional(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const clean = value.replace(/\s+/g, " ").trim().slice(0, max);
  return clean || null;
}

function parseDate(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
