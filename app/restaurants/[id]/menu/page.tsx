import RestaurantSidebar from "@/components/RestaurantSidebar";
import ProductImageUpload from "@/components/ProductImageUpload";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function createPrinter(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "KITCHEN");
  const method = String(formData.get("method") || "BROWSER");
  const ipAddress = String(formData.get("ipAddress") || "").trim();
  const portValue = String(formData.get("port") || "").trim();

  if (!restaurantId || !name) return;

  await prisma.restaurantPrinter.create({
    data: {
      restaurantId,
      name,
      type,
      method,
      ipAddress: ipAddress || null,
      port: portValue ? Number(portValue) : null,
      active: true,
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/menu`);
}

async function updatePrinter(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const printerId = String(formData.get("printerId"));
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "KITCHEN");
  const method = String(formData.get("method") || "BROWSER");
  const ipAddress = String(formData.get("ipAddress") || "").trim();
  const portValue = String(formData.get("port") || "").trim();
  const active = String(formData.get("active")) === "on";

  if (!restaurantId || !printerId || !name) return;

  await prisma.restaurantPrinter.update({
    where: { id: printerId },
    data: {
      name,
      type,
      method,
      ipAddress: ipAddress || null,
      port: portValue ? Number(portValue) : null,
      active,
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/menu`);
}

async function deletePrinter(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const printerId = String(formData.get("printerId"));
  const confirmDelete = String(formData.get("confirmDelete") || "") === "on";

  if (!restaurantId || !printerId || !confirmDelete) return;

  await prisma.productionCenter.updateMany({
    where: { printerId },
    data: { printerId: null },
  });

  await prisma.restaurantPrinter.delete({
    where: { id: printerId },
  });

  revalidatePath(`/restaurants/${restaurantId}/menu`);
}

async function createProductionCenter(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const name = String(formData.get("name") || "").trim();
  const printerId = String(formData.get("printerId") || "") || null;
  const position = Number(formData.get("position") || 0);

  if (!restaurantId || !name) return;

  await prisma.productionCenter.create({
    data: {
      restaurantId,
      name,
      printerId,
      position,
      active: true,
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/menu`);
}

async function updateProductionCenter(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const productionCenterId = String(formData.get("productionCenterId"));
  const name = String(formData.get("name") || "").trim();
  const printerId = String(formData.get("printerId") || "") || null;
  const position = Number(formData.get("position") || 0);
  const active = String(formData.get("active")) === "on";

  if (!restaurantId || !productionCenterId || !name) return;

  await prisma.productionCenter.update({
    where: { id: productionCenterId },
    data: {
      name,
      printerId,
      position,
      active,
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/menu`);
}

async function deleteProductionCenter(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const productionCenterId = String(formData.get("productionCenterId"));
  const confirmDelete = String(formData.get("confirmDelete") || "") === "on";

  if (!restaurantId || !productionCenterId || !confirmDelete) return;

 await prisma.productProductionCenter.deleteMany({
  where: { productionCenterId },
});

  await prisma.productionCenter.delete({
    where: { id: productionCenterId },
  });

  revalidatePath(`/restaurants/${restaurantId}/menu`);
}

async function createCategory(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const name = String(formData.get("name") || "").trim();
  const position = Number(formData.get("position") || 0);

  if (!restaurantId || !name) return;

  await prisma.orderingCategory.create({
    data: {
      restaurantId,
      name,
      position,
      activeInPOS: true,
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/menu`);
}

async function updateCategory(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const categoryId = String(formData.get("categoryId"));
  const name = String(formData.get("name") || "").trim();
  const position = Number(formData.get("position") || 0);
  const activeInPOS = String(formData.get("activeInPOS")) === "on";

  if (!restaurantId || !categoryId || !name) return;

  await prisma.orderingCategory.update({
    where: { id: categoryId },
    data: {
      name,
      position,
      activeInPOS,
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/menu`);
}

async function deleteCategory(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const categoryId = String(formData.get("categoryId"));
  const confirmDelete = String(formData.get("confirmDelete") || "") === "on";

  if (!restaurantId || !categoryId || !confirmDelete) return;

  await prisma.orderingProduct.deleteMany({ where: { categoryId } });
  await prisma.orderingCategory.delete({ where: { id: categoryId } });

  revalidatePath(`/restaurants/${restaurantId}/menu`);
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
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  const productionCenterIds = formData
  .getAll("productionCenterIds")
  .map(String)
  .filter(Boolean);
  const printName = String(formData.get("printName") || "").trim();

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
      imageUrl,
     productProductionCenters: {
  create: productionCenterIds.map((productionCenterId) => ({
    productionCenterId,
  })),
},
      printName,
      featured: String(formData.get("featured")) === "on",
      active: true,
      activeInPOS: String(formData.get("activeInPOS")) === "on",
      activeInOrdering: String(formData.get("activeInOrdering")) === "on",
      activeOnWebsite: String(formData.get("activeOnWebsite")) === "on",
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/menu`);
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
  const imageUrl = String(formData.get(`imageUrl-${productId}`) || "").trim();
  const productionCenterIds = formData
  .getAll("productionCenterIds")
  .map(String)
  .filter(Boolean);
  const printName = String(formData.get("printName") || "").trim();

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
      productProductionCenters: {
  deleteMany: {},
  create: productionCenterIds.map((productionCenterId) => ({
    productionCenterId,
  })),
},
      printName,
      featured: String(formData.get("featured")) === "on",
      active: String(formData.get("active")) === "on",
      activeInPOS: String(formData.get("activeInPOS")) === "on",
      activeInOrdering: String(formData.get("activeInOrdering")) === "on",
      activeOnWebsite: String(formData.get("activeOnWebsite")) === "on",
      ...(imageUrl ? { imageUrl } : {}),
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/menu`);
}

async function deleteProduct(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const productId = String(formData.get("productId"));
  const confirmDelete = String(formData.get("confirmDelete") || "") === "on";

  if (!restaurantId || !productId || !confirmDelete) return;

  await prisma.orderingProduct.delete({ where: { id: productId } });

  revalidatePath(`/restaurants/${restaurantId}/menu`);
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

  revalidatePath(`/restaurants/${restaurantId}/menu`);
}

export default async function RestaurantMenuPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) redirect("/login");

  const { id } = await params;

 const restaurant = await prisma.restaurant.findUnique({
  where: { id },
  include: {
    printers: {
  orderBy: {
    name: "asc",
  },
},

    productProductionCenters: {
  include: {
    printer: true,
  },
  orderBy: {
    position: "asc",
  },
},

    orderingCategories: {
        orderBy: [{ position: "asc" }, { name: "asc" }],
        include: {
          products: {
  orderBy: [
    { sortOrder: "asc" },
    { name: "asc" },
  ],
  include: {
  productProductionCenters: {
    include: {
      productionCenter: true,
    },
  },
},
},
        },
      },
    },
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#F5EFE6] p-6 text-[#16120E]">
        Restaurante não encontrado
      </main>
    );
  }

  const totalProducts = restaurant.orderingCategories.reduce(
    (total, category) => total + category.products.length,
    0,
  );

  const activeProducts = restaurant.orderingCategories.reduce(
    (total, category) =>
      total + category.products.filter((product) => product.active).length,
    0,
  );

  const posProducts = restaurant.orderingCategories.reduce(
    (total, category) =>
      total + category.products.filter((product) => product.activeInPOS).length,
    0,
  );

  const qrProducts = restaurant.orderingCategories.reduce(
    (total, category) =>
      total +
      category.products.filter((product) => product.activeInOrdering).length,
    0,
  );

  const websiteProducts = restaurant.orderingCategories.reduce(
    (total, category) =>
      total +
      category.products.filter((product) => product.activeOnWebsite).length,
    0,
  );

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <RestaurantSidebar
          id={id}
          restaurantName={restaurant.name}
          active="Menu & Produtos"
        />

        <div className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <header className="border-b border-[#E1D0B8] pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
              Catálogo central
            </p>

            <div className="mt-2 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h1 className="text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">
                  Menu & Produtos
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B6258]">
                  Gere um único catálogo para o POS, QR Ordering e Website.
                  Ative ou desative cada produto por canal.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusPill label="POS" value={posProducts} />
                <StatusPill label="QR" value={qrProducts} />
                <StatusPill label="Website" value={websiteProducts} />
              </div>
            </div>
          </header>

          <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Categorias" value={restaurant.orderingCategories.length} sub="organização" />
            <MetricCard label="Produtos" value={totalProducts} sub={`${activeProducts} ativos`} />
            <MetricCard label="POS" value={posProducts} sub="visíveis no POS" />
            <MetricCard label="QR Ordering" value={qrProducts} sub="visíveis no QR" />
          </section>

          <section className="mt-5 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="space-y-5">
<CreateCategoryCard restaurantId={restaurant.id} />
<CreateProductCard restaurant={restaurant} />
            </div>

            <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
                    Catálogo
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                    Produtos do restaurante
                  </h2>
                </div>

                <p className="text-xs font-bold text-[#6B6258]">
                  POS, QR Ordering e Website usam este catálogo.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {restaurant.orderingCategories.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-[#E1D0B8] bg-[#FFF9F0] p-6 text-sm text-[#6B6258]">
                    Cria a primeira categoria para começar.
                  </div>
                ) : (
                  restaurant.orderingCategories.map((category, index) => (
                    <CategoryCard
  key={category.id}
  category={category}
  restaurantId={restaurant.id}
  productionCenters={restaurant.productProductionCenters}
  open={index === 0}
/>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function PrinterCard({ restaurant }: { restaurant: any }) {
  return (
    <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
        Impressoras
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        Impressoras do restaurante
      </h2>

      <form action={createPrinter} className="mt-5 space-y-3">
        <input type="hidden" name="restaurantId" value={restaurant.id} />

        <input
          name="name"
          placeholder="Ex: Epson Cozinha"
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <select name="type" defaultValue="KITCHEN" className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E]">
            <option value="KITCHEN">Cozinha</option>
            <option value="BAR">Bar</option>
            <option value="ROOM">Sala</option>
            <option value="CASHIER">Caixa</option>
            <option value="OTHER">Outra</option>
          </select>

          <select name="method" defaultValue="BROWSER" className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E]">
            <option value="BROWSER">Browser</option>
            <option value="BRIDGE">Print Bridge</option>
            <option value="NETWORK">Rede/IP</option>
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input name="ipAddress" placeholder="IP opcional" className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E]" />
          <input name="port" type="number" placeholder="Porta" className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E]" />
        </div>

        <button className="h-12 w-full rounded-full bg-[#16120E] text-sm font-semibold text-white">
          Criar impressora
        </button>
      </form>

      <div className="mt-5 space-y-2">
        {restaurant.printers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#E8DCCB] bg-[#FFF9F0] p-4 text-sm text-[#6B6258]">
            Ainda não tens impressoras.
          </p>
        ) : (
          restaurant.printers.map((printer: any) => (
            <details key={printer.id} className="rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] p-4">
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#16120E]">{printer.name}</p>
                    <p className="mt-1 text-xs font-semibold text-[#6B6258]">
                      {printer.type} · {printer.method}
                      {printer.ipAddress ? ` · ${printer.ipAddress}:${printer.port || ""}` : ""}
                    </p>
                  </div>

                  <ChannelBadge label={printer.active ? "Ativa" : "Inativa"} active={printer.active} />
                </div>
              </summary>

              <form action={updatePrinter} className="mt-4 space-y-3 border-t border-[#E8DCCB] pt-4">
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                <input type="hidden" name="printerId" value={printer.id} />

                <input name="name" defaultValue={printer.name} className="h-11 w-full rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]" />

                <div className="grid gap-3 sm:grid-cols-2">
                  <select name="type" defaultValue={printer.type} className="h-11 rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]">
                    <option value="KITCHEN">Cozinha</option>
                    <option value="BAR">Bar</option>
                    <option value="ROOM">Sala</option>
                    <option value="CASHIER">Caixa</option>
                    <option value="OTHER">Outra</option>
                  </select>

                  <select name="method" defaultValue={printer.method} className="h-11 rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]">
                    <option value="BROWSER">Browser</option>
                    <option value="BRIDGE">Print Bridge</option>
                    <option value="NETWORK">Rede/IP</option>
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="ipAddress" defaultValue={printer.ipAddress || ""} placeholder="IP" className="h-11 rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]" />
                  <input name="port" type="number" defaultValue={printer.port || ""} placeholder="Porta" className="h-11 rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]" />
                </div>

                <label className="flex items-center justify-between rounded-2xl border border-[#E8DCCB] bg-white px-4 py-3 text-sm font-bold text-[#6B6258]">
                  <span>Ativa</span>
                  <input name="active" type="checkbox" defaultChecked={printer.active} className="h-4 w-4 accent-[#16120E]" />
                </label>

                <button className="h-10 w-full rounded-full bg-[#16120E] text-xs font-semibold text-white">
                  Guardar impressora
                </button>
              </form>

              <form action={deletePrinter} className="mt-3 rounded-2xl border border-red-300/20 bg-[#FFF0EA] p-3">
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                <input type="hidden" name="printerId" value={printer.id} />

                <label className="flex items-center gap-2 text-xs font-bold text-[#A14E36]">
                  <input name="confirmDelete" type="checkbox" className="h-4 w-4 accent-red-400" />
                  Confirmo apagar impressora
                </label>

                <button className="mt-3 h-9 rounded-full border border-red-300/30 bg-red-400/20 px-4 text-xs font-semibold uppercase text-[#A14E36]">
                  Apagar
                </button>
              </form>
            </details>
          ))
        )}
      </div>
    </div>
  );
}

function ProductionCenterCard({ restaurant }: { restaurant: any }) {
  return (
    <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
        Produção
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        Centros de produção
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#6B6258]">
        Cria zonas como Cozinha, Bar, Sala 1 ou Cozinha 2. Depois associas cada
        produto a uma destas zonas.
      </p>

      <form action={createProductionCenter} className="mt-5 space-y-3">
        <input type="hidden" name="restaurantId" value={restaurant.id} />

        <input
          name="name"
          placeholder="Ex: Cozinha, Bar, Sala 1"
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
        />

       <select
  name="printerId"
  defaultValue=""
  className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E]"
>
  <option value="">Sem impressora</option>
  {restaurant.printers.map((printer: any) => (
    <option key={printer.id} value={printer.id}>
      {printer.name} · {printer.method}
    </option>
  ))}
</select>

        <input
          name="position"
          type="number"
          placeholder="Ordem"
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
        />

        <button className="h-12 w-full rounded-full bg-[#16120E] text-sm font-semibold text-white transition hover:opacity-90">
          Criar produção
        </button>
      </form>

      <div className="mt-5 space-y-2">
        {restaurant.productProductionCenters.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#E8DCCB] bg-[#FFF9F0] p-4 text-sm text-[#6B6258]">
            Ainda não tens centros de produção.
          </p>
        ) : (
          restaurant.productProductionCenters.map((center: any) => (
            <details
              key={center.id}
              className="rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] p-4"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#16120E]">
                      {center.name}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#6B6258]">
                      Impressora: {center.printer?.name || "Não definida"} · Ordem{" "}
                      {center.position}
                    </p>
                  </div>

                  <ChannelBadge
                    label={center.active ? "Ativa" : "Inativa"}
                    active={center.active}
                  />
                </div>
              </summary>

              <form
                action={updateProductionCenter}
                className="mt-4 space-y-3 border-t border-[#E8DCCB] pt-4"
              >
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                <input
                  type="hidden"
                  name="productionCenterId"
                  value={center.id}
                />

                <input
                  name="name"
                  defaultValue={center.name}
                  className="h-11 w-full rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E] outline-none focus:border-[#C8A56A]"
                />

                <select
  name="printerId"
  defaultValue={center.printerId || ""}
  className="h-11 w-full rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]"
>
  <option value="">Sem impressora</option>
  {restaurant.printers.map((printer: any) => (
    <option key={printer.id} value={printer.id}>
      {printer.name} · {printer.method}
    </option>
  ))}
</select>

                <input
                  name="position"
                  type="number"
                  defaultValue={center.position}
                  className="h-11 w-full rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E] outline-none focus:border-[#C8A56A]"
                />

                <label className="flex items-center justify-between rounded-2xl border border-[#E8DCCB] bg-white px-4 py-3 text-sm font-bold text-[#6B6258]">
                  <span>Ativa</span>
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={center.active}
                    className="h-4 w-4 accent-[#16120E]"
                  />
                </label>

                <button className="h-10 w-full rounded-full bg-[#16120E] text-xs font-semibold text-white">
                  Guardar produção
                </button>
              </form>

              <details className="mt-3">
                <summary className="inline-flex cursor-pointer list-none rounded-full border border-red-300/20 bg-[#FFF0EA] px-4 py-2 text-xs font-semibold uppercase text-[#A14E36]">
                  Eliminar produção
                </summary>

                <form
                  action={deleteProductionCenter}
                  className="mt-3 rounded-2xl border border-red-300/20 bg-[#FFF0EA] p-3"
                >
                  <input
                    type="hidden"
                    name="restaurantId"
                    value={restaurant.id}
                  />
                  <input
                    type="hidden"
                    name="productionCenterId"
                    value={center.id}
                  />

                  <p className="text-xs font-bold text-[#A14E36]">
                    Os produtos associados ficam sem produção.
                  </p>

                  <label className="mt-3 flex items-center gap-2 text-xs font-bold text-[#A14E36]">
                    <input
                      name="confirmDelete"
                      type="checkbox"
                      className="h-4 w-4 accent-red-400"
                    />
                    Confirmo que quero apagar
                  </label>

                  <button className="mt-3 h-9 rounded-full border border-red-300/30 bg-red-400/20 px-4 text-xs font-semibold uppercase text-[#A14E36]">
                    Apagar
                  </button>
                </form>
              </details>
            </details>
          ))
        )}
      </div>
    </div>
  );
}

