import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const pendingOrders = await prisma.orderingOrder.count({
    where: {
      restaurantId: id,
      status: "PENDING",
    },
  });

  const qrAlerts = await prisma.orderingTableSession.count({
    where: {
      restaurantId: id,
      status: "OPEN",
      OR: [
        { requestedWaiterAt: { not: null } },
        { requestedBillAt: { not: null } },
      ],
    },
  });

  return NextResponse.json({
    count: pendingOrders + qrAlerts,
  });
}