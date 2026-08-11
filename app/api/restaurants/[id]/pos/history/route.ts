import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isRestaurantOwner } from "@/lib/restaurant-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;
    if (!(await isRestaurantOwner(restaurantId))) return NextResponse.json({ error: "Sem acesso a este restaurante." }, { status: 403 });

    const payments = await prisma.pOSPayment.findMany({
      where: {
        restaurantId,
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 100,

      include: {
        tableSession: {
          include: {
            table: true,

            orders: {
              include: {
                items: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      payments,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Erro interno",
      },
      {
        status: 500,
      },
    );
  }
}
