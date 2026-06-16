"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch(
        `/api/restaurants/${restaurantId}/ordering/live`,
        { cache: "no-store" }
      );

      if (!response.ok) return;

      const data = await response.json();
      setSessions(data.sessions || []);
    }, 4000);

    return () => clearInterval(interval);
  }, [restaurantId]);

  return (
    <div className="mt-6 space-y-4">
      {sessions.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-cyan-300/15 bg-[#020617]/60 p-6 text-sm text-slate-400">
          Ainda não há pedidos QR ativos.
        </div>
      ) : (
        sessions.map((session) => (
          <div
            key={session.id}
            className="rounded-[24px] border border-cyan-300/10 bg-[#020617]/60 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black">
                  Mesa {session.tableNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {session.orders.length} pedido(s)
                </p>
              </div>

              {(session.requestedWaiterAt || session.requestedBillAt) && (
                <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-black text-red-300">
                  ALERTA
                </span>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {session.orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase text-cyan-300">
                        {order.status}
                      </p>

                      <div className="mt-3 space-y-1">
                        {order.items.map((item) => (
                          <p key={item.id} className="text-sm font-bold">
                            {item.quantity}x {item.productName}
                          </p>
                        ))}
                      </div>
                    </div>

                    <p className="text-xl font-black text-cyan-300">
                      {Number(order.total).toFixed(2)}€
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}