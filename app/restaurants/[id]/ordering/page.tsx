import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { canAccessApp } from "@/lib/check-subscription";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import ProductImageUpload from "@/components/ProductImageUpload";

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
    },
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
    data: {
      name,
      position,
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/ordering`);
}

async function deleteCategory(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const categoryId = String(formData.get("categoryId"));
  const confirmDelete = String(formData.get("confirmDelete") || "") === "on";

  if (!restaurantId || !categoryId || !confirmDelete) return;

  await prisma.orderingProduct.deleteMany({
    where: { categoryId },
  });

  await prisma.orderingCategory.delete({
    where: { id: categoryId },
  });

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

  await prisma.orderingProduct.delete({
    where: { id: productId },
  });

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
    data: {
      active: !active,
    },
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
    data: {
      imageUrl: null,
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/ordering`);
}

export default async function RestaurantOrderingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) redirect("/login");

  const hasAccess = await canAccessApp(session.user.email);
  if (!hasAccess) redirect("/billing");

  const { id } = await params;

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
                  MVP ativo
                </span>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Crie o menu digital, prepare QR Codes por mesa e receba pedidos
                diretamente no dashboard.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/restaurants/${id}`}
                className="rounded-full border border-cyan-300/20 bg-white/[0.04] px-4 py-2 text-sm font-black text-slate-200 transition hover:border-cyan-300/50 hover:bg-cyan-400/10 hover:text-white"
              >
                Voltar
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Categorias"
            value={restaurant.orderingCategories.length}
            sub="menu digital"
          />
          <MetricCard
            label="Produtos"
            value={totalProducts}
            sub={`${activeProducts} ativos`}
          />
          <MetricCard
            label="Mesas"
            value={restaurant.tables.length}
            sub="QR futuro"
          />
          <MetricCard
            label="Pedidos"
            value={restaurant.orderingOrders.length}
            sub="últimos pedidos"
          />
        </section>

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

              <form
                action={createProduct}
                className="mt-5 space-y-3"
               
              >
                <input type="hidden" name="restaurantId" value={restaurant.id} />

                <select
                  name="categoryId"
                  className="h-12 w-full rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-sm font-bold text-white outline-none focus:border-cyan-300/40"
                >
                  <option value="">Escolher categoria</option>
                  {restaurant.orderingCategories.map((category) => (
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
                Use “abrir” para ver produtos da categoria.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {restaurant.orderingCategories.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-cyan-300/15 bg-[#020617]/60 p-6 text-sm text-slate-400">
                  Cria a primeira categoria para começar o menu digital.
                </div>
              ) : (
                restaurant.orderingCategories.map((category, index) => (
                  <details
                    key={category.id}
                    open={index === 0}
                    className="group rounded-[24px] border border-cyan-300/10 bg-[#020617]/60 p-4"
                  >
                    <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-sm font-black text-cyan-300 transition group-open:rotate-90">
                          →
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-xl font-black">
                            {category.name}
                          </h3>
                          <p className="mt-0.5 text-xs font-bold text-slate-500">
                            Ordem {category.position} · {category.products.length}{" "}
                            produtos
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
                          <input
                            type="hidden"
                            name="restaurantId"
                            value={restaurant.id}
                          />
                          <input
                            type="hidden"
                            name="categoryId"
                            value={category.id}
                          />

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
                          category.products.map((product) => (
                            <details
                              key={product.id}
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
                                    <p className="truncate font-black text-white">
                                      {product.name}
                                    </p>

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
                                    {product.allergens
                                      ? ` · Alergénios: ${product.allergens}`
                                      : ""}
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
                                <form
                                  action={updateProduct}
                                  className="grid gap-3"
                                >
                                  <input
                                    type="hidden"
                                    name="restaurantId"
                                    value={restaurant.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="productId"
                                    value={product.id}
                                  />

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
                                      <ProductImageUpload
                                        inputName={`imageUrl-${product.id}`}
                                      />
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
                                    <input
                                      type="hidden"
                                      name="restaurantId"
                                      value={restaurant.id}
                                    />
                                    <input
                                      type="hidden"
                                      name="productId"
                                      value={product.id}
                                    />
                                    <input
                                      type="hidden"
                                      name="active"
                                      value={String(product.active)}
                                    />

                                    <button className="h-9 rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-black uppercase text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-300">
                                      {product.active ? "Desativar" : "Ativar"}
                                    </button>
                                  </form>

                                  {product.imageUrl && (
                                    <form action={removeProductImage}>
                                      <input
                                        type="hidden"
                                        name="restaurantId"
                                        value={restaurant.id}
                                      />
                                      <input
                                        type="hidden"
                                        name="productId"
                                        value={product.id}
                                      />

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
                                      <input
                                        type="hidden"
                                        name="restaurantId"
                                        value={restaurant.id}
                                      />
                                      <input
                                        type="hidden"
                                        name="productId"
                                        value={product.id}
                                      />

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
                          <input
                            type="hidden"
                            name="restaurantId"
                            value={restaurant.id}
                          />
                          <input
                            type="hidden"
                            name="categoryId"
                            value={category.id}
                          />

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
                ))
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 backdrop-blur-xl lg:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
              QR Codes
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
              Mesas
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {restaurant.tables.map((table) => (
                <div
                  key={table.id}
                  className="rounded-[24px] border border-cyan-300/10 bg-[#020617]/60 p-4"
                >
                  <p className="text-xl font-black">Mesa {table.number}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {table.capacity} lugares
                  </p>

                  <button
                    disabled
                    className="mt-4 h-11 w-full cursor-not-allowed rounded-full border border-white/10 bg-white/[0.04] text-sm font-black text-slate-500"
                  >
                    QR Code no próximo passo
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-violet-300/20 bg-violet-500/10 p-5 backdrop-blur-xl lg:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-200">
              Próximo passo
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
              Página pública do cliente
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              A seguir criamos a página pública do QR Code:
            </p>

            <div className="mt-4 rounded-2xl border border-white/10 bg-[#020617]/60 p-4 text-sm font-bold text-slate-300">
              /o/{restaurant.id}/mesa-1
            </div>
          </div>
        </section>
      </div>

      <BottomNav id={id} />
    </main>
  );
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

function BottomNav({ id }: { id: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-cyan-300/10 bg-[#020617]/90 px-4 py-3 backdrop-blur-2xl lg:hidden">
      <div className="grid grid-cols-5 text-center text-xs font-bold text-slate-400">
        <Link href={`/restaurants/${id}`}>
          <p className="text-xl">⌂</p>
          Dashboard
        </Link>
        <Link href={`/restaurants/${id}/day`}>
          <p className="text-xl">⚡</p>
          Hoje
        </Link>
        <Link href={`/restaurants/${id}/customers`}>
          <p className="text-xl">👥</p>
          Clientes
        </Link>
        <Link href={`/restaurants/${id}/tables`}>
          <p className="text-xl">▦</p>
          Sala
        </Link>
        <Link href={`/restaurants/${id}/ordering`} className="text-cyan-300">
          <p className="text-xl">📲</p>
          QR
        </Link>
      </div>
    </nav>
  );
}
