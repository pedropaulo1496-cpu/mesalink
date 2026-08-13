import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100) || "";
  if (!query) return NextResponse.json({ partners: [] });

  const owner = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  const restaurant = owner ? await prisma.restaurant.findFirst({ where: { id, userId: owner.id }, select: { id: true } }) : null;
  if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });

  const partners = await prisma.referralPartner.findMany({
    where: {
      OR: [
        { businessName: { contains: query, mode: "insensitive" } },
        { contactName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { partnerCode: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: [{ status: "asc" }, { businessName: "asc" }],
    take: 8,
    select: { id: true, businessName: true, contactName: true, email: true, partnerCode: true, partnerType: true },
  });

  return NextResponse.json({ partners });
}
