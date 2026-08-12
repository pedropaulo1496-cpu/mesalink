import { cache } from "react";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const getAdminUser = cache(async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  return prisma.user.findFirst({
    where: { email: session.user.email, isAdmin: true },
    select: { id: true, name: true, email: true },
  });
});

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const admin = await prisma.user.findFirst({
    where: { email: session.user.email, isAdmin: true },
    select: { id: true, name: true, email: true },
  });
  if (!admin) notFound();
  return admin;
}

export async function assertAdmin() {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Acesso reservado à administração MesaLink.");
  return admin;
}
