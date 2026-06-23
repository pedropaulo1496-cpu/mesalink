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

    if (!device || !device.active) {
      return NextResponse.json(
        { error: "Token inválido ou dispositivo inativo." },
        { status: 401 },
      );
    }

    await prisma.printBridgeDevice.update({
      where: {
        id: device.id,
      },
      data: {
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({
      device: {
        id: device.id,
        name: device.name,
        lastSeenAt: device.lastSeenAt,
        windowsPrinters: device.windowsPrinters ?? [],
      },

      restaurants: device.restaurants.map((link) => ({
        id: link.restaurant.id,
        name: link.restaurant.name,
        printers: link.restaurant.printers.map((printer) => ({
          id: printer.id,
          name: printer.name,
          method: printer.method,
          type: printer.type,
        })),
      })),

      mappings: device.mappings.map((mapping) => ({
        id: mapping.id,
        restaurantPrinterId: mapping.restaurantPrinterId,
        windowsPrinterName: mapping.windowsPrinterName,
      })),
    });
  } catch (error) {
    console.error("PRINT BRIDGE DEVICE CONFIG ERROR:", error);

    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 },
    );
  }
}