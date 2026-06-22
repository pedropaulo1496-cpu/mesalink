import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function amountFromDiscount(base: number, type: string, value: number) {
  if (type === "PERCENTAGE") {
    return Math.min(base, (base * value) / 100);
  }

  return Math.min(base, value);
}

async function recalculateSession(sessionId: string) {
  const session = await prisma.pOSTableSession.findUnique({
    where: { id: sessionId },
    include: {
      discounts: true,
      orders: {
        include: {
          items: true,
        },
      },
    },
  });

  if (!session) return;

  let itemsNetTotal = 0;
  let itemDiscountTotal = 0;

  for (const order of session.orders) {
    const subtotal = order.items.reduce((sum, item) => {
      const gross = Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0);
      const discount = Math.min(gross, Number(item.discountAmount ?? 0));

      return sum + Math.max(0, gross - discount);
    }, 0);

    const orderDiscount = order.items.reduce((sum, item) => {
      const gross = Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0);
      return sum + Math.min(gross, Number(item.discountAmount ?? 0));
    }, 0);

    itemsNetTotal += subtotal;
    itemDiscountTotal += orderDiscount;

    await prisma.pOSOrder.update({
      where: { id: order.id },
      data: {
        subtotal,
        discountAmount: orderDiscount,
      },
    });
  }

  const globalDiscounts = session.discounts.filter(
    (discount) => !discount.orderItemId,
  );

  let globalDiscountTotal = 0;

  for (const discount of globalDiscounts) {
    const nextAmount = amountFromDiscount(
      itemsNetTotal,
      String(discount.type),
      Number(discount.value ?? 0),
    );

    globalDiscountTotal += nextAmount;

    await prisma.pOSDiscount.update({
      where: { id: discount.id },
      data: {
        amount: nextAmount,
      },
    });
  }

  const totalDiscount = itemDiscountTotal + globalDiscountTotal;
  const finalTotal = Math.max(0, itemsNetTotal - globalDiscountTotal);
  const paidAmount = Number(session.paidAmount ?? 0);

  await prisma.pOSTableSession.update({
    where: { id: sessionId },
    data: {
      subtotalAmount: itemsNetTotal + itemDiscountTotal,
      totalAmount: finalTotal,
      remainingAmount: Math.max(0, finalTotal - paidAmount),
      discountAmount: totalDiscount,
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;
    const { tableId, items, source = "POS" } = await request.json();

    if (!tableId || !items?.length) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const grossTotal = items.reduce(
      (sum: number, item: any) =>
        sum + Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0),
      0,
    );

    let session = await prisma.pOSTableSession.findFirst({
      where: {
        restaurantId,
        tableId,
        status: "OPEN",
      },
    });

    if (!session) {
      session = await prisma.pOSTableSession.create({
        data: {
          restaurantId,
          tableId,
          status: "OPEN",
          totalAmount: grossTotal,
          subtotalAmount: grossTotal,
          remainingAmount: grossTotal,
        },
      });
    }

    const order = await prisma.pOSOrder.create({
      data: {
        restaurantId,
        tableSessionId: session.id,
        source,
        status: "OPEN",
        subtotal: grossTotal,
        items: {
          create: items.map((item: any) => {
            const quantity = Math.max(1, Number(item.quantity ?? 1));
            const unitPrice = Math.max(0, Number(item.unitPrice ?? 0));
            const gross = quantity * unitPrice;
            const percentage = Math.max(0, Number(item.discountPercentage ?? 0));
            const fixed = Math.max(0, Number(item.discountAmount ?? 0));
            const percentageDiscount =
              percentage > 0 ? (gross * percentage) / 100 : 0;
            const finalDiscount = Math.min(gross, percentageDiscount + fixed);

            return {
              productId: item.productId,
              productName: item.name,
              quantity,
              unitPrice,
              totalPrice: gross,
              discountType:
                percentage > 0 ? "PERCENTAGE" : fixed > 0 ? "AMOUNT" : null,
              discountValue:
                percentage > 0 ? percentage : fixed > 0 ? fixed : null,
              discountAmount: finalDiscount,
              notes: item.notes || null,
            };
          }),
        },
      },
    });

    const createdOrder = await prisma.pOSOrder.findUnique({
  where: { id: order.id },
  include: {
    items: {
      include: {
        product: {
          include: {
            productionCenter: true,
          },
        },
      },
    },
  },
});

if (createdOrder) {
  const groups = new Map<string, any[]>();

  for (const item of createdOrder.items) {
    const centerId = item.product?.productionCenterId || "NO_PRODUCTION";

    if (!groups.has(centerId)) {
      groups.set(centerId, []);
    }

    groups.get(centerId)?.push(item);
  }

  for (const [centerId, groupItems] of groups.entries()) {
    const firstItem = groupItems[0];
    const center = firstItem.product?.productionCenter;

    await prisma.printJob.create({
      data: {
        restaurantId,
        posOrderId: createdOrder.id,
        productionCenterId: centerId === "NO_PRODUCTION" ? null : centerId,
        status: "PENDING",
        type: "PRODUCTION",
        title: center?.name
          ? `Pedido para ${center.name}`
          : "Pedido sem produção",
        payload: {
          orderId: createdOrder.id,
          tableId,
          source: createdOrder.source,
          productionCenter: center
            ? {
                id: center.id,
                name: center.name,
                printerName: center.printerName,
              }
            : null,
          items: groupItems.map((item) => ({
            id: item.id,
            productId: item.productId,
            name: item.productName,
            quantity: item.quantity,
            notes: item.notes,
          })),
          createdAt: createdOrder.createdAt,
        },
      },
    });
  }
}

    await recalculateSession(session.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POS ORDER CREATE ERROR:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;
    const { sessionId, itemId, action, quantity } = await request.json();

    if (!sessionId || !itemId || !action) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const item = await prisma.pOSOrderItem.findFirst({
      where: {
        id: itemId,
        order: {
          restaurantId,
          tableSessionId: sessionId,
          tableSession: {
            status: "OPEN",
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 },
      );
    }

    const currentQuantity = Number(item.quantity ?? 0);
    const unitPrice = Number(item.unitPrice ?? 0);
    const discountAmount = Number(item.discountAmount ?? 0);

    if (action === "setQuantity") {
      const nextQuantity = Math.max(0, Number(quantity ?? currentQuantity));

      if (nextQuantity <= 0) {
        await prisma.pOSOrderItem.delete({
          where: { id: item.id },
        });
      } else {
        await prisma.pOSOrderItem.update({
          where: { id: item.id },
          data: {
            quantity: nextQuantity,
            totalPrice: nextQuantity * unitPrice,
            discountAmount:
              currentQuantity > 0
                ? Math.min(
                    nextQuantity * unitPrice,
                    (discountAmount / currentQuantity) * nextQuantity,
                  )
                : 0,
          },
        });
      }
    }

    if (action === "increase") {
      const nextQuantity = currentQuantity + 1;

      await prisma.pOSOrderItem.update({
        where: { id: item.id },
        data: {
          quantity: nextQuantity,
          totalPrice: nextQuantity * unitPrice,
          discountAmount:
            currentQuantity > 0
              ? (discountAmount / currentQuantity) * nextQuantity
              : discountAmount,
        },
      });
    }

    if (action === "decrease") {
      const nextQuantity = currentQuantity - 1;

      if (nextQuantity <= 0) {
        await prisma.pOSOrderItem.delete({
          where: { id: item.id },
        });
      } else {
        await prisma.pOSOrderItem.update({
          where: { id: item.id },
          data: {
            quantity: nextQuantity,
            totalPrice: nextQuantity * unitPrice,
            discountAmount:
              currentQuantity > 0
                ? (discountAmount / currentQuantity) * nextQuantity
                : 0,
          },
        });
      }
    }

    if (action === "remove") {
      await prisma.pOSOrderItem.delete({
        where: { id: item.id },
      });
    }

    await recalculateSession(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POS ORDER PATCH ERROR:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
