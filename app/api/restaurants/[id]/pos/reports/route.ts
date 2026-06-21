import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const payments = await prisma.pOSPayment.findMany({
      where: {
        restaurantId,
        status: "PAID",
        createdAt: {
          gte: startOfToday,
        },
      },
      include: {
        tableSession: {
          include: {
            orders: {
              include: {
                items: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const totalRevenue = payments.reduce(
      (sum, payment) => sum + Number(payment.amount ?? 0),
      0,
    );

    const totalPayments = payments.length;

    const totalGuests = payments.reduce(
      (sum, payment) =>
        sum + Number(payment.tableSession?.guestCount ?? 1),
      0,
    );

    const averageTicket =
      totalPayments > 0 ? totalRevenue / totalPayments : 0;

    const averagePerGuest =
      totalGuests > 0 ? totalRevenue / totalGuests : 0;

    const byMethod = {
      CASH: 0,
      CARD: 0,
      BANK_TRANSFER: 0,
    };

    const productMap = new Map<
      string,
      {
        name: string;
        quantity: number;
        revenue: number;
      }
    >();

    for (const payment of payments) {
      const method = payment.method as keyof typeof byMethod;

      if (method in byMethod) {
        byMethod[method] += Number(payment.amount ?? 0);
      }

      const items =
        payment.tableSession?.orders.flatMap((order) => order.items) ?? [];

      for (const item of items) {
        const current = productMap.get(item.productName) ?? {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        };

        current.quantity += Number(item.quantity ?? 0);
        current.revenue += Number(item.totalPrice ?? 0);

        productMap.set(item.productName, current);
      }
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return NextResponse.json({
      totalRevenue,
      totalPayments,
      totalGuests,
      averageTicket,
      averagePerGuest,
      byMethod,
      topProducts,
    });
  } catch (error: any) {
    console.error("POS REPORTS ERROR:", error);

    return NextResponse.json(
      { error: error?.message ?? "Erro interno." },
      { status: 500 },
    );
  }
}