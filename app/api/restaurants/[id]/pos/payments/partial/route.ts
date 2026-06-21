import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type PartialPaymentItem = {
  productName: string;
  unitPrice: number;
  quantity: number;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;
    const { sessionId, method, amount, items } = await request.json();

    if (!sessionId || !method || !amount || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Dados inválidos." },
        { status: 400 },
      );
    }

    const paymentAmount = Number(amount);

    if (paymentAmount <= 0) {
      return NextResponse.json(
        { error: "Valor inválido." },
        { status: 400 },
      );
    }

    const session = await prisma.pOSTableSession.findFirst({
      where: {
        id: sessionId,
        restaurantId,
        status: "OPEN",
      },
      include: {
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

    const openCashRegister = await prisma.pOSCashRegister.findFirst({
      where: {
        restaurantId,
        status: "OPEN",
      },
      orderBy: {
        openedAt: "desc",
      },
    });

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.pOSPayment.create({
        data: {
          restaurantId,
          tableSessionId: session.id,
          cashRegisterId: openCashRegister?.id,
          amount: paymentAmount,
          method,
          status: "PAID",
        },
      });

      for (const selected of items as PartialPaymentItem[]) {
        let quantityToPay = Number(selected.quantity ?? 0);

        if (quantityToPay <= 0) continue;

        const matchingItems = session.orders
          .flatMap((order) => order.items)
          .filter(
            (item) =>
              item.productName === selected.productName &&
              Number(item.unitPrice) === Number(selected.unitPrice),
          );

        for (const item of matchingItems) {
          if (quantityToPay <= 0) break;

          const available =
            Number(item.quantity) -
            Number(item.paidQuantity ?? 0) -
            Number(item.voidedQuantity ?? 0);

          if (available <= 0) continue;

          const quantityForThisItem = Math.min(available, quantityToPay);

          await tx.pOSOrderItem.update({
            where: {
              id: item.id,
            },
            data: {
              paidQuantity: {
                increment: quantityForThisItem,
              },
            },
          });

          quantityToPay -= quantityForThisItem;
        }
      }

      const currentPaid = Number(session.paidAmount ?? 0);
      const totalAmount = Number(session.totalAmount ?? 0);
      const newPaidAmount = currentPaid + paymentAmount;
      const newRemainingAmount = Math.max(0, totalAmount - newPaidAmount);
      const shouldClose = newRemainingAmount <= 0.009;

      await tx.pOSTableSession.update({
        where: {
          id: session.id,
        },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: shouldClose ? "CLOSED" : "OPEN",
          closedAt: shouldClose ? new Date() : null,
        },
      });

      if (shouldClose) {
        await tx.pOSOrder.updateMany({
          where: {
            tableSessionId: session.id,
          },
          data: {
            status: "CLOSED",
          },
        });
      }

      return {
        payment,
        closed: shouldClose,
      };
    });

    return NextResponse.json({
      success: true,
      closed: result.closed,
      paymentId: result.payment.id,
    });
  } catch (error: any) {
    console.error("PARTIAL PAYMENT ERROR:", error);

    return NextResponse.json(
      { error: error?.message ?? "Erro interno." },
      { status: 500 },
    );
  }
}