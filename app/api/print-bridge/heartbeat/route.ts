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

    await prisma.printBridgeDevice.update({
      where: {
        token,
      },

      data: {
        lastSeenAt: new Date(),
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