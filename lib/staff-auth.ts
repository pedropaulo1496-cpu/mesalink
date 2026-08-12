import { cache } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type StaffIdentity = {
  userId: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "SALES";
  salesRepresentativeId: string | null;
};

export const getStaffIdentity = cache(async (): Promise<StaffIdentity | null> => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      salesProfile: { select: { id: true, active: true } },
    },
  });
  if (!user) return null;

  if (user.isAdmin) {
    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: "ADMIN",
      salesRepresentativeId: null,
    };
  }

  if (user.salesProfile?.active) {
    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: "SALES",
      salesRepresentativeId: user.salesProfile.id,
    };
  }

  return null;
});

export async function requireStaff() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");
  const staff = await getStaffIdentity();
  if (!staff) redirect("/backoffice-access");
  return staff;
}

export async function assertStaff() {
  const staff = await getStaffIdentity();
  if (!staff) throw new Error("Acesso reservado à equipa MesaLink.");
  return staff;
}

export async function assertBackofficeAdmin() {
  const staff = await assertStaff();
  if (staff.role !== "ADMIN") throw new Error("Ação reservada à administração MesaLink.");
  return staff;
}

export async function assertClientAccess(userId: string) {
  const staff = await assertStaff();
  if (staff.role === "ADMIN") return staff;
  const assigned = await prisma.user.count({
    where: { id: userId, salesRepresentativeId: staff.salesRepresentativeId },
  });
  if (assigned !== 1) throw new Error("Este cliente não está atribuído ao comercial.");
  return staff;
}
