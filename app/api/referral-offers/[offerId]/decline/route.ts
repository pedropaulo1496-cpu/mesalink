import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL("/login", request.url), 303);

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  const offer = user
    ? await prisma.referralOffer.findFirst({ where: { id: offerId, restaurant: { userId: user.id } }, select: { id: true, restaurantId: true } })
    : null;

  if (!offer) return NextResponse.json({ error: "Oferta não encontrada." }, { status: 404 });

  await prisma.referralOffer.updateMany({
    where: { id: offer.id, status: "PENDING" },
    data: { status: "DECLINED", respondedAt: new Date() },
  });

  return NextResponse.redirect(new URL(`/restaurants/${offer.restaurantId}/partner-network?result=declined`, request.url), 303);
}
