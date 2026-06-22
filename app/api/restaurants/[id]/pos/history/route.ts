import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;

    const payments = await prisma.pOSPayment.findMany({
      where: {
        restaurantId,
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 100,

      include: {
        fiscalDocument: true,
       
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