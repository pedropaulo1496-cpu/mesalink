import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurant = await prisma.restaurant.findFirst({
    where: { slug, websiteEnabled: true },
    include: {
      user: { select: { subscription: true } },
      orderingCategories: {
        where: { activeInPOS: true },
        orderBy: { position: "asc" },
        include: {
          products: {
            where: { active: true, activeOnWebsite: true },
            orderBy: { sortOrder: "asc" },
            select: { name: true, description: true, price: true },
          },
        },
      },
    },
  });

  if (!restaurant) return new Response("Not found", { status: 404 });
  const subscription = restaurant.user?.subscription;
  const active = subscription?.status === "ACTIVE" || (subscription?.status === "TRIAL" && subscription.trialEndsAt && subscription.trialEndsAt > new Date());
  if (!active) return new Response("Not found", { status: 404 });

  const menu = restaurant.orderingCategories.flatMap((category) => [
    `\n## ${category.name}`,
    ...category.products.map((product) => `- ${product.name} — ${Number(product.price).toFixed(2)} EUR${product.description ? `: ${product.description}` : ""}`),
  ]).join("\n");
  const content = [
    `# ${restaurant.name}`,
    restaurant.websiteCuisine ? `Cuisine: ${restaurant.websiteCuisine}` : "",
    restaurant.address ? `Address: ${restaurant.address}` : "",
    restaurant.phone ? `Phone: ${restaurant.phone}` : "",
    restaurant.email ? `Email: ${restaurant.email}` : "",
    restaurant.websiteDescription || "",
    restaurant.websiteAboutText || "",
    `Reservations: https://www.mesalink.pt/reserve/${restaurant.slug}`,
    menu ? `\n# Menu${menu}` : "",
    "\nThis file is generated from the restaurant's current MesaLink data. Verify availability and prices with the restaurant.",
  ].filter(Boolean).join("\n\n");

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "index, follow",
    },
  });
}
