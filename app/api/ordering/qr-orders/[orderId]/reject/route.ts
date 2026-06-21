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

    const order = await prisma.orderingOrder.findFirst({
      where: {
        id: orderId,
        status: "PENDING",
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 },
      );
    }

    await prisma.orderingOrder.update({
      where: {
        id: order.id,
      },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("QR REJECT ERROR:", error);

    return NextResponse.json(
      { error: error?.message ?? "Erro interno." },
      { status: 500 },
    );
  }
}