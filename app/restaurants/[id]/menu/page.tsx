import RestaurantSidebar from "@/components/RestaurantSidebar";
import BottomNav from "@/components/BottomNav";
import ProductImageUpload from "@/components/ProductImageUpload";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

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

  if (!restaurantId || !categoryId || !name) return;

  await prisma.orderingCategory.update({
    where: { id: categoryId },
    data: {
      name,
      position,
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

  const t = await getTranslations("dashboardMenu");

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
        {t("header.notFound")}
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
          active="menu"
        />

        <div className="min-w-0 px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:py-7 lg:pb-7">
          <header className="border-b border-[#E1D0B8] pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
              {t("header.eyebrow")}
            </p>

            <div className="mt-2 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h1 className="text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">
                  {t("header.title")}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B6258]">
                  {t("header.description")}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusPill label={t("channels.qr")} value={qrProducts} />
                <StatusPill label={t("channels.website")} value={websiteProducts} />
              </div>
            </div>
          </header>

          <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label={t("metrics.categoriesLabel")} value={restaurant.orderingCategories.length} sub={t("metrics.categoriesSub")} />
            <MetricCard label={t("metrics.productsLabel")} value={totalProducts} sub={t("metrics.productsActiveSub", { count: activeProducts })} />
            <MetricCard label={t("metrics.qrOrderingLabel")} value={qrProducts} sub={t("metrics.qrOrderingSub")} />
          </section>

          <section className="mt-5 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="space-y-5">
<CreateCategoryCard restaurantId={restaurant.id} t={t} />
<CreateProductCard restaurant={restaurant} t={t} />
            </div>

            <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
                    {t("catalog.eyebrow")}
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                    {t("catalog.title")}
                  </h2>
                </div>

                <p className="text-xs font-bold text-[#6B6258]">
                  {t("catalog.note")}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {restaurant.orderingCategories.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-[#E1D0B8] bg-[#FFF9F0] p-6 text-sm text-[#6B6258]">
                    {t("catalog.emptyState")}
                  </div>
                ) : (
                  restaurant.orderingCategories.map((category, index) => (
                    <CategoryCard
  key={category.id}
  category={category}
  restaurantId={restaurant.id}
  productionCenters={restaurant.productProductionCenters}
  open={index === 0}
  t={t}
/>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <BottomNav id={id} />
    </main>
  );
}

function PrinterCard({
  restaurant,
  t,
}: {
  restaurant: any;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const printerTypes = [
    { value: "KITCHEN", label: t("printers.typeOptions.kitchen") },
    { value: "BAR", label: t("printers.typeOptions.bar") },
    { value: "ROOM", label: t("printers.typeOptions.room") },
    { value: "CASHIER", label: t("printers.typeOptions.cashier") },
    { value: "OTHER", label: t("printers.typeOptions.other") },
  ];

  const printerMethods = [
    { value: "BROWSER", label: t("printers.methodOptions.browser") },
    { value: "BRIDGE", label: t("printers.methodOptions.bridge") },
    { value: "NETWORK", label: t("printers.methodOptions.network") },
  ];

  return (
    <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
        {t("printers.eyebrow")}
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        {t("printers.title")}
      </h2>

      <form action={createPrinter} className="mt-5 space-y-3">
        <input type="hidden" name="restaurantId" value={restaurant.id} />

        <input
          name="name"
          placeholder={t("printers.namePlaceholder")}
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <select name="type" defaultValue="KITCHEN" className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E]">
            {printerTypes.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select name="method" defaultValue="BROWSER" className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E]">
            {printerMethods.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input name="ipAddress" placeholder={t("printers.ipPlaceholder")} className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E]" />
          <input name="port" type="number" placeholder={t("printers.portPlaceholder")} className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E]" />
        </div>

        <button className="h-12 w-full rounded-full bg-[#16120E] text-sm font-semibold text-white">
          {t("printers.createSubmit")}
        </button>
      </form>

      <div className="mt-5 space-y-2">
        {restaurant.printers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#E8DCCB] bg-[#FFF9F0] p-4 text-sm text-[#6B6258]">
            {t("printers.emptyState")}
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

                  <ChannelBadge label={printer.active ? t("printers.statusActive") : t("printers.statusInactive")} active={printer.active} />
                </div>
              </summary>

              <form action={updatePrinter} className="mt-4 space-y-3 border-t border-[#E8DCCB] pt-4">
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                <input type="hidden" name="printerId" value={printer.id} />

                <input name="name" defaultValue={printer.name} className="h-11 w-full rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]" />

                <div className="grid gap-3 sm:grid-cols-2">
                  <select name="type" defaultValue={printer.type} className="h-11 rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]">
                    {printerTypes.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>

                  <select name="method" defaultValue={printer.method} className="h-11 rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]">
                    {printerMethods.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="ipAddress" defaultValue={printer.ipAddress || ""} placeholder={t("printers.ipPlaceholderEdit")} className="h-11 rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]" />
                  <input name="port" type="number" defaultValue={printer.port || ""} placeholder={t("printers.portPlaceholder")} className="h-11 rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]" />
                </div>

                <label className="flex items-center justify-between rounded-2xl border border-[#E8DCCB] bg-white px-4 py-3 text-sm font-bold text-[#6B6258]">
                  <span>{t("printers.activeFieldLabel")}</span>
                  <input name="active" type="checkbox" defaultChecked={printer.active} className="h-4 w-4 accent-[#16120E]" />
                </label>

                <button className="h-10 w-full rounded-full bg-[#16120E] text-xs font-semibold text-white">
                  {t("printers.editSubmit")}
                </button>
              </form>

              <form action={deletePrinter} className="mt-3 rounded-2xl border border-red-300/20 bg-[#FFF0EA] p-3">
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                <input type="hidden" name="printerId" value={printer.id} />

                <label className="flex items-center gap-2 text-xs font-bold text-[#A14E36]">
                  <input name="confirmDelete" type="checkbox" className="h-4 w-4 accent-red-400" />
                  {t("printers.deleteConfirmLabel")}
                </label>

                <button className="mt-3 h-9 rounded-full border border-red-300/30 bg-red-400/20 px-4 text-xs font-semibold uppercase text-[#A14E36]">
                  {t("printers.deleteSubmit")}
                </button>
              </form>
            </details>
          ))
        )}
      </div>
    </div>
  );
}

function ProductionCenterCard({
  restaurant,
  t,
}: {
  restaurant: any;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
        {t("productionCenters.eyebrow")}
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        {t("productionCenters.title")}
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#6B6258]">
        {t("productionCenters.description")}
      </p>

      <form action={createProductionCenter} className="mt-5 space-y-3">
        <input type="hidden" name="restaurantId" value={restaurant.id} />

        <input
          name="name"
          placeholder={t("productionCenters.namePlaceholder")}
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
        />

       <select
  name="printerId"
  defaultValue=""
  className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E]"
>
  <option value="">{t("productionCenters.noPrinterOption")}</option>
  {restaurant.printers.map((printer: any) => (
    <option key={printer.id} value={printer.id}>
      {printer.name} · {printer.method}
    </option>
  ))}
</select>

        <input
          name="position"
          type="number"
          placeholder={t("productionCenters.positionPlaceholder")}
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
        />

        <button className="h-12 w-full rounded-full bg-[#16120E] text-sm font-semibold text-white transition hover:opacity-90">
          {t("productionCenters.createSubmit")}
        </button>
      </form>

      <div className="mt-5 space-y-2">
        {restaurant.productProductionCenters.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#E8DCCB] bg-[#FFF9F0] p-4 text-sm text-[#6B6258]">
            {t("productionCenters.emptyState")}
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
                      {t("productionCenters.printerSummary", {
                        printer: center.printer?.name || t("productionCenters.printerUndefined"),
                        position: center.position,
                      })}
                    </p>
                  </div>

                  <ChannelBadge
                    label={center.active ? t("productionCenters.statusActive") : t("productionCenters.statusInactive")}
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
  <option value="">{t("productionCenters.noPrinterOption")}</option>
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
                  <span>{t("productionCenters.activeFieldLabel")}</span>
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={center.active}
                    className="h-4 w-4 accent-[#16120E]"
                  />
                </label>

                <button className="h-10 w-full rounded-full bg-[#16120E] text-xs font-semibold text-white">
                  {t("productionCenters.editSubmit")}
                </button>
              </form>

              <details className="mt-3">
                <summary className="inline-flex cursor-pointer list-none rounded-full border border-red-300/20 bg-[#FFF0EA] px-4 py-2 text-xs font-semibold uppercase text-[#A14E36]">
                  {t("productionCenters.deleteToggle")}
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
                    {t("productionCenters.deleteWarning")}
                  </p>

                  <label className="mt-3 flex items-center gap-2 text-xs font-bold text-[#A14E36]">
                    <input
                      name="confirmDelete"
                      type="checkbox"
                      className="h-4 w-4 accent-red-400"
                    />
                    {t("productionCenters.deleteConfirmLabel")}
                  </label>

                  <button className="mt-3 h-9 rounded-full border border-red-300/30 bg-red-400/20 px-4 text-xs font-semibold uppercase text-[#A14E36]">
                    {t("productionCenters.deleteSubmit")}
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

function CreateCategoryCard({
  restaurantId,
  t,
}: {
  restaurantId: string;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
        {t("categories.createEyebrow")}
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        {t("categories.createTitle")}
      </h2>

      <form action={createCategory} className="mt-5 space-y-3">
        <input type="hidden" name="restaurantId" value={restaurantId} />

        <input
          name="name"
          placeholder={t("categories.namePlaceholder")}
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
        />

        <input
          name="position"
          type="number"
          placeholder={t("categories.positionPlaceholder")}
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
        />

        <button className="h-12 w-full rounded-full bg-[#16120E] text-sm font-semibold text-white transition hover:opacity-90">
          {t("categories.createSubmit")}
        </button>
      </form>
    </div>
  );
}

function CreateProductCard({
  restaurant,
  t,
}: {
  restaurant: any;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const vatRates = [0, 6, 13, 23];

  return (
    <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
        {t("productForm.eyebrow")}
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        {t("productForm.title")}
      </h2>

      <form action={createProduct} className="mt-5 space-y-3">
        <input type="hidden" name="restaurantId" value={restaurant.id} />

        <select
          name="categoryId"
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none focus:border-[#C8A56A]"
        >
          <option value="">{t("productForm.categoryPlaceholder")}</option>
          {restaurant.orderingCategories.map((category: any) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <input
          name="name"
          placeholder={t("productForm.namePlaceholder")}
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
        />

        <input
          name="description"
          placeholder={t("productForm.descriptionPlaceholder")}
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
        />

        <input
          name="price"
          type="number"
          step="0.01"
          placeholder={t("productForm.pricePlaceholder")}
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="sku"
            placeholder={t("productForm.skuPlaceholder")}
            className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
          />

          <select
            name="vatRate"
            defaultValue="23"
            className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none focus:border-[#C8A56A]"
          >
            {vatRates.map((rate) => (
              <option key={rate} value={rate}>{t("productForm.vatOption", { rate })}</option>
            ))}
          </select>
        </div>

        <input
          name="sortOrder"
          type="number"
          placeholder={t("productForm.sortOrderPlaceholder")}
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
        />

        <input
          name="allergens"
          placeholder={t("productForm.allergensPlaceholder")}
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-3">
  <p className="mb-2 text-xs font-bold text-[#9B6F3B]">
    {t("productForm.productionCentersLabel")}
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
            placeholder={t("productForm.printNamePlaceholder")}
            className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
          />
        </div>

        <ProductImageUpload />

        <ChannelCheckboxes
          active
          activeInOrdering
          activeOnWebsite
          featured={false}
          t={t}
        />

        <button className="h-12 w-full rounded-full bg-[#16120E] text-sm font-semibold text-white transition hover:opacity-90">
          {t("productForm.submit")}
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
  t,
}: {
  category: any;
  restaurantId: string;
  productionCenters: any[];
  open: boolean;
  t: Awaited<ReturnType<typeof getTranslations>>;
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
              {t("categories.orderSummary", {
                position: category.position,
                active: activeProducts,
                total: category.products.length,
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B6F3B]">
            {t("categories.productCount", { count: category.products.length })}
          </span>
        </div>
      </summary>

      <div className="mt-4 space-y-4 border-t border-[#E8DCCB] pt-4">
        <details className="rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] p-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-[#9B6F3B]">
            {t("categories.editToggle")}
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
              {t("categories.editSubmit")}
            </button>
          </form>
        </details>

        <div className="space-y-2">
          {category.products.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#E8DCCB] p-4 text-sm text-[#6B6258]">
              {t("categories.emptyProducts")}
            </p>
          ) : (
            category.products.map((product: any) => (
              <ProductCard
  key={product.id}
  product={product}
  restaurantId={restaurantId}
  productionCenters={productionCenters}
  t={t}
/>
            ))
          )}
        </div>

        <details className="pt-1">
          <summary className="inline-flex cursor-pointer list-none rounded-full border border-red-300/20 bg-[#FFF0EA] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#A14E36] transition hover:bg-[#FFE7DE]">
            {t("categories.deleteToggle")}
          </summary>

          <form
            action={deleteCategory}
            className="mt-3 rounded-2xl border border-red-300/20 bg-[#FFF0EA] p-4"
          >
            <input type="hidden" name="restaurantId" value={restaurantId} />
            <input type="hidden" name="categoryId" value={category.id} />

            <p className="text-sm font-bold text-[#A14E36]">
              {t("categories.deleteWarning", { name: category.name })}
            </p>

            <label className="mt-3 flex items-center gap-2 text-xs font-bold text-[#A14E36]">
              <input
                name="confirmDelete"
                type="checkbox"
                className="h-4 w-4 accent-red-400"
              />
              {t("categories.deleteConfirmLabel")}
            </label>

            <button className="mt-3 rounded-full border border-red-300/30 bg-red-400/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#A14E36] transition hover:bg-[#FFE7DE]">
              {t("categories.deleteSubmit")}
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
  t,
}: {
  product: any;
  restaurantId: string;
  productionCenters: any[];
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const vatRates = [0, 6, 13, 23];

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
              {t("productCard.noImage")}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-[#16120E]">{product.name}</p>

            {!product.active && <ChannelBadge label={t("productCard.inactiveBadge")} active={false} />}
            {product.featured && <ChannelBadge label={t("productCard.featuredBadge")} active />}
           <ChannelBadge
  label={product.productProductionCenters?.length
  ? product.productProductionCenters
  .map((p: any) => p.productionCenter.name)
  .join(", ")
  : t("productCard.noProductionCenter")}
  active={product.productProductionCenters?.length > 0}
/>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <ChannelBadge label={t("channels.qr")} active={product.activeInOrdering} />
            <ChannelBadge label={t("channels.website")} active={product.activeOnWebsite} />
          </div>

          <p className="mt-1 truncate text-xs font-bold text-[#6B6258]">
            {product.sku ? `${product.sku} · ` : ""}
            {t("productCard.orderMeta", { sortOrder: product.sortOrder })}
            {product.allergens ? ` · ${t("productCard.allergensMeta", { allergens: product.allergens })}` : ""}
            {product.printName ? ` · ${t("productCard.printNameMeta", { printName: product.printName })}` : ""}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold text-[#9B6F3B]">
            {Number(product.price).toFixed(2)}€
          </p>

          <span className="mt-1 inline-flex rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-2 py-0.5 text-[10px] font-semibold text-[#9B6F3B]">
            {t("productCard.vatBadge", { rate: product.vatRate })}
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
              placeholder={t("productCard.descriptionPlaceholder")}
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
              {vatRates.map((rate) => (
                <option key={rate} value={rate}>{t("productForm.vatOption", { rate })}</option>
              ))}
            </select>

            <input
              name="sku"
              defaultValue={product.sku || ""}
              placeholder={t("productCard.skuPlaceholder")}
              className="h-11 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
            />

            <input
              name="sortOrder"
              type="number"
              defaultValue={product.sortOrder}
              placeholder={t("productCard.orderPlaceholder")}
              className="h-11 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
            />

            <input
              name="allergens"
              defaultValue={product.allergens || ""}
              placeholder={t("productCard.allergensPlaceholder")}
              className="h-11 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
            />

           <div className="rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-3 lg:col-span-2">
  <p className="mb-2 text-xs font-bold text-[#9B6F3B]">
    {t("productForm.productionCentersLabel")}
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
  {center.printer?.name ?? t("productForm.noPrinterAssigned")}
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
              placeholder={t("productForm.printNamePlaceholder")}
              className="h-11 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
            />

            <div className="lg:col-span-2">
              <ProductImageUpload inputName={`imageUrl-${product.id}`} />
            </div>
          </div>

          <ChannelCheckboxes
            active={product.active}
            activeInOrdering={product.activeInOrdering}
            activeOnWebsite={product.activeOnWebsite}
            featured={product.featured}
            t={t}
          />

          <div className="flex flex-wrap gap-2">
            <button className="h-10 rounded-full bg-[#16120E] px-5 text-xs font-semibold text-white">
              {t("productCard.submitEdit")}
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {product.imageUrl && (
            <form action={removeProductImage}>
              <input type="hidden" name="restaurantId" value={restaurantId} />
              <input type="hidden" name="productId" value={product.id} />

              <button className="h-9 rounded-full border border-yellow-300/20 bg-[#FFF9F0] px-4 text-xs font-semibold uppercase text-[#9B6F3B]">
                {t("productCard.removeImageButton")}
              </button>
            </form>
          )}

          <details className="rounded-full">
            <summary className="flex h-9 cursor-pointer list-none items-center rounded-full border border-red-300/20 bg-[#FFF0EA] px-4 text-xs font-semibold uppercase text-[#A14E36]">
              {t("productCard.deleteToggle")}
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
                {t("productCard.deleteConfirmLabel")}
              </label>

              <button className="mt-2 h-9 rounded-full border border-red-300/30 bg-red-400/20 px-4 text-xs font-semibold uppercase text-[#A14E36]">
                {t("productCard.deleteSubmit")}
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
  activeInOrdering,
  activeOnWebsite,
  featured,
  t,
}: {
  active: boolean;
  activeInOrdering: boolean;
  activeOnWebsite: boolean;
  featured: boolean;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const options = [
    { name: "active", label: t("channelToggles.active"), checked: active },
    { name: "activeInOrdering", label: t("channelToggles.qrOrdering"), checked: activeInOrdering },
    { name: "activeOnWebsite", label: t("channelToggles.website"), checked: activeOnWebsite },
    { name: "featured", label: t("channelToggles.featured"), checked: featured },
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
