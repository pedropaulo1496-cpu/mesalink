import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export async function GET() {
  const token = `MLD_${randomBytes(32).toString("hex")}`;

  const device = await prisma.printBridgeDevice.create({
    data: {
      userId: "cmqh7fjl00000jj04rybm91yl",
      name: "PC Principal",
      token,
    },
  });

  return NextResponse.json(device);
}