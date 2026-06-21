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
    lineTotal?: number | string;
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
    return "border-[#CFE3D0] bg-[#ECF7EC] text-[#3F6A4D]";
  }

  if (status === "PREPARING" || status === "READY") {
    return "border-[#E8D2A3] bg-[#FFF1D0] text-[#9B6F3B]";
  }

  if (status === "CANCELLED") {
    return "border-[#E7B7A8] bg-[#FFF0EA] text-[#A14E36]";
  }

  return "border-[#E1D0B8] bg-[#F7F0E7] text-[#6B6258]";
}

function orderTime(date: string) {
  return new Date(date).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
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
    [cart],
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const activeOrders = (session?.orders || []).filter(
    (order) =>
      order.status === "PENDING" ||
      order.status === "PREPARING" ||
      order.status === "READY",
  );

  const deliveredOrders = (session?.orders || []).filter(
    (order) => order.status === "DELIVERED",
  );

  async function loadSession() {
    try {
      setIsLoadingSession(true);

      const response = await fetch(
        `/api/ordering/table-session?restaurantId=${restaurantId}&tableNumber=${tableNumber}`,
        { cache: "no-store" },
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
      <main className="flex min-h-screen items-center justify-center bg-[#F5EFE6] p-6 text-[#16120E]">
        <div className="max-w-md rounded-[32px] border border-[#E1D0B8] bg-white p-8 text-center shadow-[0_22px_70px_rgba(80,55,30,0.055)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
            MesaLink QR Ordering
          </p>

          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.05em]">
            QR Ordering indisponível
          </h1>

          <p className="mt-3 text-sm font-medium leading-6 text-[#6B6258]">
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
            : item,
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
            : item,
        )
        .filter((item) => item.quantity > 0),
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
    if (isRequestingWaiter) return;

    setIsRequestingWaiter(true);
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
    } finally {
      setIsRequestingWaiter(false);
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
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="mx-auto max-w-md px-4 pb-36 pt-5">
        <header className="sticky top-0 z-20 -mx-4 border-b border-[#E1D0B8] bg-[#F5EFE6]/92 px-4 pb-4 pt-3 backdrop-blur-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#9B6F3B]">
            MesaLink QR Ordering
          </p>

          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.065em]">
                {restaurantName}
              </h1>

              <p className="mt-1 text-sm font-medium text-[#6B6258]">
                Mesa {tableNumber}
              </p>
            </div>
          </div>

          {(session?.requestedWaiterAt || session?.requestedBillAt) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {session?.requestedWaiterAt && (
                <span className="rounded-full border border-[#E1D0B8] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B6258]">
                  Empregado chamado
                </span>
              )}

              {session?.requestedBillAt && (
                <span className="rounded-full border border-[#E8D2A3] bg-[#FFF1D0] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B6F3B]">
                  Conta pedida
                </span>
              )}
            </div>
          )}
        </header>

        {successMessage && (
          <div className="mt-4 rounded-2xl border border-[#CFE3D0] bg-[#ECF7EC] p-4 text-sm font-semibold text-[#3F6A4D]">
            {successMessage}
          </div>
        )}

        {qrWelcomeMessage && (
          <section className="mt-4 rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-4">
            <p className="text-sm font-medium leading-6 text-[#6B6258]">
              {qrWelcomeMessage}
            </p>
          </section>
        )}

        <section className="mt-4 rounded-[28px] border border-[#E1D0B8] bg-white p-4 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9B6F3B]">
                Pedido da mesa
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.05em]">
                Estado atual
              </h2>
            </div>

            <button
              type="button"
              onClick={loadSession}
              className="rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-3 py-1 text-[10px] font-semibold uppercase text-[#6B6258] transition hover:bg-[#F7F0E7]"
            >
              {isLoadingSession ? "..." : "Atualizar"}
            </button>
          </div>

          {!session || session.orders.length === 0 ? (
            <p className="mt-4 text-sm font-medium text-[#6B6258]">
              Ainda não há pedidos nesta mesa.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {activeOrders.length > 0 && (
                <OrderGroup title="Pedidos ativos" orders={activeOrders} />
              )}

              {deliveredOrders.length > 0 && (
                <OrderGroup title="Histórico" orders={deliveredOrders} />
              )}
            </div>
          )}

          {(qrAllowWaiterCall || qrAllowBillRequest) && (
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#E8DCCB] pt-4">
              {qrAllowWaiterCall && (
                <button
                  type="button"
                  onClick={requestWaiter}
                  disabled={isRequestingWaiter}
                  className="h-11 rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-3 text-xs font-semibold text-[#16120E] transition hover:bg-[#F7F0E7] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRequestingWaiter ? "A chamar..." : "Chamar empregado"}
                </button>
              )}

              {qrAllowBillRequest && (
                <button
                  type="button"
                  onClick={requestBill}
                  disabled={!session?.id || isRequestingBill}
                  className="h-11 rounded-full border border-[#E8D2A3] bg-[#FFF1D0] px-3 text-xs font-semibold text-[#9B6F3B] transition hover:bg-[#FFF9F0] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isRequestingBill ? "A pedir..." : "Pedir conta"}
                </button>
              )}
            </div>
          )}

          {!session?.id && (qrAllowWaiterCall || qrAllowBillRequest) && (
            <p className="mt-2 text-center text-[11px] font-medium text-[#8B8177]">
              Pode chamar o empregado antes de fazer pedido. A conta fica
              disponível depois de abrir a mesa.
            </p>
          )}
        </section>

        <section className="mt-5 space-y-4">
          {categories.map((category, index) => (
            <details key={category.id} open={index === 0} className="group">
              <summary className="mb-3 flex cursor-pointer list-none items-center justify-between rounded-[24px] border border-[#E1D0B8] bg-white px-4 py-3 shadow-[0_14px_40px_rgba(80,55,30,0.035)]">
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.05em]">
                    {category.name}
                  </h2>
                  <p className="mt-1 text-xs font-medium text-[#6B6258]">
                    {category.products.length} produto(s)
                  </p>
                </div>

                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E1D0B8] bg-[#FFF9F0] text-sm font-semibold text-[#6B6258] transition group-open:rotate-180">
                  ↓
                </span>
              </summary>

              <div className="space-y-3 pb-3">
                {category.products.map((product) => {
                  const cartItem = cart.find((item) => item.id === product.id);
                  const quantity = cartItem?.quantity || 0;

                  return (
                    <article
                      key={product.id}
                      className="rounded-[24px] border border-[#E1D0B8] bg-white p-3 shadow-[0_14px_40px_rgba(80,55,30,0.035)]"
                    >
                      <div className="flex gap-3">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                          />
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-base font-semibold tracking-[-0.035em] text-[#16120E]">
                                {product.name}
                              </p>

                              {product.description && (
                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6B6258]">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="rounded-full border border-[#E1D0B8] bg-[#F7F0E7] px-2 py-0.5 text-[9px] font-semibold text-[#6B6258]">
                              IVA {product.vatRate}%
                            </span>

                            {product.featured && (
                              <span className="rounded-full border border-[#E8D2A3] bg-[#FFF1D0] px-2 py-0.5 text-[9px] font-semibold text-[#9B6F3B]">
                                Destaque
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-4 pt-3">
                            <p className="text-2xl font-semibold text-[#16120E]">
                              {Number(product.price).toFixed(2)}€
                            </p>

                            {quantity > 0 ? (
                              <div className="flex items-center gap-2 rounded-full border border-[#E1D0B8] bg-white p-1">
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(product.id)}
                                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF0EA] text-lg font-semibold text-[#A14E36]"
                                >
                                  −
                                </button>

                                <span className="min-w-[24px] text-center font-semibold">
                                  {quantity}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => addToCart(product)}
                                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16120E] text-lg font-semibold text-white"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addToCart(product)}
                                className="rounded-full bg-[#16120E] px-5 py-3 text-sm font-semibold text-white"
                              >
                                Adicionar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </details>
          ))}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-[#E1D0B8] bg-[#F5EFE6]/95 p-4 backdrop-blur-xl">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between gap-3 rounded-full border border-[#E1D0B8] bg-white p-2 pl-5 shadow-[0_18px_55px_rgba(80,55,30,0.09)]">
            <p className="text-sm font-semibold text-[#16120E]">
              {cartCount > 0
                ? `${cartCount} item(s) · ${total.toFixed(2)}€`
                : "Carrinho vazio"}
            </p>

            <button
              type="button"
              onClick={submitOrder}
              disabled={cart.length === 0 || isSending}
              className="rounded-full bg-[#16120E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2A2118] disabled:cursor-not-allowed disabled:opacity-40"
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
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B6258]">
        {title}
      </p>

      <div className="space-y-2">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl border border-[#E8DCCB] bg-[#FFFDF8] p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase ${statusTone(
                    order.status,
                  )}`}
                >
                  {statusLabel(order.status)}
                </span>

                <span className="text-[11px] font-semibold text-[#8B8177]">
                  {orderTime(order.createdAt)}
                </span>
              </div>

              <p className="text-xs font-semibold text-[#16120E]">
                {order.items
                  .reduce((sum, item) => sum + Number(item.lineTotal || 0), 0)
                  .toFixed(2)}
                €
              </p>
            </div>

            <div className="space-y-1">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <p className="font-medium text-[#5C5348]">
                    {item.quantity}x {item.productName}
                  </p>
                  <p className="font-semibold text-[#8B8177]">
                    {Number(item.lineTotal || 0).toFixed(2)}€
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
