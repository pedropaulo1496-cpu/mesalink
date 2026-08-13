import { cache } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const getPartnerIdentity = cache(async () => {
  const session = await getServerSession(authOptions);
  if (session?.user?.accountType !== "PARTNER" || !session.user.partnerId) return null;

  return prisma.referralPartner.findFirst({
    where: {
      id: session.user.partnerId,
      userId: session.user.id,
      status: { not: "SUSPENDED" },
    },
  });
});

export async function requirePartner() {
  const partner = await getPartnerIdentity();
  if (!partner) redirect("/partners/login");
  return partner;
}

