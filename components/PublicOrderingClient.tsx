"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  vatRate: number;
  imageUrl: string | null;
  allergens: string | null;
  featured: boolean;
};

type Category = {
  id: string;
  name: string;
  products: Product[];
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  vatRate: number;
  quantity: number;
};

type SessionOrderItem = {
  id: string;
  productName: string;
  quantity: number;
  lineTotal: number | string;
};

type SessionOrder = {
  id: string;
  status: string;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    quantity: number;
  }[];
};

type TableSession = {
  id: string;
  status: string;
  requestedBillAt: string | null;
  requestedWaiterAt: string | null;
  orders: SessionOrder[];
} | null;

function statusLabel(status: string) {
  if (status === "PENDING") return "Recebido";
  if (status === "PREPARING") return "A preparar";
  if (status === "READY") return "Pronto";
  if (status === "DELIVERED") return "Entregue";
  if (status === "CANCELLED") return "Cancelado";
  return status;
}

function statusTone(status: string) {
  if (status === "DELIVERED") {
    return "border-green-300/20 bg-green-400/10 text-green-300";
  }

  if (status === "PREPARING" || status === "READY") {
    return "border-yellow-300/20 bg-yellow-400/10 text-yellow-300";
  }

  if (status === "CANCELLED") {
    return "border-red-300/20 bg-red-400/10 text-red-300";
  }

  return "border-cyan-300/20 bg-cyan-400/10 text-cyan-300";
}

export default function PublicOrderingClient({
  restaurantId,
  restaurantName,
  tableNumber,
  categories,

  qrOrderingEnabled,
  qrAllowWaiterCall,
  qrAllowBillRequest,
  qrWelcomeMessage,
}: {
  restaurantId: string;
  restaurantName: string;
  tableNumber: number;
  categories: Category[];

  qrOrderingEnabled: boolean;
  qrAllowWaiterCall: boolean;
  qrAllowBillRequest: boolean;
  qrWelcomeMessage: string | null;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isRequestingBill, setIsRequestingBill] = useState(false);
  const [isRequestingWaiter, setIsRequestingWaiter] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [session, setSession] = useState<TableSession>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const activeOrders = (session?.orders || []).filter(
    (order) =>
      order.status === "PENDING" ||
      order.status === "PREPARING" ||
      order.status === "READY"
  );

  const deliveredOrders = (session?.orders || []).filter(
    (order) => order.status === "DELIVERED"
  );

  async function loadSession() {
    try {
      setIsLoadingSession(true);

      const response = await fetch(
        `/api/ordering/table-session?restaurantId=${restaurantId}&tableNumber=${tableNumber}`,
        { cache: "no-store" }
      );

      if (!response.ok) return;

      const data = await response.json();
      setSession(data);
    } finally {
      setIsLoadingSession(false);
    }
  }

    useEffect(() => {
    loadSession();

    const interval = window.setInterval(() => {
      loadSession();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [restaurantId, tableNumber]);

  if (!qrOrderingEnabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] p-6">
        <div className="max-w-md rounded-3xl border border-cyan-300/10 bg-white/[0.04] p-8 text-center">
          <h1 className="text-2xl font-black text-white">
            QR Ordering indisponível
          </h1>

          <p className="mt-3 text-sm font-bold text-slate-500">
            Este restaurante desativou temporariamente os pedidos por QR Code.
          </p>
        </div>
      </main>
    );
  }

  function addToCart(product: Product) {
    setSuccessMessage("");

    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          vatRate: product.vatRate || 0,
          quantity: 1,
        },
      ];
    });
  }

  function removeFromCart(productId: string) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  async function submitOrder() {
    if (cart.length === 0 || isSending) return;

    setIsSending(true);
    setSuccessMessage("");

    try {
      const response = await fetch("/api/ordering/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantId,
          tableNumber,
          items: cart.map((item) => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            vatRate: item.vatRate,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar pedido.");
      }

      setCart([]);
      setSuccessMessage("Pedido enviado com sucesso.");
      await loadSession();
    } catch {
      setSuccessMessage("Não foi possível enviar o pedido. Tente novamente.");
    } finally {
      setIsSending(false);
    }
  }

async function requestWaiter() {
  setSuccessMessage("");

  try {
    const response = await fetch("/api/ordering/request-waiter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        tableNumber,
      }),
    });

    const text = await response.text();

