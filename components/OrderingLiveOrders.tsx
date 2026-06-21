"use client";

import { useEffect, useMemo, useState } from "react";

type OrderingItem = {
  id: string;
  productName: string;
  quantity: number;
  lineTotal: string | number;
};

type OrderingOrder = {
  id: string;
  status: string;
  total: string | number;
  createdAt: string;
  items: OrderingItem[];
};

type OrderingSession = {
  id: string;
  tableNumber: number;
  openedAt: string;
  requestedWaiterAt: string | null;
  requestedBillAt: string | null;
  orders: OrderingOrder[];
};

export default function OrderingLiveOrders({
  restaurantId,
  initialSessions,
}: {
  restaurantId: string;
  initialSessions: OrderingSession[];
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [sessionToClose, setSessionToClose] = useState<string | null>(null);

  const totals = useMemo(() => {
    const openTables = sessions.length;
    const activeOrders = sessions.reduce(
      (total, session) =>
        total +
        session.orders.filter(
          (order) => order.status !== "DELIVERED" && order.status !== "CANCELLED",
        ).length,
      0,
    );
    const waiterCalls = sessions.filter((session) => session.requestedWaiterAt).length;
    const billRequests = sessions.filter((session) => session.requestedBillAt).length;

    return { openTables, activeOrders, waiterCalls, billRequests };
  }, [sessions]);

  async function refreshOrders() {
    const response = await fetch(`/api/restaurants/${restaurantId}/ordering/live`, {
      cache: "no-store",
    });

    if (!response.ok) return;

    const data = await response.json();
    setSessions(data.sessions || []);
  }

  async function updateOrderStatus(orderId: string, status: string) {
    await fetch(`/api/restaurants/${restaurantId}/ordering/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    await refreshOrders();
  }

  async function confirmCloseSession() {
    if (!sessionToClose) return;

    const response = await fetch(
      `/api/restaurants/${restaurantId}/ordering/sessions/${sessionToClose}/close`,
      { method: "PATCH" },
    );

    if (!response.ok) return;

    const data = await response.json();
    setSessions(data.sessions || []);
    setSessionToClose(null);
  }

  async function resolveAlert(sessionId: string, type: "waiter" | "bill") {
    const response = await fetch(
      `/api/restaurants/${restaurantId}/ordering/sessions/${sessionId}/resolve`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      },
    );

    if (!response.ok) return;

    const data = await response.json();
    setSessions(data.sessions || []);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      refreshOrders();
    }, 4000);

    return () => clearInterval(interval);
  }, [restaurantId]);

  return (
    <>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <MiniMetric label="Mesas" value={totals.openTables} />
        <MiniMetric label="Pedidos ativos" value={totals.activeOrders} />
        <MiniMetric label="Empregado" value={totals.waiterCalls} tone="green" />
        <MiniMetric label="Conta" value={totals.billRequests} tone="gold" />
      </div>

      <div className="mt-5 space-y-4">
        {sessions.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#D6C3A5] bg-[#FFF9F0] p-6 text-sm font-semibold text-[#6B6258]">
            Ainda não há pedidos QR ativos.
          </div>
        ) : (
          sessions.map((session) => <SessionCard key={session.id} session={session} updateOrderStatus={updateOrderStatus} resolveAlert={resolveAlert} setSessionToClose={setSessionToClose} />)
        )}
      </div>

      {sessionToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] border border-[#E1D0B8] bg-white p-6 shadow-[0_30px_90px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#A14E36]">
              Atenção
            </p>

            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.055em] text-[#16120E]">
              Encerrar mesa?
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#6B6258]">
              Esta ação fecha a sessão da mesa e remove-a dos pedidos ativos.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setSessionToClose(null)}
                className="h-11 flex-1 rounded-full border border-[#E1D0B8] bg-[#FFF9F0] text-sm font-semibold text-[#16120E]"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmCloseSession}
                className="h-11 flex-1 rounded-full bg-[#A14E36] text-sm font-semibold text-white"
              >
                Encerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SessionCard({
  session,
  updateOrderStatus,
  resolveAlert,
  setSessionToClose,
}: {
  session: OrderingSession;
  updateOrderStatus: (orderId: string, status: string) => void;
  resolveAlert: (sessionId: string, type: "waiter" | "bill") => void;
  setSessionToClose: (id: string) => void;
}) {
  const sessionTotal = session.orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const activeOrders = session.orders.filter(
    (order) => order.status !== "DELIVERED" && order.status !== "CANCELLED",
  );

  return (
    <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-4 shadow-[0_16px_48px_rgba(80,55,30,0.045)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
            Mesa
          </p>
          <h3 className="mt-1 text-3xl font-semibold tracking-[-0.06em]">
            {session.tableNumber}
          </h3>
          <p className="mt-1 text-sm font-semibold text-[#6B6258]">
            {session.orders.length} pedido(s) · {formatTime(session.openedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] px-4 py-2 text-right">
            <p className="text-xs font-semibold text-[#6B6258]">Total</p>
            <p className="text-xl font-semibold">{sessionTotal.toFixed(2)}€</p>
          </div>

          {(session.requestedWaiterAt || session.requestedBillAt) && (
            <span className="rounded-full border border-[#E7B7A8] bg-[#FFF0EA] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#A14E36]">
              Ação necessária
            </span>
          )}

          <button
            type="button"
            onClick={() => setSessionToClose(session.id)}
            className="h-10 rounded-full border border-[#E7B7A8] bg-[#FFF0EA] px-4 text-xs font-semibold text-[#A14E36]"
          >
            Encerrar mesa
          </button>
        </div>
      </div>

      {(session.requestedWaiterAt || session.requestedBillAt) && (
        <div className="mt-4 rounded-[22px] border border-[#E7B7A8] bg-[#FFF0EA] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A14E36]">
            Ações pendentes
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {session.requestedWaiterAt && (
              <button
                type="button"
                onClick={() => resolveAlert(session.id, "waiter")}
                className="rounded-full border border-[#E1D0B8] bg-white px-4 py-2 text-xs font-semibold text-[#16120E]"
              >
                Resolver pedido de empregado
              </button>
            )}

            {session.requestedBillAt && (
              <button
                type="button"
                onClick={() => resolveAlert(session.id, "bill")}
                className="rounded-full border border-[#E1D0B8] bg-white px-4 py-2 text-xs font-semibold text-[#16120E]"
              >
                Resolver pedido de conta
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {session.orders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#D6C3A5] bg-[#FFF9F0] p-4 text-sm font-semibold text-[#6B6258]">
            Mesa aberta sem pedidos.
          </p>
        ) : (
          session.orders.map((order) => (
            <OrderCard key={order.id} order={order} updateOrderStatus={updateOrderStatus} />
          ))
        )}
      </div>

      {activeOrders.length > 0 && (
        <p className="mt-4 text-xs font-semibold text-[#9B6F3B]">
          {activeOrders.length} pedido(s) ainda em curso nesta mesa.
        </p>
      )}
    </div>
  );
}

function OrderCard({
  order,
  updateOrderStatus,
}: {
  order: OrderingOrder;
  updateOrderStatus: (orderId: string, status: string) => void;
}) {
  return (
    <div className="rounded-[22px] border border-[#E8DCCB] bg-[#FFF9F0] p-4">
      <div className="flex justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusClass(order.status)}`}>
              {statusLabel(order.status)}
            </span>

            <span className="text-xs font-semibold text-[#6B6258]">
              {formatTime(order.createdAt)}
            </span>
          </div>

          <div className="mt-3 space-y-1.5">
            {order.items.map((item) => (
              <div key={item.id} className="flex max-w-lg items-center justify-between gap-8 text-sm">
                <p className="font-semibold text-[#16120E]">
                  {item.quantity}x {item.productName}
                </p>

                <p className="font-semibold text-[#6B6258]">
                  {Number(item.lineTotal || 0).toFixed(2)}€
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="shrink-0 text-xl font-semibold text-[#16120E]">
          {Number(order.total || 0).toFixed(2)}€
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {order.status !== "PREPARING" &&
          order.status !== "DELIVERED" &&
          order.status !== "CANCELLED" && (
            <button
              type="button"
              onClick={() => updateOrderStatus(order.id, "PREPARING")}
              className="h-9 rounded-full border border-[#E1D0B8] bg-white px-4 text-xs font-semibold text-[#16120E]"
            >
              Preparar
            </button>
          )}

        {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
          <button
            type="button"
            onClick={() => updateOrderStatus(order.id, "DELIVERED")}
            className="h-9 rounded-full border border-[#9CCB9B] bg-[#ECF7EC] px-4 text-xs font-semibold text-[#3F6A4D]"
          >
            Entregue
          </button>
        )}

        {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
          <button
            type="button"
            onClick={() => updateOrderStatus(order.id, "CANCELLED")}
            className="h-9 rounded-full border border-[#E7B7A8] bg-[#FFF0EA] px-4 text-xs font-semibold text-[#A14E36]"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "green" | "gold";
}) {
  const dot = tone === "green" ? "bg-[#86A969]" : tone === "gold" ? "bg-[#C8A56A]" : "bg-[#DCC9AE]";

  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#E1D0B8] bg-white px-4 py-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9B6F3B]">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold tracking-[-0.05em]">{value}</p>
      </div>
      <span className={`h-3 w-3 rounded-full ${dot}`} />
    </div>
  );
}

function statusLabel(status: string) {
  if (status === "PENDING") return "Recebido";
  if (status === "PREPARING") return "A preparar";
  if (status === "READY") return "Pronto";
  if (status === "DELIVERED") return "Entregue";
  if (status === "CANCELLED") return "Cancelado";
  return status;
}

function statusClass(status: string) {
  if (status === "DELIVERED") return "border-[#9CCB9B] bg-[#ECF7EC] text-[#3F6A4D]";
  if (status === "PREPARING" || status === "READY") return "border-[#E6C778] bg-[#FFF1D0] text-[#9B6F3B]";
  if (status === "CANCELLED") return "border-[#E7B7A8] bg-[#FFF0EA] text-[#A14E36]";
  return "border-[#E1D0B8] bg-white text-[#9B6F3B]";
}

function formatTime(value: Date | string) {
  return new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
