import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!/^[a-f0-9]{48}$/.test(token)) {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  const action = await prisma.marketingAction.findUnique({
    where: { trackingToken: token },
    select: {
      id: true,
      clickedAt: true,
      restaurant: { select: { slug: true } },
    },
  });

  if (!action) {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.marketingAction.update({
      where: { id: action.id },
      data: {
        clickCount: { increment: 1 },
        clickedAt: action.clickedAt ?? now,
        lastClickedAt: now,
      },
    }),
    prisma.marketingAction.updateMany({
      where: { id: action.id, status: { in: ["QUEUED", "SENT", "OPENED"] } },
      data: { status: "CLICKED" },
    }),
  ]);

  const destination = new URL(`/reserve/${action.restaurant.slug}`, request.url);
  destination.searchParams.set("ml_action", token);
  return NextResponse.redirect(destination, 302);
}
