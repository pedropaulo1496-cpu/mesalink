import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("x-bridge-token");

    if (!token) {
      return NextResponse.json({ error: "Token obrigatório." }, { status: 401 });
    }

    const device = await prisma.printBridgeDevice.findUnique({
      where: { token },
    });

    if (!device) {
      return NextResponse.json({ error: "Token inválido." }, { status: 401 });
    }

    const { printers } = await request.json();

    await prisma.printBridgeDevice.update({
      where: { id: device.id },
      data: {
        lastSeenAt: new Date(),
        windowsPrinters: Array.isArray(printers) ? printers : [],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PRINT BRIDGE PRINTERS ERROR:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}