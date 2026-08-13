import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await prisma.salesClientInvitation.findUnique({
    where: { token },
    include: { salesRepresentative: { select: { id: true, name: true, active: true } } },
  });
  const base = new URL(request.url);
  if (!invitation || !invitation.salesRepresentative.active || invitation.expiresAt <= new Date()) {
    return NextResponse.redirect(new URL("/login?invite=expired", base));
  }

  const session = await getServerSession(authOptions);
  const normalizedSessionEmail = String(session?.user?.email || "").trim().toLowerCase();
  if (session?.user?.accountType === "RESTAURANT" && normalizedSessionEmail === invitation.email) {
    const currentAccount = await prisma.user.findUnique({ where: { id: session.user.id }, select: { salesRepresentativeId: true } });
    if (currentAccount?.salesRepresentativeId && currentAccount.salesRepresentativeId !== invitation.salesRepresentativeId) {
      return NextResponse.redirect(new URL("/dashboard?commercial=already-linked", base));
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: session.user.id }, data: { salesRepresentativeId: invitation.salesRepresentativeId } }),
      prisma.salesClientInvitation.update({ where: { id: invitation.id }, data: { acceptedAt: invitation.acceptedAt || new Date() } }),
    ]);
    return NextResponse.redirect(new URL("/dashboard?commercial=linked", base));
  }

  const existing = await prisma.user.findUnique({
    where: { email: invitation.email },
    select: { passwordHash: true, subscription: { select: { id: true } }, restaurants: { select: { id: true }, take: 1 } },
  });
  const callbackUrl = `/api/commercial-invitations/${encodeURIComponent(token)}/accept`;
  if (existing?.passwordHash && (existing.subscription || existing.restaurants.length)) {
    const login = new URL("/login", base);
    login.searchParams.set("callbackUrl", callbackUrl);
    login.searchParams.set("email", invitation.email);
    if (session) login.searchParams.set("invite", "switch-account");
    return NextResponse.redirect(login);
  }

  const register = new URL("/register", base);
  register.searchParams.set("commercialInvite", token);
  register.searchParams.set("email", invitation.email);
  return NextResponse.redirect(register);
}
