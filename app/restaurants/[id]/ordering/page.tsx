import QrCodeImage from "@/components/QrCodeImage";
import OrderingAutoRefresh from "@/components/OrderingAutoRefresh";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import ProductImageUpload from "@/components/ProductImageUpload";

const TABS = [
  { key: "orders", label: "Pedidos" },
  { key: "menu", label: "Menu Digital" },
  { key: "qr", label: "QR Codes" },
  { key: "settings", label: "Definições" },
] as const;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
};

async function saveQrSettings(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));

  await prisma.restaurant.update({
    where: {
      id: restaurantId,
    },
    data: {
      qrOrderingEnabled:
        String(formData.get("qrOrderingEnabled")) === "on",

      qrAllowWaiterCall:
        String(formData.get("qrAllowWaiterCall")) === "on",

      qrAllowBillRequest:
        String(formData.get("qrAllowBillRequest")) === "on",
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/ordering`);
}

async function createQrTables(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const quantity = Number(formData.get("quantity") || 0);
  const capacity = Number(formData.get("capacity") || 2);

  if (!restaurantId || !quantity || quantity < 1) return;

  const existingTables = await prisma.table.findMany({
    where: { restaurantId },
    select: { number: true },
  });

  const existingNumbers = new Set(existingTables.map((table) => table.number));

  const tablesToCreate = [];

  for (let number = 1; tablesToCreate.length < quantity; number++) {
    if (!existingNumbers.has(number)) {
      tablesToCreate.push({
        restaurantId,
        number,
        capacity,
      });
    }
  }

  await prisma.table.createMany({
    data: tablesToCreate,
  });

  revalidatePath(`/restaurants/${restaurantId}/ordering`);
}

async function deleteQrTable(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const tableId = String(formData.get("tableId"));
  const confirmDelete = String(formData.get("confirmDelete") || "") === "on";

  if (!restaurantId || !tableId || !confirmDelete) return;

  await prisma.table.delete({
    where: { id: tableId },
  });

  revalidatePath(`/restaurants/${restaurantId}/ordering`);
}

async function resolveTableAlert(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const sessionId = String(formData.get("sessionId"));
  const type = String(formData.get("type"));

  if (!restaurantId || !sessionId || !type) return;

  await prisma.orderingTableSession.update({
    where: { id: sessionId },
    data:
      type === "waiter"
        ? { requestedWaiterAt: null }
        : { requestedBillAt: null },
  });

  revalidatePath(`/restaurants/${restaurantId}/ordering`);
}

async function createCategory(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const name = String(formData.get("name") || "").trim();
  const position = Number(formData.get("position") || 0);

  if (!restaurantId || !name) return;

  await prisma.orderingCategory.create({
    data: { restaurantId, name, position },
  });

  revalidatePath(`/restaurants/${restaurantId}/ordering`);
}

async function updateCategory(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const categoryId = String(formData.get("categoryId"));
  const name = String(formData.get("name") || "").trim();
  const position = Number(formData.get("position") || 0);

  if (!restaurantId || !categoryId || !name) return;

  await prisma.orderingCategory.update({
    where: { id: categoryId },
    data: { name, position },
  });

  revalidatePath(`/restaurants/${restaurantId}/ordering`);
}

async function deleteCategory(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const categoryId = String(formData.get("categoryId"));
  const confirmDelete = String(formData.get("confirmDelete") || "") === "on";

  if (!restaurantId || !categoryId || !confirmDelete) return;

  await prisma.orderingProduct.deleteMany({ where: { categoryId } });
  await prisma.orderingCategory.delete({ where: { id: categoryId } });

  revalidatePath(`/restaurants/${restaurantId}/ordering`);
}

async function createProduct(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const categoryId = String(formData.get("categoryId"));
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = String(formData.get("price"));
  const vatRate = Number(formData.get("vatRate") || 23);
  const sku = String(formData.get("sku") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const allergens = String(formData.get("allergens") || "").trim();
  const featured = String(formData.get("featured") || "") === "on";
  const imageUrl = String(formData.get("imageUrl") || "").trim();

  if (!restaurantId || !categoryId || !name || !price) return;

  await prisma.orderingProduct.create({
    data: {
      categoryId,
      name,
      description,
      price,
      vatRate,
      sku,
      sortOrder,
      allergens,
      featured,
      imageUrl,
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/ordering`);
}

async function updateProduct(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const productId = String(formData.get("productId"));
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = String(formData.get("price"));
  const vatRate = Number(formData.get("vatRate") || 23);
  const sku = String(formData.get("sku") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const allergens = String(formData.get("allergens") || "").trim();
  const featured = String(formData.get("featured") || "") === "on";
  const imageUrl = String(formData.get(`imageUrl-${productId}`) || "").trim();

  if (!restaurantId || !productId || !name || !price) return;

  await prisma.orderingProduct.update({
    where: { id: productId },
    data: {
      name,
      description,
      price,
      vatRate,
      sku,
      sortOrder,
      allergens,
      featured,
      ...(imageUrl ? { imageUrl } : {}),
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/ordering`);
}

async function deleteProduct(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const productId = String(formData.get("productId"));
  const confirmDelete = String(formData.get("confirmDelete") || "") === "on";

  if (!restaurantId || !productId || !confirmDelete) return;

  await prisma.orderingProduct.delete({ where: { id: productId } });

  revalidatePath(`/restaurants/${restaurantId}/ordering`);
}

async function toggleProductActive(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const productId = String(formData.get("productId"));
  const active = String(formData.get("active")) === "true";

  if (!restaurantId || !productId) return;

  await prisma.orderingProduct.update({
    where: { id: productId },
    data: { active: !active },
  });

  revalidatePath(`/restaurants/${restaurantId}/ordering`);
}

async function removeProductImage(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const productId = String(formData.get("productId"));

  if (!restaurantId || !productId) return;

  await prisma.orderingProduct.update({
    where: { id: productId },
    data: { imageUrl: null },
  });

  revalidatePath(`/restaurants/${restaurantId}/ordering`);
}

async function updateOrderStatus(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const orderId = String(formData.get("orderId"));
  const status = String(formData.get("status"));

  if (!restaurantId || !orderId || !status) return;

  await prisma.orderingOrder.update({
    where: { id: orderId },
    data: { status },
  });

  revalidatePath(`/restaurants/${restaurantId}/ordering`);
}

async function closeTableSession(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const sessionId = String(formData.get("sessionId"));
  const confirmClose = String(formData.get("confirmClose") || "") === "on";

  if (!restaurantId || !sessionId || !confirmClose) return;

  await prisma.orderingTableSession.update({
    where: { id: sessionId },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/ordering`);
}

export default async function RestaurantOrderingPage({
  params,
  searchParams,
}: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { subscription: true },
  });

  if (!user) redirect("/login");

  const subscription =
    user.subscription ??
    (await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: "FREE",
        status: "TRIAL",
trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        restaurantLimit: 1,
        priceMonthly: 0,
        websiteAddon: false,
        qrOrderingAddon: false,
      },
    }));

  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const activeTab = TABS.some((tab) => tab.key === query?.tab)
    ? query.tab!
    : "orders";

  const now = new Date();

  const trialActive =
  subscription.status === "TRIAL" &&
  subscription.trialEndsAt &&
  subscription.trialEndsAt > now;

