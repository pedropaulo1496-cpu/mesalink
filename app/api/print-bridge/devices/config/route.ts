import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("x-bridge-token");

    if (!token) {
      return NextResponse.json(
        { error: "Token obrigatório." },
        { status: 401 },
      );
    }

    const device = await prisma.printBridgeDevice.findUnique({
      where: {
        token,
      },

      include: {
        restaurants: {
          where: {
            active: true,
          },

          include: {
            restaurant: {
              include: {
                printers: {
                  where: {
                    active: true,
                  },

                  orderBy: {
                    name: "asc",
                  },
                },
              },
            },
          },
        },

        mappings: true,
      },
    });

    if (!device) {
      return NextResponse.json(
        { error: "Token inválido." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      device: {
        id: device.id,
        name: device.name,
      },

      restaurants: device.restaurants.map((link) => ({
        id: link.restaurant.id,
        name: link.restaurant.name,

        printers: link.restaurant.printers,
      })),

      mappings: device.mappings,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 },
    );
  }
}