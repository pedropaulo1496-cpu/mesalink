import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { syncGoogleBusinessProfile } from "@/lib/google-business";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL("/login", request.url), 303);
  const owned = await prisma.restaurant.findFirst({ where: { id, user: { email: session.user.email } }, select: { id: true } });
  if (!owned) return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  try {
    await syncGoogleBusinessProfile(id);
    return NextResponse.redirect(new URL(`/restaurants/${id}/partner-network?google=synced`, request.url), 303);
  } catch (error) {
    console.error("Google Business sync failed", error);
    return NextResponse.redirect(new URL(`/restaurants/${id}/partner-network?google=error`, request.url), 303);
  }
}
