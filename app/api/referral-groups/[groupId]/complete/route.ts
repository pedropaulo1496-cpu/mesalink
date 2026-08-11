import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL("/login", request.url), 303);

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  const group = user
    ? await prisma.referralGroup.findFirst({
        where: { id: groupId, acceptedRestaurant: { userId: user.id } },
        include: { reservation: true },
      })
    : null;

  if (!group?.acceptedRestaurantId) return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 });
  const backUrl = new URL(`/restaurants/${group.acceptedRestaurantId}/partner-network`, request.url);

  if (group.desiredDate > new Date()) {
    backUrl.searchParams.set("result", "too-early");
    return NextResponse.redirect(backUrl, 303);
  }

  await prisma.$transaction([
    prisma.referralGroup.update({ where: { id: group.id }, data: { status: "COMPLETED" } }),
    ...(group.reservationId
      ? [prisma.reservation.update({ where: { id: group.reservationId }, data: { status: "FINISHED" } })]
      : []),
  ]);

  backUrl.searchParams.set("result", "completed");
  return NextResponse.redirect(backUrl, 303);
}
