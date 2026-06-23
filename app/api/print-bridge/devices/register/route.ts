import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      userId,
      deviceName,
    }: {
      userId: string;
      deviceName?: string;
    } = body;

    if (!userId) {
      return NextResponse.json(
        {
          error: "userId obrigatório.",
        },
        {
          status: 400,
        },
      );
    }

    const token = `MLD_${randomBytes(32).toString("hex")}`;

    const device = await prisma.printBridgeDevice.create({
      data: {
        userId,
        name:
          deviceName ||
          `Bridge ${new Date().toLocaleDateString("pt-PT")}`,
        token,
      },
    });

    return NextResponse.json({
      success: true,
      deviceId: device.id,
      token: device.token,
    });
  } catch (error) {
    console.error("PRINT BRIDGE REGISTER ERROR:", error);

    return NextResponse.json(
      {
        error: "Erro interno.",
      },
      {
        status: 500,
      },
    );
  }
}