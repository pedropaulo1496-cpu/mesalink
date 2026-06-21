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

    const discountAmount = order.items.reduce((sum, item) => {
      const gross = Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0);
      return sum + Math.min(gross, Number(item.discountAmount ?? 0));
    }, 0);

    itemsNetTotal += subtotal;
    itemDiscountTotal += discountAmount;

    await prisma.pOSOrder.update({
      where: { id: order.id },
      data: {
        subtotal,
        discountAmount,
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
      data: { amount: nextAmount },
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

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      itemId: string;
    }>;
  },
) {
  try {
    const { id: restaurantId, itemId } = await params;

    const {
      quantity,
      unitPrice,
      discountPercentage,
      discountAmount,
      notes,
    } = await request.json();

    const item = await prisma.pOSOrderItem.findFirst({
      where: {
        id: itemId,
        order: {
          restaurantId,
          tableSession: {
            status: "OPEN",
          },
        },
      },
      include: {
        order: {
          include: {
            tableSession: true,
          },
        },
      },
    });

    if (!item || !item.order.tableSession) {
      return NextResponse.json(
        { error: "Item não encontrado." },
        { status: 404 },
      );
    }

    const session = item.order.tableSession;

    const safeQuantity = Math.max(0, Number(quantity ?? item.quantity));
    const safeUnitPrice = Math.max(0, Number(unitPrice ?? item.unitPrice));

    if (safeQuantity <= 0) {
      await prisma.pOSDiscount.deleteMany({
        where: {
          orderItemId: item.id,
          pOSTableSessionId: session.id,
        },
      });

      await prisma.pOSOrderItem.delete({
        where: { id: item.id },
      });

      await recalculateSession(session.id);

      return NextResponse.json({ success: true });
    }

    const grossTotal = safeQuantity * safeUnitPrice;

    const percentage = Math.max(0, Number(discountPercentage ?? 0));
    const fixedDiscount = Math.max(0, Number(discountAmount ?? 0));

    const percentageDiscount =
      percentage > 0 ? (grossTotal * percentage) / 100 : 0;

    const finalDiscount = Math.min(
      grossTotal,
      percentageDiscount + fixedDiscount,
    );

    await prisma.pOSDiscount.deleteMany({
      where: {
        orderItemId: item.id,
        pOSTableSessionId: session.id,
      },
    });

    await prisma.pOSOrderItem.update({
      where: { id: item.id },
      data: {
        quantity: safeQuantity,
        unitPrice: safeUnitPrice,
        totalPrice: grossTotal,
        discountType:
          percentage > 0 ? "PERCENTAGE" : fixedDiscount > 0 ? "AMOUNT" : null,
        discountValue:
          percentage > 0 ? percentage : fixedDiscount > 0 ? fixedDiscount : null,
        discountAmount: finalDiscount,
        notes: notes || null,
      },
    });

    if (finalDiscount > 0) {
      await prisma.pOSDiscount.create({
        data: {
          restaurantId,
          tableSessionId: session.id,
          pOSTableSessionId: session.id,
          orderItemId: item.id,
          type: percentage > 0 ? "PERCENTAGE" : "AMOUNT",
          value: percentage > 0 ? percentage : fixedDiscount,
          amount: finalDiscount,
          reason: notes || null,
        },
      });
    }

    await recalculateSession(session.id);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("POS ORDER ITEM UPDATE ERROR:", error);

    return NextResponse.json(
      { error: error?.message ?? "Erro interno." },
      { status: 500 },
    );
  }
}
