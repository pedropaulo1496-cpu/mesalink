import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      orderId: string;
    }>;
  },
) {
  try {
    const { orderId } = await params;

    const orderingOrder = await prisma.orderingOrder.findFirst({
      where: {
        id: orderId,
        status: "PENDING",
      },
      include: {
        items: true,
      },
    });

    if (!orderingOrder) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 },
      );
    }

    const restaurantId = orderingOrder.restaurantId;

    const table =
      orderingOrder.tableId
        ? await prisma.table.findFirst({
            where: {
              id: orderingOrder.tableId,
              restaurantId,
            },
          })
        : await prisma.table.findFirst({
            where: {
              restaurantId,
              number: orderingOrder.tableNumber,
            },
          });

    if (!table) {
      return NextResponse.json(
        { error: "Mesa não encontrada." },
        { status: 404 },
      );
    }

    const total = Number(orderingOrder.total ?? 0);

    const result = await prisma.$transaction(async (tx) => {
      let tableSession = await tx.pOSTableSession.findFirst({
        where: {
          restaurantId,
          tableId: table.id,
          status: "OPEN",
        },
      });

      if (!tableSession) {
        tableSession = await tx.pOSTableSession.create({
          data: {
            restaurantId,
            tableId: table.id,
            status: "OPEN",
            guestCount: 1,
            totalAmount: 0,
            subtotalAmount: 0,
            remainingAmount: 0,
          },
        });
      }

      const posOrder = await tx.pOSOrder.create({
        data: {
          restaurantId,
          tableSessionId: tableSession.id,
          source: "QR",
          status: "OPEN",
          subtotal: total,
          customerNotes: orderingOrder.notes,

          items: {
            create: orderingOrder.items.map((item) => ({
              productId: item.productId || null,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.lineTotal,
            })),
          },
        },
      });

      await tx.pOSTableSession.update({
        where: {
          id: tableSession.id,
        },
        data: {
          totalAmount: {
            increment: total,
          },
          subtotalAmount: {
            increment: total,
          },
          remainingAmount: {
            increment: total,
          },
        },
      });

      await tx.orderingOrder.update({
        where: {
          id: orderingOrder.id,
        },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
          posOrderId: posOrder.id,
        },
      });

      return posOrder;
    });

    return NextResponse.json({
      success: true,
      posOrderId: result.id,
    });
  } catch (error: any) {
    console.error("QR ACCEPT ERROR:", error);

    return NextResponse.json(
      {
        error: error?.message ?? "Erro interno.",
      },
      { status: 500 },
    );
  }
}