import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const enabled = body?.enabled === true;
  const restaurant = await prisma.restaurant.findFirst({
    where: { id, user: { email: session.user.email } },
    include: { outboundReferralPartner: { select: { stripeAccountId: true, stripeOnboardingComplete: true, status: true } } },
  });
  if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });
  if (enabled && (!restaurant.outboundReferralPartner?.stripeAccountId || !restaurant.outboundReferralPartner.stripeOnboardingComplete || restaurant.outboundReferralPartner.status !== "ACTIVE")) {
    return NextResponse.json({ error: "Valida primeiro o IBAN para receber comissões." }, { status: 409 });
  }
  await prisma.restaurant.update({ where: { id }, data: { nearbyReferralEnabled: enabled } });
  return NextResponse.json({ success: true });
}
