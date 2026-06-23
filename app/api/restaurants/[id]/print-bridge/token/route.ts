import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const token = `MLB_${randomBytes(32).toString("hex")}`;

  await prisma.restaurant.update({
    where: { id },
    data: { printBridgeToken: token },
  });

  return NextResponse.json({ token });
}