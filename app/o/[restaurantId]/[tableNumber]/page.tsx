import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PublicOrderingClient from "@/components/PublicOrderingClient";

export default async function PublicOrderingPage({
  params,
}: {
  params: Promise<{ restaurantId: string; tableNumber: string }>;
}) {
  const { restaurantId, tableNumber } = await params;
  const table = Number(tableNumber);

  if (Number.isNaN(table)) notFound();

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      orderingCategories: {
        orderBy: [{ position: "asc" }, { name: "asc" }],
        include: {
          products: {
            where: { active: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          },
        },
      },
    },
  });

  if (!restaurant) notFound();

  const categories = restaurant.orderingCategories
    .map((category) => ({
      id: category.id,
      name: category.name,
      products: category.products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        vatRate: Number(product.vatRate),
        imageUrl: product.imageUrl,
        allergens: product.allergens,
        featured: Boolean(product.featured),
      })),
    }))
    .filter((category) => category.products.length > 0);

  return (
    <PublicOrderingClient
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      tableNumber={table}
      categories={categories}
      qrOrderingEnabled={Boolean(restaurant.qrOrderingEnabled)}
      qrAllowWaiterCall={Boolean(restaurant.qrAllowWaiterCall)}
      qrAllowBillRequest={Boolean(restaurant.qrAllowBillRequest)}
      qrWelcomeMessage={restaurant.qrWelcomeMessage}
    />
  );
}