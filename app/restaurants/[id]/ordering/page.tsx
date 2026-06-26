import QrCodeImage from "@/components/QrCodeImage";
import OrderingAutoRefresh from "@/components/OrderingAutoRefresh";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import ProductImageUpload from "@/components/ProductImageUpload";
import OrderingLiveOrders from "@/components/OrderingLiveOrders";
import RestaurantSidebar from "@/components/RestaurantSidebar";

const TABS = [
  { key: "orders", label: "Pedidos" },
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
  Boolean(trialActive) || (subscription.status === "ACTIVE" && ["ESSENTIALS", "GROWTH"].includes(String(subscription.plan || "").toUpperCase()));

  if (!canUseQrOrdering) {
    redirect(`/billing?restaurantId=${id}`);
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
      <main className="min-h-screen bg-[#FFF9F0] p-6 text-[#16120E]">
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
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <RestaurantSidebar
  id={id}
  restaurantName={restaurant.name}
  active="QR Ordering"
/>

        <div className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <header className="border-b border-[#E1D0B8] pb-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
                  QR Ordering
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">
                    Pedidos à mesa
                  </h1>

                  <span
                    className={
                      canUseQrOrdering
                        ? "rounded-full border border-[#9CCB9B] bg-[#ECF7EC] px-3 py-1 text-xs font-semibold text-[#3F6A4D]"
                        : "rounded-full border border-[#E7B7A8] bg-[#FFF0EA] px-3 py-1 text-xs font-semibold text-[#A14E36]"
                    }
                  >
                    {qrStatusLabel}
                  </span>
                </div>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B6258]">
                  Gere o menu digital, recebe pedidos por mesa e prepara QR Codes
                  para cada zona do restaurante.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/restaurants/${id}/ordering/print?template=premium&size=medium`}
                  target="_blank"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[#E1D0B8] bg-white px-5 text-sm font-semibold text-[#16120E] transition hover:bg-[#FFF9F0]"
                >
                  Imprimir QRs
                </Link>

                <Link
                  href={`/restaurants/${id}/tables`}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#16120E] px-5 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
                >
                  Abrir sala
                </Link>
              </div>
            </div>
          </header>

          <nav className="mt-6 rounded-[26px] border border-[#E1D0B8] bg-white p-2 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
            <div className="grid gap-2 sm:grid-cols-3">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;

                return (
                  <Link
                    key={tab.key}
                    href={`/restaurants/${id}/ordering?tab=${tab.key}`}
                    className={`rounded-2xl px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] transition ${
                      isActive
                        ? "bg-[#16120E] text-white"
                        : "border border-[#E8DCCB] bg-[#FFF9F0] text-[#6B6258] hover:border-[#C8A56A] hover:bg-white hover:text-[#16120E]"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

          <section className="mt-5">
            {activeTab === "orders" && (
              <OrdersTab
                restaurantId={restaurant.id}
                sessions={restaurant.orderingTableSessions}
              />
            )}

            {activeTab === "qr" && <QrTab restaurant={restaurant} />}

            {activeTab === "settings" && <SettingsTab restaurant={restaurant} />}
          </section>
        </div>
      </div>

      <BottomNav id={id} />
    </main>
  );
}

