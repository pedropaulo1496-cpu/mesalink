import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { googleBusinessAuthorizationUrl } from "@/lib/google-business";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL("/login", request.url), 303);
  const restaurant = await prisma.restaurant.findFirst({ where: { id, user: { email: session.user.email } }, select: { userId: true } });
  if (!restaurant?.userId) return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  const authorizationUrl = googleBusinessAuthorizationUrl(id, restaurant.userId);
  if (!authorizationUrl) return NextResponse.redirect(new URL(`/restaurants/${id}/partner-network?google=not-configured`, request.url), 303);
  return NextResponse.redirect(authorizationUrl, 303);
}
