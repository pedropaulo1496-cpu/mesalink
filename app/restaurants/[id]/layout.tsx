import { notFound, redirect } from "next/navigation";
import { getCurrentUser, isRestaurantOwner } from "@/lib/restaurant-auth";
import { canAccessApp } from "@/lib/check-subscription";
import { ensureMonthlyEmailAllowance } from "@/lib/email-billing";

export default async function RestaurantAreaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await canAccessApp(user.email))) redirect("/billing");
  await ensureMonthlyEmailAllowance(user.id);
  const { id } = await params;
  if (!(await isRestaurantOwner(id))) notFound();
  return children;
}
