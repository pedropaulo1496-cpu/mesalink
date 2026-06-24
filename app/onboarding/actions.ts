"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

function slugify(value: string) {
  return value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

export async function createRestaurant(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!user) redirect("/login");

  const existingRestaurant = await prisma.restaurant.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  if (existingRestaurant) redirect(`/restaurants/${existingRestaurant.id}`);

  if (!user.subscription) {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: "ESSENTIALS",
        status: "TRIAL",
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        restaurantLimit: 1,
        priceMonthly: 0,
      },
    });
  }

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const address = String(formData.get("address") || "").trim();
  if (!name) redirect("/onboarding");

  const baseSlug = slugify(name) || "restaurante";
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.restaurant.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const restaurant = await prisma.restaurant.create({ data: { name, email, phone, address, slug, userId: user.id, plan: "ESSENTIALS" } });
  redirect(`/restaurants/${restaurant.id}`);
}
