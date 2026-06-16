import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const restaurantId = String(body.restaurantId || "");
    const tableNumber = Number(body.tableNumber);

    if (!restaurantId || Number.isNaN(tableNumber)) {
      return NextResponse.json(
        { error: "restaurantId ou tableNumber inválido", body },
        { status: 400 }
      );
    }

    let session = await prisma.orderingTableSession.findFirst({
      where: {
        restaurantId,
        tableNumber,
        status: "OPEN",
      },
    });

    if (!session) {
      session = await prisma.orderingTableSession.create({
        data: {
          restaurantId,
          tableNumber,
          status: "OPEN",
        },
      });
    }

    const updatedSession = await prisma.orderingTableSession.update({
      where: { id: session.id },
      data: {
        requestedWaiterAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: updatedSession.id,
    });
  } catch (error) {
    console.error("REQUEST_WAITER_ERROR", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}