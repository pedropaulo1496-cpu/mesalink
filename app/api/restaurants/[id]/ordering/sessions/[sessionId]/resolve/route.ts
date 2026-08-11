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
      sessionId: string;
    }>;
  }
) {
  const { id, sessionId } = await params;
  if (!(await isRestaurantOwner(id))) return NextResponse.json({ error: "Sem acesso a este restaurante." }, { status: 403 });
  const body = await request.json().catch(() => ({}));

  const type = String(body.type || "");

  if (!["waiter", "bill"].includes(type)) {
    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  }

  await prisma.orderingTableSession.update({
    where: { id: sessionId },
    data:
      type === "waiter"
        ? { requestedWaiterAt: null }
        : { requestedBillAt: null },
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
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
    },
  });

  return NextResponse.json({ sessions });
}
