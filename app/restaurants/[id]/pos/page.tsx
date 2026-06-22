import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import POSClient from "./POSClient";

export default async function RestaurantPOSPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
       fiscalIntegration: true,
      posCashRegisters: {
        include: {
          payments: true,
          movements: true,
        },
        orderBy: { openedAt: "desc" },
      },

      posPayments: {
        where: {
          createdAt: { gte: startOfToday },
          status: "PAID",
        },
        include: {
          tableSession: {
            include: { table: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },

      orderingOrders: {
        where: { status: "PENDING" },
        include: { items: true },
        orderBy: { createdAt: "asc" },
        take: 20,
      },

      orderingTableSessions: {
        where: {
          status: "OPEN",
          OR: [
            { requestedWaiterAt: { not: null } },
            { requestedBillAt: { not: null } },
          ],
        },
        orderBy: { openedAt: "desc" },
      },

      tables: {
        orderBy: { number: "asc" },
      },

      orderingCategories: {
        where: { activeInPOS: true },
        orderBy: { position: "asc" },
        include: {
          products: {
            where: {
              active: true,
              activeInPOS: true,
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      },

      posTableSessions: {
        where: { status: "OPEN" },
        include: {
          table: true,
          discounts: true,
          orders: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  });

  if (!restaurant) notFound();

  const categories = restaurant.orderingCategories.map((category) => ({
    ...category,
    products: category.products.map((product) => ({
      ...product,
      price: Number(product.price),
    })),
  }));

  const sessions = restaurant.posTableSessions.map((session) => ({
    ...session,

    totalAmount: Number(session.totalAmount),
    subtotalAmount: Number(session.subtotalAmount ?? 0),
    discountAmount: Number(session.discountAmount ?? 0),
    paidAmount: Number(session.paidAmount ?? 0),
    remainingAmount: Number(session.remainingAmount ?? 0),

    discounts: session.discounts.map((discount) => ({
      ...discount,
      value: Number(discount.value),
      amount: Number(discount.amount),
    })),

    orders: session.orders.map((order) => ({
      ...order,

      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount ?? 0),

      items: order.items.map((item) => ({
        ...item,

        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),

        discountValue:
          item.discountValue === null ? null : Number(item.discountValue),

        discountAmount: Number(item.discountAmount ?? 0),
      })),
    })),
  }));

  const cashRegisters = restaurant.posCashRegisters.map((register) => ({
    ...register,

    openingAmount: Number(register.openingAmount),

    closingAmount:
      register.closingAmount === null
        ? null
        : Number(register.closingAmount),

    expectedCash:
      register.expectedCash === null
        ? null
        : Number(register.expectedCash),

    difference:
      register.difference === null
        ? null
        : Number(register.difference),

    payments: register.payments.map((payment) => ({
      ...payment,

      amount: Number(payment.amount),

      receivedAmount:
        payment.receivedAmount === null
          ? null
          : Number(payment.receivedAmount),

      changeAmount:
        payment.changeAmount === null ? null : Number(payment.changeAmount),
    })),

    movements: register.movements.map((movement) => ({
      ...movement,
      amount: Number(movement.amount),
    })),
  }));

  const todayPayments = restaurant.posPayments.map((payment) => ({
    ...payment,
    amount: Number(payment.amount),
    receivedAmount:
      payment.receivedAmount === null ? null : Number(payment.receivedAmount),
    changeAmount:
      payment.changeAmount === null ? null : Number(payment.changeAmount),
    tableSession: payment.tableSession
      ? {
          ...payment.tableSession,
          totalAmount: Number(payment.tableSession.totalAmount),
          subtotalAmount: Number(payment.tableSession.subtotalAmount ?? 0),
          discountAmount: Number(payment.tableSession.discountAmount ?? 0),
          paidAmount: Number(payment.tableSession.paidAmount ?? 0),
          remainingAmount: Number(payment.tableSession.remainingAmount ?? 0),
        }
      : null,
  }));

  const pendingOrders = restaurant.orderingOrders.map((order) => ({
    ...order,
    subtotal: Number(order.subtotal),
    vatTotal: Number(order.vatTotal),
    total: Number(order.total),

    items: order.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      lineSubtotal: Number(item.lineSubtotal),
      lineVat: Number(item.lineVat),
      lineTotal: Number(item.lineTotal),
    })),
  }));

  const qrAlerts = restaurant.orderingTableSessions.map((session) => ({
    id: session.id,
    tableNumber: session.tableNumber,
    requestedWaiterAt: session.requestedWaiterAt,
    requestedBillAt: session.requestedBillAt,
  }));

  return (
    <main className="flex h-screen overflow-hidden bg-[#F6F1EA] text-[#171412]">
      <RestaurantSidebar
        id={restaurant.id}
        restaurantName={restaurant.name}
        active="POS"
      />

      <POSClient
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        tables={restaurant.tables}
        categories={categories}
        sessions={sessions}
        cashRegisters={cashRegisters}
        todayPayments={todayPayments}
        pendingOrders={pendingOrders}
        qrAlerts={qrAlerts}
        fiscalIntegration={restaurant.fiscalIntegration}
      />
    </main>
  );
}