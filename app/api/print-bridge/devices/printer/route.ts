import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("x-bridge-token");

    if (!token) {
      return NextResponse.json(
        { error: "Token obrigatório." },
        { status: 401 },
      );
    }

    const body = await request.json();

    const {
      restaurantPrinterId,
      windowsPrinterName,
    } = body;

    const device = await prisma.printBridgeDevice.findUnique({
      where: {
        token,
      },
    });

    if (!device) {
      return NextResponse.json(
        { error: "Token inválido." },
        { status: 401 },
      );
    }

    await prisma.printBridgePrinterMapping.upsert({
      where: {
        bridgeDeviceId_restaurantPrinterId: {
          bridgeDeviceId: device.id,
          restaurantPrinterId,
        },
      },

      create: {
        bridgeDeviceId: device.id,
        restaurantPrinterId,
        windowsPrinterName,
      },

      update: {
        windowsPrinterName,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 },
    );
  }
}