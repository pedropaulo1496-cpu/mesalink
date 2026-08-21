import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { acceptPartnerRestaurantInvitation, findPartnerRestaurantInvitation } from "@/lib/partner-restaurant-invitations";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(`/restaurant-invite/${token}`)}`, request.url), 303);
  const invitation = await findPartnerRestaurantInvitation(token);
  if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date() || invitation.email !== session.user.email.trim().toLowerCase()) {
    return NextResponse.redirect(new URL(`/restaurant-invite/${token}`, request.url), 303);
  }
  const restaurant = await prisma.restaurant.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" }, select: { id: true } });
  if (!restaurant) return NextResponse.redirect(new URL(`/onboarding?partnerRestaurantInvite=${encodeURIComponent(token)}`, request.url), 303);
  try {
    await prisma.$transaction((tx) => acceptPartnerRestaurantInvitation(tx, { token, email: session.user.email!, restaurantId: restaurant.id }));
  } catch (error) {
    console.error("Accept partner restaurant invitation failed", error);
    return NextResponse.redirect(new URL(`/restaurant-invite/${token}`, request.url), 303);
  }
  return NextResponse.redirect(new URL(`/restaurants/${restaurant.id}/partner-network?invite=accepted`, request.url), 303);
}