let data: any = {};
try {
  data = text ? JSON.parse(text) : {};
} catch {
  data = { error: text };
}

    if (!response.ok) {
      console.error("request waiter failed:", data);
      setSuccessMessage(data?.error || "Não foi possível chamar o empregado.");
      return;
    }

    await loadSession();
    setSuccessMessage("Empregado chamado.");
  } catch (error) {
    console.error("request waiter catch:", error);
    setSuccessMessage("Não foi possível chamar o empregado.");
  }
}

  async function requestBill() {
    if (!session?.id || isRequestingBill) return;

    setIsRequestingBill(true);
    setSuccessMessage("");

    try {
      const response = await fetch("/api/ordering/request-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });

      if (!response.ok) {
        throw new Error("Erro ao pedir conta.");
      }

      await loadSession();
      setSuccessMessage("Conta pedida.");
    } catch {
      setSuccessMessage("Não foi possível pedir a conta.");
    } finally {
      setIsRequestingBill(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="mx-auto max-w-md px-4 pb-44 pt-5">
        <header className="sticky top-0 z-20 -mx-4 border-b border-cyan-300/10 bg-[#020617]/90 px-4 pb-4 pt-3 backdrop-blur-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-cyan-300">
            MesaLink QR Ordering
          </p>

          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
                
              <p className="mt-1 text-sm font-bold text-slate-400">
                Mesa {tableNumber}
              </p>
            </div>
          </div>

          {(session?.requestedWaiterAt || session?.requestedBillAt) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {session?.requestedWaiterAt && (
                <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">
                  Empregado chamado
                </span>
              )}

              {session?.requestedBillAt && (
                <span className="rounded-full border border-yellow-300/20 bg-yellow-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-yellow-300">
                  Conta pedida
                </span>
              )}
            </div>
          )}
        </header>

        {successMessage && (
          <div className="mt-4 rounded-2xl border border-green-300/20 bg-green-400/10 p-4 text-sm font-black text-green-300">
            {successMessage}
          </div>
        )}

        <section className="mt-4 rounded-[24px] border border-cyan-300/10 bg-white/[0.04] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
                Pedido da mesa
              </p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.03em]">
                Estado atual
              </h2>
            </div>

            <button
              type="button"
              onClick={loadSession}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase text-slate-300"
            >
              {isLoadingSession ? "..." : "Atualizar"}
            </button>
          </div>

          {!session || session.orders.length === 0 ? (
            <p className="mt-4 text-sm font-bold text-slate-500">
              Ainda não há pedidos nesta mesa.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {activeOrders.length > 0 && (
                <OrderGroup title="A fazer" orders={activeOrders} />
              )}

              {deliveredOrders.length > 0 && (
                <OrderGroup title="Entregue" orders={deliveredOrders} />
              )}
            </div>
          )}

          {(qrAllowWaiterCall || qrAllowBillRequest) && (
  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
    {qrAllowWaiterCall && (
      <button
        type="button"
        onClick={requestWaiter}
        disabled={isRequestingWaiter}
        className="h-11 rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 text-xs font-black text-cyan-300 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isRequestingWaiter ? "A chamar..." : "🛎 Empregado"}
      </button>
    )}

    {qrAllowBillRequest && (
      <button
        type="button"
        onClick={requestBill}
        disabled={!session?.id || isRequestingBill}
        className="h-11 rounded-full border border-yellow-300/15 bg-yellow-400/10 px-3 text-xs font-black text-yellow-300 transition hover:bg-yellow-400/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isRequestingBill ? "A pedir..." : "💳 Conta"}
      </button>
    )}
  </div>
)}

          {!session?.id && (qrAllowWaiterCall || qrAllowBillRequest) && (
            <p className="mt-2 text-center text-[11px] font-bold text-slate-600">
              Pode chamar o empregado antes de fazer pedido. A conta fica
              disponível depois de abrir a mesa.
            </p>
          )}
        </section>

        <section className="mt-5 space-y-4">
          {categories.map((category, index) => (
            <details key={category.id} open={index === 0} className="group">
              <summary className="mb-3 flex cursor-pointer list-none items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div>
                  <h2 className="text-xl font-black tracking-[-0.03em]">
                    {category.name}
                  </h2>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {category.products.length} produto(s)
                  </p>
                </div>

                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/15 bg-cyan-400/10 text-sm font-black text-cyan-300 transition group-open:rotate-180">
                  ↓
                </span>
              </summary>

              <div className="space-y-3 pb-3">
                {category.products.map((product) => (
                  <article
                    key={product.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                  >
                    <div className="flex items-center gap-3">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-12 w-12 shrink-0 rounded-xl object-cover"
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-white">
                          {product.name}
                        </p>

                        {product.description && (
                          <p className="truncate text-xs text-slate-500">
                            {product.description}
                          </p>
                        )}

                        <div className="mt-1 flex gap-1">
                          <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-2 py-0.5 text-[9px] font-black text-cyan-300">
                            IVA {product.vatRate}%
                          </span>

                          {product.featured && (
                            <span className="rounded-full border border-yellow-300/15 bg-yellow-400/10 px-2 py-0.5 text-[9px] font-black text-yellow-300">
                              Popular
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-black text-cyan-300">
                          {Number(product.price).toFixed(2)}€
                        </p>

                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          className="mt-2 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-3 py-1 text-[11px] font-black text-black"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </details>
          ))}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-cyan-300/10 bg-[#020617]/95 p-4 backdrop-blur-xl">
        <div className="mx-auto max-w-md space-y-3">
          {cart.length > 0 && (
            <div className="max-h-36 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div>
                    <p className="font-black">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.quantity} x {item.price.toFixed(2)}€
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="rounded-full border border-red-300/20 bg-red-400/10 px-3 py-1 text-xs font-black text-red-300"
                  >
                    -
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-500">Pedido</p>
              <p className="text-sm font-black text-white">
                {cartCount > 0
                  ? `${cartCount} item(s) · ${total.toFixed(2)}€`
                  : "Carrinho vazio"}
              </p>
            </div>

            <button
              type="button"
              onClick={submitOrder}
              disabled={cart.length === 0 || isSending}
              className="rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 py-3 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSending ? "A enviar..." : "Enviar pedido"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function OrderGroup({
  title,
  orders,
}: {
  title: string;
  orders: SessionOrder[];
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>

      <div className="space-y-2">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl border border-white/10 bg-[#020617]/60 p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span
                className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${statusTone(
                  order.status
                )}`}
              >
                {statusLabel(order.status)}
              </span>

              <p className="text-xs font-black text-cyan-300">
                {Number(order.total).toFixed(2)}€
              </p>
            </div>

            <div className="space-y-1">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <p className="font-bold text-slate-300">
                    {item.quantity}x {item.productName}
                  </p>
                  <p className="font-bold text-slate-500">
                    {Number(item.lineTotal).toFixed(2)}€
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