function safeDate(value: any) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function OrdersTab({
  restaurantId,
  sessions,
}: {
  restaurantId: string;
  sessions: any[];
}) {
  const safeSessions = sessions.map((session) => ({
    id: session.id,
    restaurantId: session.restaurantId,
    tableNumber: session.tableNumber,
    status: session.status,
    subtotal: Number(session.subtotal ?? 0),
    vatTotal: Number(session.vatTotal ?? 0),
    total: Number(session.total ?? 0),
    notes: session.notes,
    createdAt: safeDate(session.createdAt),
    updatedAt: safeDate(session.updatedAt),
    openedAt: safeDate(session.openedAt),
    closedAt: safeDate(session.closedAt),
    requestedWaiterAt: safeDate(session.requestedWaiterAt),
    requestedBillAt: safeDate(session.requestedBillAt),
    orders: (session.orders || []).map((order: any) => ({
      id: order.id,
      restaurantId: order.restaurantId,
      tableNumber: order.tableNumber,
      status: order.status,
      subtotal: Number(order.subtotal ?? 0),
      vatTotal: Number(order.vatTotal ?? 0),
      total: Number(order.total ?? 0),
      notes: order.notes,
      createdAt: safeDate(order.createdAt),
      updatedAt: safeDate(order.updatedAt),
      items: (order.items || []).map((item: any) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice ?? 0),
        vatRate: Number(item.vatRate ?? 0),
        lineTotal: Number(item.lineTotal ?? 0),
      })),
    })),
  }));

  const pendingActions = safeSessions.filter(
    (session) => session.requestedWaiterAt || session.requestedBillAt
  );

  return (
    <section className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
            Pedidos
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
            Mesas com pedidos QR
          </h2>

          {pendingActions.length > 0 && (
            <p className="mt-2 text-sm font-bold text-[#A14E36]">
              {pendingActions.length} alerta(s) pendente(s)
            </p>
          )}
        </div>

        <span className="rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B6F3B]">
          Atualiza automaticamente
        </span>
      </div>

      <div className="ordering-soft-skin mt-5">
        <OrderingSoftSkin />
        <OrderingLiveOrders
          restaurantId={restaurantId}
          initialSessions={safeSessions}
        />
      </div>
    </section>
  );
}

