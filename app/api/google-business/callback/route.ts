import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectGoogleBusiness, verifyGoogleBusinessState } from "@/lib/google-business";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = verifyGoogleBusinessState(url.searchParams.get("state") || "");
  const code = url.searchParams.get("code");
  const session = await getServerSession(authOptions);
  if (!state || !code || !session?.user?.email) return NextResponse.redirect(new URL("/login", request.url), 303);
  const owned = await prisma.restaurant.findFirst({ where: { id: state.restaurantId, userId: state.userId, user: { email: session.user.email } }, select: { id: true } });
  if (!owned) return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  try {
    await connectGoogleBusiness({ restaurantId: state.restaurantId, code });
    return NextResponse.redirect(new URL(`/restaurants/${state.restaurantId}/partner-network?google=connected`, request.url), 303);
  } catch (error) {
    console.error("Google Business connection failed", error);
    return NextResponse.redirect(new URL(`/restaurants/${state.restaurantId}/partner-network?google=error`, request.url), 303);
  }
}
