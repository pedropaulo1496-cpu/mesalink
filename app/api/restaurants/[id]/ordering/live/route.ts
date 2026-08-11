import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isRestaurantOwner } from "@/lib/restaurant-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!(await isRestaurantOwner(id))) return NextResponse.json({ error: "Sem acesso a este restaurante." }, { status: 403 });

  const sessions = await prisma.orderingTableSession.findMany({
    where: {
      restaurantId: id,
      status: "OPEN",
    },
    orderBy: {
      openedAt: "desc",
    },
    include: {
      orders: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          items: true,
        },
      },
    },
  });

  return NextResponse.json({ sessions });
}
