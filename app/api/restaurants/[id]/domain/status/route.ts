import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { publicDomainOrder, refreshDomainOrder } from "@/lib/domain-orders";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Precisa de iniciar sessão." }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const order = body.orderId
    ? await prisma.domainOrder.findFirst({
        where: { id: String(body.orderId), restaurantId: id, restaurant: { user: { email: session.user.email } } },
      })
    : await prisma.domainOrder.findFirst({
        where: { restaurantId: id, restaurant: { user: { email: session.user.email } } },
        orderBy: { createdAt: "desc" },
      });
  if (!order) return NextResponse.json({ order: null });

  try {
    const refreshed = await refreshDomainOrder(order.id);
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      select: { customDomain: true, customDomainVerified: true },
    });
    return NextResponse.json({ order: publicDomainOrder(refreshed), restaurant });
  } catch (error) {
    console.error("Domain status refresh failed", error);
    return NextResponse.json({
      order: publicDomainOrder(order),
      warning: "Ainda estamos a confirmar o estado. Tenta novamente dentro de alguns segundos.",
    });
  }
}