function CreateCategoryCard({ restaurantId }: { restaurantId: string }) {
  return (
    <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
        Categoria
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        Criar categoria
      </h2>

      <form action={createCategory} className="mt-5 space-y-3">
        <input type="hidden" name="restaurantId" value={restaurantId} />

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
  );
}

function CreateProductCard({ restaurant }: { restaurant: any }) {
  return (
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

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="sku"
            placeholder="SKU / Código interno"
            className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
          />

          <select
            name="vatRate"
            defaultValue="23"
            className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none focus:border-[#C8A56A]"
          >
            <option value="0">IVA 0%</option>
            <option value="6">IVA 6%</option>
            <option value="13">IVA 13%</option>
            <option value="23">IVA 23%</option>
          </select>
        </div>

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

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-3">
  <p className="mb-2 text-xs font-bold text-[#9B6F3B]">
    Produções
  </p>

  <div className="space-y-2">
    {restaurant.productProductionCenters.map((center: any) => (
      <label
        key={center.id}
        className="flex items-center justify-between rounded-xl bg-white px-3 py-2"
      >
        <span className="text-sm font-bold">
          {center.name}
        </span>

        <input
          type="checkbox"
          name="productionCenterIds"
          value={center.id}
          className="h-4 w-4 accent-[#16120E]"
        />
      </label>
    ))}
  </div>
</div>

          <input
            name="printName"
            placeholder="Nome para impressão"
            className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
          />
        </div>

        <ProductImageUpload />

        <ChannelCheckboxes
          active
          activeInPOS
          activeInOrdering
          activeOnWebsite
          featured={false}
        />

        <button className="h-12 w-full rounded-full bg-[#16120E] text-sm font-semibold text-white transition hover:opacity-90">
          Adicionar produto
        </button>
      </form>
    </div>
  );
}

function CategoryCard({
  category,
  restaurantId,
  productionCenters,
  open,
}: {
  category: any;
  restaurantId: string;
  productionCenters: any[];
  open: boolean;
}) {
  const activeProducts = category.products.filter((product: any) => product.active).length;

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
              Ordem {category.position} · {activeProducts}/{category.products.length} ativos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <ChannelBadge label="POS" active={category.activeInPOS} />
          <span className="rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B6F3B]">
            {category.products.length} produtos
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

            <label className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#E1D0B8] bg-white px-4 text-xs font-bold text-[#6B6258]">
              <input
                name="activeInPOS"
                type="checkbox"
                defaultChecked={category.activeInPOS}
                className="h-4 w-4 accent-[#16120E]"
              />
              POS
            </label>

            <button className="h-11 rounded-full bg-[#16120E] px-5 text-sm font-semibold text-white sm:col-span-3">
              Guardar categoria
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
  productionCenters={productionCenters}
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
  productionCenters,
}: {
  product: any;
  restaurantId: string;
  productionCenters: any[];
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

            {!product.active && <ChannelBadge label="Inativo" active={false} />}
            {product.featured && <ChannelBadge label="Destaque" active />}
           <ChannelBadge
  label={product.productProductionCenters?.length
  ? product.productProductionCenters
  .map((p: any) => p.productionCenter.name)
  .join(", ")
  : "Sem produção"}
  active={product.productProductionCenters?.length > 0}
/>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <ChannelBadge label="POS" active={product.activeInPOS} />
            <ChannelBadge label="QR" active={product.activeInOrdering} />
            <ChannelBadge label="Website" active={product.activeOnWebsite} />
          </div>

          <p className="mt-1 truncate text-xs font-bold text-[#6B6258]">
            {product.sku ? `${product.sku} · ` : ""}
            Ordem {product.sortOrder}
            {product.allergens ? ` · Alergénios: ${product.allergens}` : ""}
            {product.printName ? ` · Impressão: ${product.printName}` : ""}
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

           <div className="rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-3 lg:col-span-2">
  <p className="mb-2 text-xs font-bold text-[#9B6F3B]">
    Produções
  </p>

  <div className="grid gap-2 sm:grid-cols-2">
    {productionCenters.map((center: any) => (
      <label
        key={center.id}
        className="flex items-center justify-between rounded-xl bg-white px-3 py-2"
      >
        <span className="text-sm font-bold">
          {center.name}
        </span>
        
        <p className="mt-1 text-xs font-semibold text-[#7D746A]">
  {center.printer?.name ?? "Sem impressora"}
</p>

        <input
          type="checkbox"
          name="productionCenterIds"
          value={center.id}
          defaultChecked={
            product.productProductionCenters?.some(
              (link: any) =>
                link.productionCenterId === center.id,
            ) ?? false
          }
          className="h-4 w-4 accent-[#16120E]"
        />
      </label>
    ))}
  </div>
</div>

            <input
              name="printName"
              defaultValue={product.printName || ""}
              placeholder="Nome para impressão"
              className="h-11 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
            />

            <div className="lg:col-span-2">
              <ProductImageUpload inputName={`imageUrl-${product.id}`} />
            </div>
          </div>

          <ChannelCheckboxes
            active={product.active}
            activeInPOS={product.activeInPOS}
            activeInOrdering={product.activeInOrdering}
            activeOnWebsite={product.activeOnWebsite}
            featured={product.featured}
          />

          <div className="flex flex-wrap gap-2">
            <button className="h-10 rounded-full bg-[#16120E] px-5 text-xs font-semibold text-white">
              Guardar alterações
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
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

function ChannelCheckboxes({
  active,
  activeInPOS,
  activeInOrdering,
  activeOnWebsite,
  featured,
}: {
  active: boolean;
  activeInPOS: boolean;
  activeInOrdering: boolean;
  activeOnWebsite: boolean;
  featured: boolean;
}) {
  const options = [
    { name: "active", label: "Ativo", checked: active },
    { name: "activeInPOS", label: "POS", checked: activeInPOS },
    { name: "activeInOrdering", label: "QR Ordering", checked: activeInOrdering },
    { name: "activeOnWebsite", label: "Website", checked: activeOnWebsite },
    { name: "featured", label: "Destaque", checked: featured },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <label
          key={option.name}
          className="flex items-center justify-between rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] px-4 py-3 text-sm font-bold text-[#6B6258]"
        >
          <span>{option.label}</span>
          <input
            name={option.name}
            type="checkbox"
            defaultChecked={option.checked}
            className="h-4 w-4 accent-[#16120E]"
          />
        </label>
      ))}
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full border border-[#E1D0B8] bg-white px-4 py-2 text-xs font-semibold text-[#6B6258]">
      <span className="text-[#9B6F3B]">{value}</span> {label}
    </span>
  );
}

function ChannelBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={
        active
          ? "rounded-full border border-[#9CCB9B] bg-[#ECF7EC] px-2 py-0.5 text-[9px] font-semibold uppercase text-[#3F6A4D]"
          : "rounded-full border border-red-300/20 bg-[#FFF0EA] px-2 py-0.5 text-[9px] font-semibold uppercase text-[#A14E36]"
      }
    >
      {label}
    </span>
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