const canUseQrOrdering =
  subscription.qrOrderingAddon || Boolean(trialActive);

  if (!canUseQrOrdering) {
    redirect(`/billing?addon=qr-ordering&restaurantId=${id}`);
  }

 const qrStatusLabel = canUseQrOrdering
  ? "Ativo"
  : "Inativo";
  
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      tables: {
        orderBy: { number: "asc" },
      },
      orderingCategories: {
        orderBy: [{ position: "asc" }, { name: "asc" }],
        include: {
          products: {
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          },
        },
      },
      orderingOrders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          items: true,
        },
      },
      orderingTableSessions: {
        where: { status: "OPEN" },
        orderBy: { openedAt: "desc" },
        include: {
          orders: {
            orderBy: { createdAt: "desc" },
            include: { items: true },
          },
        },
      },
    },
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#020617] p-6 text-white">
        Restaurante não encontrado
      </main>
    );
  }

  const totalProducts = restaurant.orderingCategories.reduce(
    (total, category) => total + category.products.length,
    0
  );

  const activeProducts = restaurant.orderingCategories.reduce(
    (total, category) =>
      total + category.products.filter((product) => product.active).length,
    0
  );

  const activeOrders = restaurant.orderingTableSessions.reduce(
    (total, tableSession) =>
      total +
      tableSession.orders.filter(
        (order) => order.status !== "DELIVERED" && order.status !== "CANCELLED"
      ).length,
    0
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] pb-24 text-white">
      <Background />

      <div className="relative z-10 mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <header className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_70px_rgba(34,211,238,0.08)] backdrop-blur-xl lg:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link href={`/restaurants/${id}`} className="text-2xl font-black">
                Mesa
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Link
                </span>
              </Link>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black leading-none tracking-[-0.04em] sm:text-4xl">
                  QR Ordering
                </h1>

                <span className="rounded-full border border-green-300/20 bg-green-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-green-300">
                  {qrStatusLabel}
                </span>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Gira o menu digital, receba pedidos por mesa e prepare QR Codes
                para cada mesa.
              </p>
            </div>

            <Link
              href={`/restaurants/${id}`}
              className="w-fit rounded-full border border-cyan-300/20 bg-white/[0.04] px-4 py-2 text-sm font-black text-slate-200 transition hover:border-cyan-300/50 hover:bg-cyan-400/10 hover:text-white"
            >
              Voltar
            </Link>
          </div>
        </header>

        <nav className="rounded-[24px] border border-cyan-300/10 bg-white/[0.04] p-2 backdrop-blur-xl">
          <div className="grid gap-2 sm:grid-cols-4">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <Link
                  key={tab.key}
                  href={`/restaurants/${id}/ordering?tab=${tab.key}`}
                  className={`rounded-2xl px-4 py-3 text-center text-xs font-black uppercase tracking-[0.14em] transition ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-black"
                      : "border border-white/10 bg-[#020617]/50 text-slate-400 hover:border-cyan-300/30 hover:text-white"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Mesas abertas"
            value={restaurant.orderingTableSessions.length}
            sub="sessões QR"
          />
          <MetricCard
            label="Pedidos ativos"
            value={activeOrders}
            sub="por preparar/entregar"
          />
          <MetricCard
            label="Produtos"
            value={totalProducts}
            sub={`${activeProducts} ativos`}
          />
          <MetricCard
            label="Mesas"
            value={restaurant.tables.length}
            sub="QR Codes"
          />
        </section>

        {activeTab === "orders" && (
          <OrdersTab
            restaurantId={restaurant.id}
            sessions={restaurant.orderingTableSessions}
          />
        )}

        {activeTab === "menu" && <MenuTab restaurant={restaurant} />}

        {activeTab === "qr" && <QrTab restaurant={restaurant} />}

        {activeTab === "settings" && <SettingsTab restaurant={restaurant} />}
      </div>

      <BottomNav id={id} activeTab={activeTab} />
    </main>
  );
}

function OrdersTab({
  restaurantId,
  sessions,
}: {
  restaurantId: string;
  sessions: any[];
}) {

const pendingActions = sessions.filter(
  (session) =>
    session.requestedWaiterAt ||
    session.requestedBillAt
);

  return (
    <section className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
    Pedidos
  </p>

  <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
    Mesas com pedidos QR
  </h2>

  {pendingActions.length > 0 && (
    <div className="mt-4 rounded-3xl border border-red-400/20 bg-red-500/5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">
            Ações Pendentes
          </p>

          <p className="mt-1 text-sm font-bold text-slate-300">
            {pendingActions.length} alerta(s)
          </p>
        </div>

        <div className="h-3 w-3 rounded-full bg-red-400 animate-pulse" />
      </div>

      <div className="mt-3 space-y-2">
  {pendingActions.map((session) => (
    <div
      key={session.id}
      className="rounded-2xl border border-white/10 bg-black/20 p-3"
    >
      <p className="font-black text-white">
        Mesa {session.tableNumber}
      </p>

      {session.requestedWaiterAt && (
        <>
          <p className="mt-1 text-sm font-bold text-cyan-300">
            🔔 Chamou empregado
          </p>

          <form action={resolveTableAlert}>
  <input type="hidden" name="restaurantId" value={restaurantId} />
  <input type="hidden" name="sessionId" value={session.id} />
  <input type="hidden" name="type" value="waiter" />

  <button className="mt-2 rounded-full border border-green-300/20 bg-green-400/10 px-3 py-1 text-xs font-black text-green-300">
    Resolver
  </button>
</form>
        </>
      )}

      {session.requestedBillAt && (
        <>
          <p className="mt-3 text-sm font-bold text-yellow-300">
            🧾 Pediu conta
          </p>

          <form action={resolveTableAlert}>
  <input
    type="hidden"
    name="restaurantId"
    value={restaurantId}
  />

  <input
    type="hidden"
    name="sessionId"
    value={session.id}
  />

  <input
    type="hidden"
    name="type"
    value="bill"
  />

  <button
    className="mt-2 rounded-full border border-green-300/20 bg-green-400/10 px-3 py-1 text-xs font-black text-green-300"
  >
    Resolver
  </button>
</form>
        </>
      )}
    </div>
  ))}
</div>
    </div>
  )}
</div>

        <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">
          {sessions.length} mesas abertas
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {sessions.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-cyan-300/15 bg-[#020617]/60 p-6 text-sm text-slate-400">
            Ainda não há pedidos QR ativos.
          </div>
        ) : (
          sessions.map((tableSession) => (
            <details
              key={tableSession.id}
              open
              className={`rounded-[24px] border p-4 ${
  tableSession.requestedWaiterAt ||
  tableSession.requestedBillAt
    ? "border-red-400/30 bg-red-500/5"
    : "border-cyan-300/10 bg-[#020617]/60"
}`}
            >
              <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-2xl font-black tracking-[-0.04em]">
                    Mesa {tableSession.tableNumber}
                  </h3>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    Aberta às {formatTime(tableSession.openedAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">
                    {tableSession.orders.length} pedidos
                  </span>

                  {tableSession.requestedWaiterAt && (
  <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">
    CHAMOU EMPREGADO
  </span>
)}

{tableSession.requestedBillAt && (
  <span className="rounded-full border border-yellow-300/20 bg-yellow-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-yellow-300">
    PEDIU CONTA
  </span>
)}

                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300">
                    Abrir
                  </span>
                </div>
              </summary>

              <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                {tableSession.orders.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
                    Esta mesa ainda não tem pedidos.
                  </p>
                ) : (
                  tableSession.orders.map((order: any) => (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${statusClass(
                                order.status
                              )}`}
                            >
                              {statusLabel(order.status)}
                            </span>

                            <span className="text-xs font-bold text-slate-500">
                              {formatTime(order.createdAt)}
                            </span>
                          </div>

                          <div className="mt-3 space-y-1">
                            {order.items.map((item: any) => (
                              <div
                                key={item.id}
                                className="flex max-w-lg items-center justify-between gap-8 text-sm"
                              >
                                <p className="font-black text-white">
                                  {item.quantity}x {item.productName}
                                </p>
                                <p className="font-black text-slate-500">
                                  {Number(item.lineTotal).toFixed(2)}€
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <p className="text-xl font-black text-cyan-300">
                          {Number(order.total).toFixed(2)}€
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {order.status !== "PREPARING" &&
                          order.status !== "DELIVERED" &&
                          order.status !== "CANCELLED" && (
                            <OrderStatusButton
                              restaurantId={restaurantId}
                              orderId={order.id}
                              status="PREPARING"
                            >
                              Preparar
                            </OrderStatusButton>
                          )}

                        {order.status !== "DELIVERED" &&
                          order.status !== "CANCELLED" && (
                            <OrderStatusButton
                              restaurantId={restaurantId}
                              orderId={order.id}
                              status="DELIVERED"
                            >
                              Entregue
                            </OrderStatusButton>
                          )}

                        {order.status !== "CANCELLED" &&
                          order.status !== "DELIVERED" && (
                            <OrderStatusButton
                              restaurantId={restaurantId}
                              orderId={order.id}
                              status="CANCELLED"
                              danger
                            >
                              Cancelar
                            </OrderStatusButton>
                          )}
                      </div>
                    </div>
                  ))
                )}

                <details className="pt-2">
                  <summary className="inline-flex cursor-pointer list-none rounded-full border border-yellow-300/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-300">
                    Terminar mesa
                  </summary>

                  <form
                    action={closeTableSession}
                    className="mt-3 rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-4"
                  >
                    <input type="hidden" name="restaurantId" value={restaurantId} />
                    <input type="hidden" name="sessionId" value={tableSession.id} />

                    <p className="text-sm font-bold text-yellow-100">
                      Isto fecha a sessão da Mesa {tableSession.tableNumber}. O
                      cliente deixa de ver o histórico atual e o próximo pedido
                      abre uma nova sessão.
                    </p>

                    <label className="mt-3 flex items-center gap-2 text-xs font-bold text-yellow-100">
                      <input
                        name="confirmClose"
                        type="checkbox"
                        className="h-4 w-4 accent-yellow-300"
                      />
                      Confirmo que quero terminar esta mesa
                    </label>

                    <button className="mt-3 rounded-full border border-yellow-300/30 bg-yellow-400/20 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100">
                      Terminar mesa
                    </button>
                  </form>
                </details>
              </div>
            </details>
          ))
        )}
      </div>
    </section>
  );
}

