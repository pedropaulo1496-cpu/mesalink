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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;

    const {
      sourceSessionId,
      targetTableId,
      transferAll = false,
      items = [],
    } = await request.json();

    if (!sourceSessionId || !targetTableId) {
      return NextResponse.json(
        { error: "Dados inválidos." },
        { status: 400 },
      );
    }

    const sourceSession = await prisma.pOSTableSession.findFirst({
      where: {
        id: sourceSessionId,
        restaurantId,
        status: "OPEN",
      },
      include: {
        table: true,
        orders: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!sourceSession) {
      return NextResponse.json(
        { error: "Mesa origem não encontrada." },
        { status: 404 },
      );
    }

    if (sourceSession.tableId === targetTableId) {
      return NextResponse.json(
        { error: "A mesa destino é igual à mesa origem." },
        { status: 400 },
      );
    }

    const targetTable = await prisma.table.findFirst({
      where: {
        id: targetTableId,
        restaurantId,
      },
    });

    if (!targetTable) {
      return NextResponse.json(
        { error: "Mesa destino não encontrada." },
        { status: 404 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let targetSession = await tx.pOSTableSession.findFirst({
        where: {
          restaurantId,
          tableId: targetTableId,
          status: "OPEN",
        },
      });

      if (!targetSession) {
        targetSession = await tx.pOSTableSession.create({
          data: {
            restaurantId,
            tableId: targetTableId,
            status: "OPEN",
            guestCount: sourceSession.guestCount,
            subtotalAmount: 0,
            discountAmount: 0,
            totalAmount: 0,
            remainingAmount: 0,
          },
        });
      }

      const targetOrder = await tx.pOSOrder.create({
        data: {
          restaurantId,
          tableSessionId: targetSession.id,
          source: "POS",
          status: "OPEN",
          subtotal: 0,
          discountAmount: 0,
          kitchenNotes: `Transferido da mesa ${sourceSession.table?.number ?? ""}`,
        },
      });

      const sourceItems = sourceSession.orders.flatMap((order) => order.items);

      const selectedItems = transferAll
        ? sourceItems.map((item) => ({
            itemId: item.id,
            quantity:
              Number(item.quantity ?? 0) -
              Number(item.paidQuantity ?? 0) -
              Number(item.voidedQuantity ?? 0),
          }))
        : items;

      for (const selected of selectedItems) {
        const sourceItem = sourceItems.find(
          (item) => item.id === selected.itemId,
        );

        if (!sourceItem) continue;

        const availableQuantity = Math.max(
          0,
          Number(sourceItem.quantity ?? 0) -
            Number(sourceItem.paidQuantity ?? 0) -
            Number(sourceItem.voidedQuantity ?? 0),
        );

        const quantityToTransfer = Math.max(
          0,
          Math.min(availableQuantity, Number(selected.quantity ?? 0)),
        );

        if (quantityToTransfer <= 0) continue;

        const originalQuantity = Number(sourceItem.quantity ?? 0);
        const unitPrice = Number(sourceItem.unitPrice ?? 0);
        const grossToTransfer = quantityToTransfer * unitPrice;

        const discountRatio =
          originalQuantity > 0 ? quantityToTransfer / originalQuantity : 0;

        const discountToTransfer = Math.min(
          grossToTransfer,
          Number(sourceItem.discountAmount ?? 0) * discountRatio,
        );

        const remainingQuantity = originalQuantity - quantityToTransfer;

        await tx.pOSOrderItem.create({
          data: {
            orderId: targetOrder.id,
            productId: sourceItem.productId,
            productName: sourceItem.productName,
            quantity: quantityToTransfer,
            unitPrice,
            totalPrice: grossToTransfer,
            paidQuantity: 0,
            voidedQuantity: 0,
            discountType: sourceItem.discountType,
            discountValue: sourceItem.discountValue,
            discountAmount: discountToTransfer,
            notes: sourceItem.notes,
            kitchenNotes: sourceItem.kitchenNotes,
          },
        });

        if (discountToTransfer > 0) {
          await tx.pOSDiscount.create({
            data: {
              restaurantId,
              tableSessionId: targetSession.id,
              pOSTableSessionId: targetSession.id,
              orderItemId: undefined,
              type: sourceItem.discountType ?? "AMOUNT",
              value: sourceItem.discountValue ?? discountToTransfer,
              amount: discountToTransfer,
              reason: "Transferência de item",
            },
          });
        }

        if (remainingQuantity <= 0) {
          await tx.pOSDiscount.deleteMany({
            where: {
              orderItemId: sourceItem.id,
            },
          });

          await tx.pOSOrderItem.delete({
            where: {
              id: sourceItem.id,
            },
          });
        } else {
          const remainingGross = remainingQuantity * unitPrice;
          const remainingDiscount = Math.max(
            0,
            Number(sourceItem.discountAmount ?? 0) - discountToTransfer,
          );

          await tx.pOSOrderItem.update({
            where: {
              id: sourceItem.id,
            },
            data: {
              quantity: remainingQuantity,
              totalPrice: remainingGross,
              discountAmount: Math.min(remainingGross, remainingDiscount),
            },
          });

          await tx.pOSDiscount.updateMany({
            where: {
              orderItemId: sourceItem.id,
            },
            data: {
              amount: Math.min(remainingGross, remainingDiscount),
            },
          });
        }
      }

      await tx.pOSTableTransfer.create({
        data: {
          restaurantId,
          fromTableId: sourceSession.tableId,
          toTableId: targetTableId,
          fromSessionId: sourceSession.id,
          toSessionId: targetSession.id,
          reason: transferAll ? "TRANSFER_ALL" : "TRANSFER_ITEMS",
        },
      });

      return {
        sourceSessionId: sourceSession.id,
        targetSessionId: targetSession.id,
      };
    });

    await recalculateSession(result.sourceSessionId);
    await recalculateSession(result.targetSessionId);

    const remainingSourceItems = await prisma.pOSOrderItem.count({
      where: {
        order: {
          tableSessionId: result.sourceSessionId,
        },
      },
    });

    if (remainingSourceItems === 0) {
      await prisma.pOSTableSession.update({
        where: {
          id: result.sourceSessionId,
        },
        data: {
          status: "CLOSED",
          closedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      sourceSessionId: result.sourceSessionId,
      targetSessionId: result.targetSessionId,
    });
  } catch (error: any) {
    console.error("POS TRANSFER ERROR:", error);

    return NextResponse.json(
      { error: error?.message ?? "Erro interno." },
      { status: 500 },
    );
  }
}