function OrderingSoftSkin() {
  return (
    <style>{`
      .ordering-soft-skin [class*="bg-slate"],
      .ordering-soft-skin [class*="bg-\#020617"],
      .ordering-soft-skin [class*="bg-\[\#020617"],
      .ordering-soft-skin [class*="bg-gray"],
      .ordering-soft-skin [class*="bg-zinc"] {
        background: #FFF9F0 !important;
      }

      .ordering-soft-skin [class*="text-slate"],
      .ordering-soft-skin [class*="text-gray"],
      .ordering-soft-skin [class*="text-zinc"] {
        color: #6B6258 !important;
      }

      .ordering-soft-skin [class*="text-white"] {
        color: #16120E !important;
      }

      .ordering-soft-skin [class*="border-slate"],
      .ordering-soft-skin [class*="border-white"],
      .ordering-soft-skin [class*="border-cyan"] {
        border-color: #E1D0B8 !important;
      }

      .ordering-soft-skin [class*="rounded"] {
        border-radius: 24px;
      }
    `}</style>
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
        className={`h-9 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition ${
          danger
            ? "border-red-300/20 bg-[#FFF0EA] text-[#A14E36] hover:bg-[#FFE7DE]"
            : "border-[#E1D0B8] bg-[#FFF9F0] text-[#9B6F3B] hover:bg-[#FFF9F0]"
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
        <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
            Categoria
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            Criar categoria
          </h2>

          <form action={createCategory} className="mt-5 space-y-3">
            <input type="hidden" name="restaurantId" value={restaurant.id} />

            <input
              name="name"
              placeholder="Ex: Entradas, Bebidas, Sobremesas"
              className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
            />

            <input
              name="position"
              type="number"
              placeholder="Ordem da categoria"
              className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
            />

            <button className="h-12 w-full rounded-full bg-[#16120E] text-sm font-semibold text-white transition hover:opacity-90">
              Criar categoria
            </button>
          </form>
        </div>

        <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
            Produto
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            Adicionar produto
          </h2>

          <form action={createProduct} className="mt-5 space-y-3">
            <input type="hidden" name="restaurantId" value={restaurant.id} />

            <select
              name="categoryId"
              className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none focus:border-[#C8A56A]"
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
              className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
            />

            <input
              name="description"
              placeholder="Descrição curta"
              className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
            />

            <input
              name="price"
              type="number"
              step="0.01"
              placeholder="Preço"
              className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
            />

            <input
              name="sku"
              placeholder="SKU / Código interno"
              className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
            />

            <select
              name="vatRate"
              defaultValue="23"
              className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none focus:border-[#C8A56A]"
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
              className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
            />

            <input
              name="allergens"
              placeholder="Alergénios. Ex: glúten, leite, frutos secos"
              className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
            />

            <ProductImageUpload />

            <label className="flex items-center gap-3 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 py-3 text-sm font-bold text-[#6B6258]">
              <input
                name="featured"
                type="checkbox"
                className="h-4 w-4 accent-[#16120E]"
              />
              Produto em destaque
            </label>

            <button className="h-12 w-full rounded-full bg-[#16120E] text-sm font-semibold text-white transition hover:opacity-90">
              Adicionar produto
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
              Menu digital
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
              Produtos do QR Ordering
            </h2>
          </div>

          <p className="text-xs font-bold text-[#6B6258]">
            Use “abrir” para editar os produtos.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {restaurant.orderingCategories.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#E1D0B8] bg-[#FFF9F0] p-6 text-sm text-[#6B6258]">
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
      className="group rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0] p-4"
    >
      <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] text-sm font-semibold text-[#9B6F3B] transition group-open:rotate-90">
            →
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-xl font-semibold">{category.name}</h3>
            <p className="mt-0.5 text-xs font-bold text-[#6B6258]">
              Ordem {category.position} · {category.products.length} produtos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B6F3B]">
            {category.products.length} produtos
          </span>

          <span className="rounded-full border border-[#E8DCCB] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B6258]">
            Abrir
          </span>
        </div>
      </summary>

      <div className="mt-4 space-y-4 border-t border-[#E8DCCB] pt-4">
        <details className="rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] p-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-[#9B6F3B]">
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
              className="h-11 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none focus:border-[#C8A56A]"
            />

            <input
              name="position"
              type="number"
              defaultValue={category.position}
              className="h-11 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none focus:border-[#C8A56A]"
            />

            <button className="h-11 rounded-full bg-[#16120E] px-5 text-sm font-semibold text-white">
              Guardar
            </button>
          </form>
        </details>

        <div className="space-y-2">
          {category.products.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#E8DCCB] p-4 text-sm text-[#6B6258]">
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
          <summary className="inline-flex cursor-pointer list-none rounded-full border border-red-300/20 bg-[#FFF0EA] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#A14E36] transition hover:bg-[#FFE7DE]">
            Eliminar categoria
          </summary>

          <form
            action={deleteCategory}
            className="mt-3 rounded-2xl border border-red-300/20 bg-[#FFF0EA] p-4"
          >
            <input type="hidden" name="restaurantId" value={restaurantId} />
            <input type="hidden" name="categoryId" value={category.id} />

            <p className="text-sm font-bold text-[#A14E36]">
              Isto vai eliminar a categoria “{category.name}” e todos os produtos dentro dela.
            </p>

            <label className="mt-3 flex items-center gap-2 text-xs font-bold text-[#A14E36]">
              <input
                name="confirmDelete"
                type="checkbox"
                className="h-4 w-4 accent-red-400"
              />
              Confirmo que quero apagar a categoria e os produtos
            </label>

            <button className="mt-3 rounded-full border border-red-300/30 bg-red-400/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#A14E36] transition hover:bg-[#FFE7DE]">
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
          ? "border-[#E8DCCB] bg-white"
          : "border-red-300/10 bg-[#FFF0EA] opacity-70"
      }`}
    >
      <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-3 p-3 sm:grid-cols-[56px_1fr_auto]">
        <div className="hidden h-12 w-12 overflow-hidden rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] sm:block">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#9B8F82]">
              IMG
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-[#16120E]">{product.name}</p>

            {!product.active && (
              <span className="rounded-full border border-red-300/20 bg-[#FFF0EA] px-2 py-0.5 text-[9px] font-semibold uppercase text-[#A14E36]">
                Inativo
              </span>
            )}

            {product.featured && (
              <span className="rounded-full border border-yellow-300/20 bg-[#FFF9F0] px-2 py-0.5 text-[9px] font-semibold uppercase text-[#9B6F3B]">
                Destaque
              </span>
            )}
          </div>

          <p className="mt-1 truncate text-xs font-bold text-[#6B6258]">
            {product.sku ? `${product.sku} · ` : ""}
            Ordem {product.sortOrder}
            {product.allergens ? ` · Alergénios: ${product.allergens}` : ""}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold text-[#9B6F3B]">
            {Number(product.price).toFixed(2)}€
          </p>

          <span className="mt-1 inline-flex rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-2 py-0.5 text-[10px] font-semibold text-[#9B6F3B]">
            IVA {product.vatRate}%
          </span>
        </div>
      </summary>

      <div className="border-t border-[#E8DCCB] p-4">
        <form action={updateProduct} className="grid gap-3">
          <input type="hidden" name="restaurantId" value={restaurantId} />
          <input type="hidden" name="productId" value={product.id} />

          <div className="grid gap-3 lg:grid-cols-2">
            <input
              name="name"
              defaultValue={product.name}
              className="h-11 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none focus:border-[#C8A56A]"
            />

            <input
              name="description"
              defaultValue={product.description || ""}
              placeholder="Descrição"
              className="h-11 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
            />

            <input
              name="price"
              type="number"
              step="0.01"
              defaultValue={Number(product.price)}
              className="h-11 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none focus:border-[#C8A56A]"
            />

            <select
              name="vatRate"
              defaultValue={product.vatRate}
              className="h-11 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none focus:border-[#C8A56A]"
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
              className="h-11 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
            />

            <input
              name="sortOrder"
              type="number"
              defaultValue={product.sortOrder}
              placeholder="Ordem"
              className="h-11 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
            />

            <input
              name="allergens"
              defaultValue={product.allergens || ""}
              placeholder="Alergénios"
              className="h-11 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
            />

            <div className="lg:col-span-2">
              <ProductImageUpload inputName={`imageUrl-${product.id}`} />
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm font-bold text-[#6B6258]">
            <input
              name="featured"
              type="checkbox"
              defaultChecked={product.featured}
              className="h-4 w-4 accent-[#16120E]"
            />
            Produto em destaque
          </label>

          <div className="flex flex-wrap gap-2">
            <button className="h-10 rounded-full bg-[#16120E] px-5 text-xs font-semibold text-white">
              Guardar alterações
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          <form action={toggleProductActive}>
            <input type="hidden" name="restaurantId" value={restaurantId} />
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="active" value={String(product.active)} />

            <button className="h-9 rounded-full border border-[#E8DCCB] bg-white px-4 text-xs font-semibold uppercase text-[#6B6258] transition hover:border-[#C8A56A] hover:text-[#9B6F3B]">
              {product.active ? "Desativar" : "Ativar"}
            </button>
          </form>

          {product.imageUrl && (
            <form action={removeProductImage}>
              <input type="hidden" name="restaurantId" value={restaurantId} />
              <input type="hidden" name="productId" value={product.id} />

              <button className="h-9 rounded-full border border-yellow-300/20 bg-[#FFF9F0] px-4 text-xs font-semibold uppercase text-[#9B6F3B]">
                Remover imagem
              </button>
            </form>
          )}

          <details className="rounded-full">
            <summary className="flex h-9 cursor-pointer list-none items-center rounded-full border border-red-300/20 bg-[#FFF0EA] px-4 text-xs font-semibold uppercase text-[#A14E36]">
              Eliminar
            </summary>

            <form
              action={deleteProduct}
              className="mt-2 rounded-2xl border border-red-300/20 bg-[#FFF0EA] p-3"
            >
              <input type="hidden" name="restaurantId" value={restaurantId} />
              <input type="hidden" name="productId" value={product.id} />

              <label className="flex items-center gap-2 text-xs font-bold text-[#A14E36]">
                <input
                  name="confirmDelete"
                  type="checkbox"
                  className="h-4 w-4 accent-red-400"
                />
                Confirmar eliminação
              </label>

              <button className="mt-2 h-9 rounded-full border border-red-300/30 bg-red-400/20 px-4 text-xs font-semibold uppercase text-[#A14E36]">
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
    { key: "premium", name: "Premium Black" },
    { key: "minimal", name: "Minimal White" },
    { key: "mesalink", name: "MesaLink" },
  ];

  const sizes = [
    { key: "small", name: "Pequeno" },
    { key: "medium", name: "Médio" },
    { key: "large", name: "Grande" },
  ];

  return (
    <section className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
            QR Codes
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
            Gestão de QR Codes
          </h2>

          <p className="mt-2 max-w-2xl text-sm font-bold text-[#6B6258]">
            Gere mesas, escolhe template/tamanho e imprime QR Codes sem ocupar a página toda.
          </p>
        </div>

        <span className="rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B6F3B]">
          {restaurant.tables.length} mesas
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <div className="rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0] p-4">
            <h3 className="text-lg font-semibold">Adicionar mesas</h3>

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
                className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
              />

              <input
                name="capacity"
                type="number"
                min="1"
                max="50"
                defaultValue="2"
                placeholder="Capacidade padrão"
                className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
              />

              <button className="h-12 rounded-full bg-[#16120E] px-5 text-sm font-semibold text-white">
                Gerar mesas
              </button>
            </form>

            <p className="mt-3 text-xs font-bold text-[#9B8F82]">
              As mesas criadas aqui também aparecem na gestão de sala.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0] p-4">
  <h3 className="text-lg font-semibold">Impressão rápida</h3>

  <div className="mt-4 space-y-3">
    {templates.map((template) => (
      <div
        key={template.key}
        className="rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] p-4"
      >
        <div
          className={`rounded-2xl border p-4 ${
            template.key === "premium"
              ? "border-[#16120E] bg-[#16120E] text-white"
              : template.key === "minimal"
              ? "border-[#E1D0B8] bg-white text-[#16120E]"
              : "border-[#D6C3A5] bg-gradient-to-br from-[#FFFDF8] via-[#FFF9F0] to-[#EFE5D6] text-[#16120E]"
          }`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-60">
            MesaLink QR Ordering
          </p>

          <p className="mt-2 text-2xl font-semibold">Mesa 1</p>

          <div className="mt-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-xs font-semibold text-[#16120E] shadow-sm">
            QR
          </div>

          <p className="mt-3 text-xs font-bold opacity-70">
            Preview {template.name}
          </p>
        </div>

        <a
          href={`/restaurants/${restaurant.id}/ordering/print?template=${template.key}&size=medium`}
          target="_blank"
          className="mt-3 flex h-10 items-center justify-center rounded-full bg-[#16120E] text-xs font-semibold uppercase tracking-[0.14em] text-white"
        >
          Imprimir todas
        </a>
      </div>
    ))}
  </div>
</div>
        </div>

        <div className="rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0] p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Mesas QR</h3>
              <p className="mt-1 text-xs font-bold text-[#6B6258]">
                Lista compacta para restaurantes com muitas mesas.
              </p>
            </div>

            <span className="w-fit rounded-full border border-[#E8DCCB] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B6258]">
              {restaurant.tables.length} total
            </span>
          </div>

          <div className="mt-4 max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {restaurant.tables.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#E1D0B8] p-5 text-sm font-bold text-[#6B6258]">
                Ainda não tens mesas criadas.
              </div>
            ) : (
              restaurant.tables.map((table: any) => {
                const url = `${appUrl}/o/${restaurant.id}/${table.number}`;

                return (
                  <details
                    key={table.id}
                    className="rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] p-3"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#16120E]">
                          Mesa {table.number}
                        </p>
                        <p className="text-xs font-bold text-[#6B6258]">
                          {table.capacity} lugares
                        </p>
                      </div>

                      <span className="rounded-full border border-[#E8DCCB] px-3 py-1 text-[10px] font-semibold uppercase text-[#6B6258]">
                        Abrir
                      </span>
                    </summary>

                    <div className="mt-3 border-t border-[#E8DCCB] pt-3">
                      <div className="break-all rounded-xl border border-[#E8DCCB] bg-black/20 p-3 text-[10px] font-bold text-[#6B6258]">
                        {url}
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <a
                          href={url}
                          target="_blank"
                          className="flex h-10 items-center justify-center rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-3 text-xs font-semibold text-[#9B6F3B]"
                        >
                          Abrir QR
                        </a>

                        <a
                          href={`/restaurants/${restaurant.id}/ordering/print?table=${table.number}&template=premium&size=medium`}
                          target="_blank"
                          className="flex h-10 items-center justify-center rounded-full border border-violet-300/20 bg-[#FFF9F0] px-3 text-xs font-semibold text-[#9B6F3B]"
                        >
                          Imprimir
                        </a>
                      </div>

                      <details className="mt-3">
                        <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.14em] text-[#A14E36]">
                          Remover mesa
                        </summary>

                        <form
                          action={deleteQrTable}
                          className="mt-2 rounded-2xl border border-red-300/20 bg-[#FFF0EA] p-3"
                        >
                          <input type="hidden" name="restaurantId" value={restaurant.id} />
                          <input type="hidden" name="tableId" value={table.id} />

                          <label className="flex items-center gap-2 text-xs font-bold text-[#A14E36]">
                            <input
                              name="confirmDelete"
                              type="checkbox"
                              className="h-4 w-4 accent-red-400"
                            />
                            Confirmo que quero remover esta mesa
                          </label>

                          <button className="mt-2 rounded-full border border-red-300/30 bg-red-400/20 px-4 py-2 text-xs font-semibold uppercase text-[#A14E36]">
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
    <section className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
          Definições
        </p>

        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
          QR Ordering
        </h2>

        <p className="mt-2 text-sm font-bold text-[#6B6258]">
          Personaliza o comportamento do QR Ordering.
        </p>
      </div>

      <form action={saveQrSettings} className="mt-6 space-y-5">
        <input
          type="hidden"
          name="restaurantId"
          value={restaurant.id}
        />

        <label className="flex items-center justify-between rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] p-4">
          <div>
            <p className="font-semibold text-[#16120E]">
              Ativar QR Ordering
            </p>

            <p className="text-xs font-bold text-[#6B6258]">
              Permite pedidos através do QR Code.
            </p>
          </div>

          <input
            type="checkbox"
            name="qrOrderingEnabled"
            defaultChecked={restaurant.qrOrderingEnabled}
            className="h-5 w-5 accent-[#16120E]"
          />
        </label>

        <label className="flex items-center justify-between rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] p-4">
          <div>
            <p className="font-semibold text-[#16120E]">
              Permitir chamar empregado
            </p>

            <p className="text-xs font-bold text-[#6B6258]">
              Mostra o botão de assistência ao cliente.
            </p>
          </div>

          <input
            type="checkbox"
            name="qrAllowWaiterCall"
            defaultChecked={restaurant.qrAllowWaiterCall}
            className="h-5 w-5 accent-[#16120E]"
          />
        </label>

        <label className="flex items-center justify-between rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] p-4">
          <div>
            <p className="font-semibold text-[#16120E]">
              Permitir pedir conta
            </p>

            <p className="text-xs font-bold text-[#6B6258]">
              Mostra o botão para solicitar a conta.
            </p>
          </div>

          <input
            type="checkbox"
            name="qrAllowBillRequest"
            defaultChecked={restaurant.qrAllowBillRequest}
            className="h-5 w-5 accent-[#16120E]"
          />
        </label>

        <button className="h-12 rounded-full bg-[#16120E] px-6 text-sm font-semibold text-white">
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
    return "border-green-300/20 bg-[#ECF7EC] text-[#3F6A4D]";
  }

  if (status === "PREPARING" || status === "READY") {
    return "border-yellow-300/20 bg-[#FFF9F0] text-[#9B6F3B]";
  }

  if (status === "CANCELLED") {
    return "border-red-300/20 bg-[#FFF0EA] text-[#A14E36]";
  }

  return "border-[#E1D0B8] bg-[#FFF9F0] text-[#9B6F3B]";
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
    <div className="rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B6258]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold leading-none text-[#9B6F3B]">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-bold text-[#6B6258]">{sub}</p>
    </div>
  );
}
