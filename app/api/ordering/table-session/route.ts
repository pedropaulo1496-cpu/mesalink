import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const restaurantId = searchParams.get("restaurantId");
  const tableNumber = Number(searchParams.get("tableNumber"));

  if (!restaurantId || !tableNumber) {
    return NextResponse.json([]);
  }

  const session = await prisma.orderingTableSession.findFirst({
    where: {
      restaurantId,
      tableNumber,
      status: "OPEN",
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

  return NextResponse.json(session);
}