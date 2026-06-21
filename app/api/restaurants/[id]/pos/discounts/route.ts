import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type DiscountType = "AMOUNT" | "PERCENTAGE";
type DiscountScope = "SESSION" | "ITEM";
type DiscountMode = "SET" | "REMOVE";

function amountFromDiscount(
  base: number,
  discountType: DiscountType,
  discountValue: number,
) {
  if (discountType === "PERCENTAGE") {
    return Math.min(base, (base * discountValue) / 100);
  }

  return Math.min(base, discountValue);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;

    const {
      sessionId,
      scope,
      type,
      value,
      reason,
      item,
      mode = "SET",
    }: {
      sessionId?: string;
      scope?: DiscountScope;
      type?: DiscountType;
      value?: number | string;
      reason?: string;
      item?: {
        itemIds?: string[];
        productName?: string;
        unitPrice?: number | string;
        quantity?: number | string;
      };
      mode?: DiscountMode;
    } = await request.json();

    if (!sessionId || !scope) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const discountValue = Number(value ?? 0);
    const shouldRemove = mode === "REMOVE" || discountValue <= 0;

    if (!shouldRemove) {
      if (!type || !["AMOUNT", "PERCENTAGE"].includes(type)) {
        return NextResponse.json(
          { error: "Tipo de desconto inválido." },
          { status: 400 },
        );
      }
    }

    const session = await prisma.pOSTableSession.findFirst({
      where: {
        id: sessionId,
        restaurantId,
        status: "OPEN",
      },
      include: {
        discounts: true,
        orders: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Sessão não encontrada." },
        { status: 404 },
      );
    }

    const paidAmount = Number(session.paidAmount ?? 0);
    const currentTotal = Number(session.totalAmount ?? 0);
    const currentDiscountAmount = Number(session.discountAmount ?? 0);
    const allItems = session.orders.flatMap((order) => order.items);

    if (scope === "SESSION") {
      const previousGlobalDiscounts = session.discounts.filter(
        (discount) => !discount.orderItemId,
      );

      const previousGlobalAmount = previousGlobalDiscounts.reduce(
        (sum, discount) => sum + Number(discount.amount ?? 0),
        0,
      );

      await prisma.pOSDiscount.deleteMany({
        where: {
          restaurantId,
          pOSTableSessionId: session.id,
          orderItemId: null,
        },
      });

      let newGlobalAmount = 0;

      if (!shouldRemove && type) {
        const base = allItems.reduce((sum, orderItem) => {
  const gross =
    Number(orderItem.quantity ?? 0) * Number(orderItem.unitPrice ?? 0);

  const itemDiscount = Math.min(
    gross,
    Number(orderItem.discountAmount ?? 0),
  );

  return sum + Math.max(0, gross - itemDiscount);
}, 0);

        newGlobalAmount = amountFromDiscount(base, type, discountValue);

        if (newGlobalAmount > 0) {
          await prisma.pOSDiscount.create({
            data: {
              restaurantId,
              tableSessionId: session.id,
              pOSTableSessionId: session.id,
              type,
              value: discountValue,
              amount: newGlobalAmount,
              reason: reason || null,
            },
          });
        }
      }

      const delta = newGlobalAmount - previousGlobalAmount;
      const nextDiscountAmount = Math.max(0, currentDiscountAmount + delta);
      const nextTotalAmount = Math.max(0, currentTotal - delta);
      const nextRemainingAmount = Math.max(0, nextTotalAmount - paidAmount);

      await prisma.pOSTableSession.update({
        where: { id: session.id },
        data: {
          discountAmount: nextDiscountAmount,
          totalAmount: nextTotalAmount,
          remainingAmount: nextRemainingAmount,
        },
      });

      return NextResponse.json({
        success: true,
        discountAmount: newGlobalAmount,
        discountDelta: delta,
      });
    }

    if (!item?.productName || item?.unitPrice === undefined) {
      return NextResponse.json({ error: "Item inválido." }, { status: 400 });
    }

    const itemIds = Array.isArray(item.itemIds) ? item.itemIds : [];
    const targetQuantity = Math.max(1, Number(item.quantity ?? 1));

    let targetItems =
      itemIds.length > 0
        ? allItems.filter((orderItem) => itemIds.includes(orderItem.id))
        : allItems.filter(
            (orderItem) =>
              orderItem.productName === item.productName &&
              Number(orderItem.unitPrice) === Number(item.unitPrice),
          );

    if (targetItems.length === 0) {
      return NextResponse.json(
        { error: "Item não encontrado." },
        { status: 404 },
      );
    }

    const firstTarget = targetItems[0];

    const openQuantity =
      Number(firstTarget.quantity ?? 0) -
      Number(firstTarget.paidQuantity ?? 0) -
      Number(firstTarget.voidedQuantity ?? 0);

    if (openQuantity <= 0) {
      return NextResponse.json(
        { error: "Item já não tem quantidade disponível." },
        { status: 400 },
      );
    }

    const quantityToDiscount = Math.min(targetQuantity, openQuantity);
    const remainingQuantity = openQuantity - quantityToDiscount;

    if (remainingQuantity > 0 && itemIds.length === 1) {
      await prisma.pOSOrderItem.update({
        where: { id: firstTarget.id },
        data: {
          quantity: quantityToDiscount,
          totalPrice: quantityToDiscount * Number(firstTarget.unitPrice),
        },
      });

      const newLine = await prisma.pOSOrderItem.create({
        data: {
          orderId: firstTarget.orderId,
          productId: firstTarget.productId,
          productName: firstTarget.productName,
          quantity: remainingQuantity,
          unitPrice: firstTarget.unitPrice,
          totalPrice: remainingQuantity * Number(firstTarget.unitPrice),
          notes: firstTarget.notes,
          kitchenNotes: firstTarget.kitchenNotes,
        },
      });

      targetItems = [
        {
          ...firstTarget,
          quantity: quantityToDiscount,
        },
      ];

      console.log("Split line created:", newLine.id);
    }

    const matchingIds = targetItems.map((orderItem) => orderItem.id);

    const previousDiscounts = session.discounts.filter(
      (discount) =>
        discount.orderItemId && matchingIds.includes(discount.orderItemId),
    );

    const previousDiscountAmount = previousDiscounts.reduce(
      (sum, discount) => sum + Number(discount.amount ?? 0),
      0,
    );

    await prisma.pOSDiscount.deleteMany({
      where: {
        restaurantId,
        pOSTableSessionId: session.id,
        orderItemId: {
          in: matchingIds,
        },
      },
    });

    await prisma.pOSOrderItem.updateMany({
      where: {
        id: {
          in: matchingIds,
        },
      },
      data: {
        discountType: null,
        discountValue: null,
        discountAmount: 0,
      },
    });

    let newItemDiscountAmount = 0;

    if (!shouldRemove && type) {
      for (const orderItem of targetItems) {
        const quantity =
          Number(orderItem.quantity ?? 0) -
          Number(orderItem.paidQuantity ?? 0) -
          Number(orderItem.voidedQuantity ?? 0);

        if (quantity <= 0) continue;

        const base = quantity * Number(orderItem.unitPrice ?? 0);
        const lineDiscount = amountFromDiscount(base, type, discountValue);

        if (lineDiscount <= 0) continue;

        await prisma.pOSOrderItem.update({
          where: { id: orderItem.id },
          data: {
            discountType: type,
            discountValue,
            discountAmount: lineDiscount,
          },
        });

        await prisma.pOSDiscount.create({
          data: {
            restaurantId,
            tableSessionId: session.id,
            pOSTableSessionId: session.id,
            orderItemId: orderItem.id,
            type,
            value: discountValue,
            amount: lineDiscount,
            reason: reason || null,
          },
        });

        newItemDiscountAmount += lineDiscount;
      }
    }

    const delta = newItemDiscountAmount - previousDiscountAmount;
    const nextDiscountAmount = Math.max(0, currentDiscountAmount + delta);
    const nextTotalAmount = Math.max(0, currentTotal - delta);
    const nextRemainingAmount = Math.max(0, nextTotalAmount - paidAmount);

    await prisma.pOSTableSession.update({
      where: { id: session.id },
      data: {
        discountAmount: nextDiscountAmount,
        totalAmount: nextTotalAmount,
        remainingAmount: nextRemainingAmount,
      },
    });

    return NextResponse.json({
      success: true,
      discountAmount: newItemDiscountAmount,
      discountDelta: delta,
    });
  } catch (error: any) {
    console.error("POS DISCOUNT ERROR:", error);

    return NextResponse.json(
      { error: error?.message ?? "Erro interno." },
      { status: 500 },
    );
  }
}