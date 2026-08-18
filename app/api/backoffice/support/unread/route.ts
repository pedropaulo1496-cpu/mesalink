import { NextResponse } from "next/server";
import { getStaffIdentity } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const staff = await getStaffIdentity();
  if (!staff) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const count = await prisma.supportMessage.count({
    where: {
      senderRole: "CLIENT",
      readAt: null,
      ...(staff.role === "SALES"
        ? { conversation: { salesRepresentativeId: staff.salesRepresentativeId! } }
        : {}),
    },
  });
  return NextResponse.json({ count });
}
