import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isRestaurantOwner } from "@/lib/restaurant-auth";

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      orderId: string;
    }>;
  }
) {
  const { id, orderId } = await params;
  if (!(await isRestaurantOwner(id))) return NextResponse.json({ error: "Sem acesso a este restaurante." }, { status: 403 });
  const body = await request.json().catch(() => ({}));

  const status = String(body.status || "");

  if (!["PENDING", "PREPARING", "READY", "DELIVERED", "CANCELLED"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  await prisma.orderingOrder.update({
    where: { id: orderId },
    data: { status },
  });

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
