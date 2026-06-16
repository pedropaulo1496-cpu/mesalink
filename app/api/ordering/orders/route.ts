import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type OrderItemInput = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  vatRate: number;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const restaurantId = String(body.restaurantId || "");
    const tableNumber = Number(body.tableNumber);
    const items = body.items as OrderItemInput[];

    if (!restaurantId || !tableNumber || !items?.length) {
      return NextResponse.json(
        { error: "Dados do pedido inválidos." },
        { status: 400 }
      );
    }

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const vatTotal = items.reduce((sum, item) => {
      const lineTotal = item.price * item.quantity;
      const vatRate = item.vatRate || 0;
      return sum + lineTotal - lineTotal / (1 + vatRate / 100);
    }, 0);

    const total = subtotal;

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

    const order = await prisma.orderingOrder.create({
      data: {
        restaurantId,
        sessionId: session.id,
        tableNumber,
        status: "PENDING",
        subtotal,
        vatTotal,
        total,
        items: {
          create: items.map((item) => {
            const lineTotal = item.price * item.quantity;
            const lineVat =
              lineTotal - lineTotal / (1 + (item.vatRate || 0) / 100);

            return {
              productId: item.productId,
              productName: item.name,
              quantity: item.quantity,
              unitPrice: item.price,
              vatRate: item.vatRate || 0,
              lineSubtotal: lineTotal - lineVat,
              lineVat,
              lineTotal,
            };
          }),
        },
      },
    });

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error("QR Ordering order error:", error);

    return NextResponse.json(
      { error: "Erro ao criar pedido." },
      { status: 500 }
    );
  }
}