function OrderStatusButton({
  restaurantId,
  orderId,
  status,
  danger,
  children,
}: {
  restaurantId: string;
  orderId: string;
  status: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <form action={updateOrderStatus}>
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="status" value={status} />

      <button
        className={`h-9 rounded-full border px-4 text-xs font-black uppercase tracking-[0.14em] transition ${
          danger
            ? "border-red-300/20 bg-red-400/10 text-red-300 hover:bg-red-400/20"
            : "border-cyan-300/20 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20"
        }`}
      >
        {children}
      </button>
    </form>
  );
}

function MenuTab({ restaurant }: { restaurant: any }) {
  return (
    <section className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
      <div className="space-y-5">
        <div className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
            Categoria
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
            Criar categoria
          </h2>

          <form action={createCategory} className="mt-5 space-y-3">
            <input type="hidden" name="restaurantId" value={restaurant.id} />

            <input
              name="name"
              placeholder="Ex: Entradas, Bebidas, Sobremesas"
              className="h-12 w-full rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
            />

            <input
              name="position"
              type="number"
              placeholder="Ordem da categoria"
              className="h-12 w-full rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
            />

            <button className="h-12 w-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-sm font-black text-black transition hover:opacity-90">
              Criar categoria
            </button>
          </form>
        </div>

        <div className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
            Produto
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
            Adicionar produto
          </h2>

          <form action={createProduct} className="mt-5 space-y-3">
            <input type="hidden" name="restaurantId" value={restaurant.id} />

            <select
              name="categoryId"
              className="h-12 w-full rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none focus:border-cyan-300/40"
            >
              <option value="">Escolher categoria</option>
              {restaurant.orderingCategories.map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <input
              name="name"
              placeholder="Nome do produto"
              className="h-12 w-full rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
            />

            <input
              name="description"
              placeholder="Descrição curta"
              className="h-12 w-full rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
            />

            <input
              name="price"
              type="number"
              step="0.01"
              placeholder="Preço"
              className="h-12 w-full rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
            />

            <input
              name="sku"
              placeholder="SKU / Código interno"
              className="h-12 w-full rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
            />

            <select
              name="vatRate"
              defaultValue="23"
              className="h-12 w-full rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none focus:border-cyan-300/40"
            >
              <option value="0">IVA 0%</option>
              <option value="6">IVA 6%</option>
              <option value="13">IVA 13%</option>
              <option value="23">IVA 23%</option>
            </select>

            <input
              name="sortOrder"
              type="number"
              placeholder="Ordem no menu"
              className="h-12 w-full rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
            />

            <input
              name="allergens"
              placeholder="Alergénios. Ex: glúten, leite, frutos secos"
              className="h-12 w-full rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
            />

            <ProductImageUpload />

            <label className="flex items-center gap-3 rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 py-3 text-sm font-bold text-slate-300">
              <input
                name="featured"
                type="checkbox"
                className="h-4 w-4 accent-cyan-300"
              />
              Produto em destaque
            </label>

            <button className="h-12 w-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-sm font-black text-black transition hover:opacity-90">
              Adicionar produto
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
              Menu digital
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
              Produtos do QR Ordering
            </h2>
          </div>

          <p className="text-xs font-bold text-slate-500">
            Use “abrir” para editar os produtos.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {restaurant.orderingCategories.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-cyan-300/15 bg-[#020617]/60 p-6 text-sm text-slate-400">
              Cria a primeira categoria para começar o menu digital.
            </div>
          ) : (
            restaurant.orderingCategories.map((category: any, index: number) => (
              <CategoryCard
                key={category.id}
                category={category}
                restaurantId={restaurant.id}
                open={index === 0}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({
  category,
  restaurantId,
  open,
}: {
  category: any;
  restaurantId: string;
  open: boolean;
}) {
  return (
    <details
      open={open}
      className="group rounded-[24px] border border-cyan-300/10 bg-[#020617]/60 p-4"
    >
      <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-sm font-black text-cyan-300 transition group-open:rotate-90">
            →
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-xl font-black">{category.name}</h3>
            <p className="mt-0.5 text-xs font-bold text-slate-500">
              Ordem {category.position} · {category.products.length} produtos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">
            {category.products.length} produtos
          </span>

          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300">
            Abrir
          </span>
        </div>
      </summary>

      <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
        <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <summary className="cursor-pointer list-none text-sm font-black text-cyan-300">
            Editar categoria
          </summary>

          <form
            action={updateCategory}
            className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px_auto]"
          >
            <input type="hidden" name="restaurantId" value={restaurantId} />
            <input type="hidden" name="categoryId" value={category.id} />

            <input
              name="name"
              defaultValue={category.name}
              className="h-11 rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none focus:border-cyan-300/40"
            />

            <input
              name="position"
              type="number"
              defaultValue={category.position}
              className="h-11 rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none focus:border-cyan-300/40"
            />

            <button className="h-11 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 text-sm font-black text-black">
              Guardar
            </button>
          </form>
        </details>

        <div className="space-y-2">
          {category.products.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
              Ainda sem produtos.
            </p>
          ) : (
            category.products.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                restaurantId={restaurantId}
              />
            ))
          )}
        </div>

        <details className="pt-1">
          <summary className="inline-flex cursor-pointer list-none rounded-full border border-red-300/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-300 transition hover:bg-red-400/20">
            Eliminar categoria
          </summary>

          <form
            action={deleteCategory}
            className="mt-3 rounded-2xl border border-red-300/20 bg-red-400/10 p-4"
          >
            <input type="hidden" name="restaurantId" value={restaurantId} />
            <input type="hidden" name="categoryId" value={category.id} />

            <p className="text-sm font-bold text-red-100">
              Isto vai eliminar a categoria “{category.name}” e todos os produtos dentro dela.
            </p>

            <label className="mt-3 flex items-center gap-2 text-xs font-bold text-red-200">
              <input
                name="confirmDelete"
                type="checkbox"
                className="h-4 w-4 accent-red-400"
              />
              Confirmo que quero apagar a categoria e os produtos
            </label>

            <button className="mt-3 rounded-full border border-red-300/30 bg-red-400/20 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-200 transition hover:bg-red-400/30">
              Apagar definitivamente
            </button>
          </form>
        </details>
      </div>
    </details>
  );
}

function ProductCard({
  product,
  restaurantId,
}: {
  product: any;
  restaurantId: string;
}) {
  return (
    <details
      className={`rounded-2xl border ${
        product.active
          ? "border-white/10 bg-white/[0.04]"
          : "border-red-300/10 bg-red-400/[0.04] opacity-70"
      }`}
    >
      <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-3 p-3 sm:grid-cols-[56px_1fr_auto]">
        <div className="hidden h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-[#020617]/70 sm:block">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-black text-slate-600">
              IMG
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-black text-white">{product.name}</p>

            {!product.active && (
              <span className="rounded-full border border-red-300/20 bg-red-400/10 px-2 py-0.5 text-[9px] font-black uppercase text-red-300">
                Inativo
              </span>
            )}

            {product.featured && (
              <span className="rounded-full border border-yellow-300/20 bg-yellow-400/10 px-2 py-0.5 text-[9px] font-black uppercase text-yellow-300">
                Destaque
              </span>
            )}
          </div>

          <p className="mt-1 truncate text-xs font-bold text-slate-500">
            {product.sku ? `${product.sku} · ` : ""}
            Ordem {product.sortOrder}
            {product.allergens ? ` · Alergénios: ${product.allergens}` : ""}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg font-black text-cyan-300">
            {Number(product.price).toFixed(2)}€
          </p>

          <span className="mt-1 inline-flex rounded-full border border-cyan-300/15 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-black text-cyan-300">
            IVA {product.vatRate}%
          </span>
        </div>
      </summary>

      <div className="border-t border-white/10 p-4">
        <form action={updateProduct} className="grid gap-3">
          <input type="hidden" name="restaurantId" value={restaurantId} />
          <input type="hidden" name="productId" value={product.id} />

          <div className="grid gap-3 lg:grid-cols-2">
            <input
              name="name"
              defaultValue={product.name}
              className="h-11 rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none focus:border-cyan-300/40"
            />

            <input
              name="description"
              defaultValue={product.description || ""}
              placeholder="Descrição"
              className="h-11 rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
            />

            <input
              name="price"
              type="number"
              step="0.01"
              defaultValue={Number(product.price)}
              className="h-11 rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none focus:border-cyan-300/40"
            />

            <select
              name="vatRate"
              defaultValue={product.vatRate}
              className="h-11 rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none focus:border-cyan-300/40"
            >
              <option value="0">IVA 0%</option>
              <option value="6">IVA 6%</option>
              <option value="13">IVA 13%</option>
              <option value="23">IVA 23%</option>
            </select>

            <input
              name="sku"
              defaultValue={product.sku || ""}
              placeholder="SKU"
              className="h-11 rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
            />

            <input
              name="sortOrder"
              type="number"
              defaultValue={product.sortOrder}
              placeholder="Ordem"
              className="h-11 rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
            />

            <input
              name="allergens"
              defaultValue={product.allergens || ""}
              placeholder="Alergénios"
              className="h-11 rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
            />

            <div className="lg:col-span-2">
              <ProductImageUpload inputName={`imageUrl-${product.id}`} />
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm font-bold text-slate-300">
            <input
              name="featured"
              type="checkbox"
              defaultChecked={product.featured}
              className="h-4 w-4 accent-cyan-300"
            />
            Produto em destaque
          </label>

          <div className="flex flex-wrap gap-2">
            <button className="h-10 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 text-xs font-black text-black">
              Guardar alterações
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          <form action={toggleProductActive}>
            <input type="hidden" name="restaurantId" value={restaurantId} />
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="active" value={String(product.active)} />

            <button className="h-9 rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-black uppercase text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-300">
              {product.active ? "Desativar" : "Ativar"}
            </button>
          </form>

          {product.imageUrl && (
            <form action={removeProductImage}>
              <input type="hidden" name="restaurantId" value={restaurantId} />
              <input type="hidden" name="productId" value={product.id} />

              <button className="h-9 rounded-full border border-yellow-300/20 bg-yellow-400/10 px-4 text-xs font-black uppercase text-yellow-300">
                Remover imagem
              </button>
            </form>
          )}

          <details className="rounded-full">
            <summary className="flex h-9 cursor-pointer list-none items-center rounded-full border border-red-300/20 bg-red-400/10 px-4 text-xs font-black uppercase text-red-300">
              Eliminar
            </summary>

            <form
              action={deleteProduct}
              className="mt-2 rounded-2xl border border-red-300/20 bg-red-400/10 p-3"
            >
              <input type="hidden" name="restaurantId" value={restaurantId} />
              <input type="hidden" name="productId" value={product.id} />

              <label className="flex items-center gap-2 text-xs font-bold text-red-200">
                <input
                  name="confirmDelete"
                  type="checkbox"
                  className="h-4 w-4 accent-red-400"
                />
                Confirmar eliminação
              </label>

              <button className="mt-2 h-9 rounded-full border border-red-300/30 bg-red-400/20 px-4 text-xs font-black uppercase text-red-200">
                Eliminar produto
              </button>
            </form>
          </details>
        </div>
      </div>
    </details>
  );
}

function QrTab({ restaurant }: { restaurant: any }) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  const templates = [
    { key: "premium", name: "Premium Dark" },
    { key: "minimal", name: "Minimal White" },
    { key: "mesalink", name: "MesaLink" },
  ];

  const sizes = [
    { key: "small", name: "Pequeno" },
    { key: "medium", name: "Médio" },
    { key: "large", name: "Grande" },
  ];

  return (
    <section className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
            QR Codes
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
            Gestão de QR Codes
          </h2>

          <p className="mt-2 max-w-2xl text-sm font-bold text-slate-500">
            Gere mesas, escolhe template/tamanho e imprime QR Codes sem ocupar a página toda.
          </p>
        </div>

        <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">
          {restaurant.tables.length} mesas
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <div className="rounded-[24px] border border-cyan-300/10 bg-[#020617]/60 p-4">
            <h3 className="text-lg font-black">Adicionar mesas</h3>

            <form
              action={createQrTables}
              className="mt-4 grid gap-3"
            >
              <input type="hidden" name="restaurantId" value={restaurant.id} />

              <input
                name="quantity"
                type="number"
                min="1"
                max="100"
                defaultValue="10"
                placeholder="Quantidade"
                className="h-12 rounded-2xl border border-cyan-300/10 bg-[#020617]/80 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              />

              <input
                name="capacity"
                type="number"
                min="1"
                max="50"
                defaultValue="2"
                placeholder="Capacidade padrão"
                className="h-12 rounded-2xl border border-cyan-300/10 bg-[#020617]/80 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              />

              <button className="h-12 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 text-sm font-black text-black">
                Gerar mesas
              </button>
            </form>

            <p className="mt-3 text-xs font-bold text-slate-600">
              As mesas criadas aqui também aparecem na gestão de sala.
            </p>
          </div>

          <div className="rounded-[24px] border border-cyan-300/10 bg-[#020617]/60 p-4">
  <h3 className="text-lg font-black">Impressão rápida</h3>

  <div className="mt-4 space-y-3">
    {templates.map((template) => (
      <div
        key={template.key}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
      >
        <div
          className={`rounded-2xl border p-4 ${
            template.key === "premium"
              ? "border-cyan-300/20 bg-[#020617] text-white"
              : template.key === "minimal"
              ? "border-slate-200 bg-white text-black"
              : "border-violet-300/20 bg-gradient-to-br from-[#020617] via-[#06111f] to-[#1b1035] text-white"
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
            MesaLink QR Ordering
          </p>

          <p className="mt-2 text-2xl font-black">Mesa 1</p>

          <div className="mt-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-xs font-black text-black">
            QR
          </div>

          <p className="mt-3 text-xs font-bold opacity-70">
            Preview {template.name}
          </p>
        </div>

        <a
          href={`/restaurants/${restaurant.id}/ordering/print?template=${template.key}&size=medium`}
          target="_blank"
          className="mt-3 flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-xs font-black uppercase tracking-[0.14em] text-black"
        >
          Imprimir todas
        </a>
      </div>
    ))}
  </div>
</div>
        </div>

        <div className="rounded-[24px] border border-cyan-300/10 bg-[#020617]/60 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-black">Mesas QR</h3>
              <p className="mt-1 text-xs font-bold text-slate-500">
                Lista compacta para restaurantes com muitas mesas.
              </p>
            </div>

            <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300">
              {restaurant.tables.length} total
            </span>
          </div>

          <div className="mt-4 max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {restaurant.tables.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-cyan-300/15 p-5 text-sm font-bold text-slate-500">
                Ainda não tens mesas criadas.
              </div>
            ) : (
              restaurant.tables.map((table: any) => {
                const url = `${appUrl}/o/${restaurant.id}/${table.number}`;

                return (
                  <details
                    key={table.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-white">
                          Mesa {table.number}
                        </p>
                        <p className="text-xs font-bold text-slate-500">
                          {table.capacity} lugares
                        </p>
                      </div>

                      <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase text-slate-300">
                        Abrir
                      </span>
                    </summary>

                    <div className="mt-3 border-t border-white/10 pt-3">
                      <div className="break-all rounded-xl border border-white/10 bg-black/20 p-3 text-[10px] font-bold text-slate-500">
                        {url}
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <a
                          href={url}
                          target="_blank"
                          className="flex h-10 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 text-xs font-black text-cyan-300"
                        >
                          Abrir QR
                        </a>

                        <a
                          href={`/restaurants/${restaurant.id}/ordering/print?table=${table.number}&template=premium&size=medium`}
                          target="_blank"
                          className="flex h-10 items-center justify-center rounded-full border border-violet-300/20 bg-violet-400/10 px-3 text-xs font-black text-violet-300"
                        >
                          Imprimir
                        </a>
                      </div>

                      <details className="mt-3">
                        <summary className="cursor-pointer list-none text-xs font-black uppercase tracking-[0.14em] text-red-300">
                          Remover mesa
                        </summary>

                        <form
                          action={deleteQrTable}
                          className="mt-2 rounded-2xl border border-red-300/20 bg-red-400/10 p-3"
                        >
                          <input type="hidden" name="restaurantId" value={restaurant.id} />
                          <input type="hidden" name="tableId" value={table.id} />

                          <label className="flex items-center gap-2 text-xs font-bold text-red-200">
                            <input
                              name="confirmDelete"
                              type="checkbox"
                              className="h-4 w-4 accent-red-400"
                            />
                            Confirmo que quero remover esta mesa
                          </label>

                          <button className="mt-2 rounded-full border border-red-300/30 bg-red-400/20 px-4 py-2 text-xs font-black uppercase text-red-200">
                            Remover
                          </button>
                        </form>
                      </details>
                    </div>
                  </details>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SettingsTab({ restaurant }: { restaurant: any }) {
  return (
    <section className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
          Definições
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
          QR Ordering
        </h2>

        <p className="mt-2 text-sm font-bold text-slate-500">
          Personaliza o comportamento do QR Ordering.
        </p>
      </div>

      <form action={saveQrSettings} className="mt-6 space-y-5">
        <input
          type="hidden"
          name="restaurantId"
          value={restaurant.id}
        />

        <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div>
            <p className="font-black text-white">
              Ativar QR Ordering
            </p>

            <p className="text-xs font-bold text-slate-500">
              Permite pedidos através do QR Code.
            </p>
          </div>

          <input
            type="checkbox"
            name="qrOrderingEnabled"
            defaultChecked={restaurant.qrOrderingEnabled}
            className="h-5 w-5 accent-cyan-400"
          />
        </label>

        <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div>
            <p className="font-black text-white">
              Permitir chamar empregado
            </p>

            <p className="text-xs font-bold text-slate-500">
              Mostra o botão de assistência ao cliente.
            </p>
          </div>

          <input
            type="checkbox"
            name="qrAllowWaiterCall"
            defaultChecked={restaurant.qrAllowWaiterCall}
            className="h-5 w-5 accent-cyan-400"
          />
        </label>

        <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div>
            <p className="font-black text-white">
              Permitir pedir conta
            </p>

            <p className="text-xs font-bold text-slate-500">
              Mostra o botão para solicitar a conta.
            </p>
          </div>

          <input
            type="checkbox"
            name="qrAllowBillRequest"
            defaultChecked={restaurant.qrAllowBillRequest}
            className="h-5 w-5 accent-cyan-400"
          />
        </label>

        <button className="h-12 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-6 text-sm font-black text-black">
          Guardar definições
        </button>
      </form>
    </section>
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

function formatTime(value: Date | string) {
  return new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute left-1/2 top-[-180px] h-[430px] w-[430px] -translate-x-1/2 rounded-full bg-cyan-500/18 blur-[110px]" />
      <div className="absolute right-[-160px] top-[360px] h-[330px] w-[330px] rounded-full bg-violet-500/16 blur-[100px]" />
      <div className="absolute bottom-[-160px] left-[-160px] h-[330px] w-[330px] rounded-full bg-blue-500/12 blur-[100px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.12),transparent_35%),linear-gradient(to_bottom,#020617,#050816_35%,#020617)]" />
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-[#020617]/60 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black leading-none text-cyan-300">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-bold text-slate-500">{sub}</p>
    </div>
  );
}

function BottomNav({ id, activeTab }: { id: string; activeTab: string }) {
  const items = [
    { key: "orders", href: `/restaurants/${id}/ordering?tab=orders`, icon: "📲", label: "Pedidos" },
    { key: "menu", href: `/restaurants/${id}/ordering?tab=menu`, icon: "☰", label: "Menu" },
    { key: "qr", href: `/restaurants/${id}/ordering?tab=qr`, icon: "▦", label: "QR" },
    { key: "tables", href: `/restaurants/${id}/tables`, icon: "▦", label: "Sala" },
    { key: "home", href: `/restaurants/${id}`, icon: "⌂", label: "Home" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-cyan-300/10 bg-[#020617]/90 px-4 py-3 backdrop-blur-2xl lg:hidden">
      <div className="grid grid-cols-5 text-center text-xs font-bold text-slate-400">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={activeTab === item.key ? "text-cyan-300" : ""}
          >
            <p className="text-xl">{item.icon}</p>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
