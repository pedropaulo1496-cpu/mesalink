import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { isRestaurantOwner } from "@/lib/restaurant-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!(await isRestaurantOwner(id))) return NextResponse.json({ error: "Sem acesso a este restaurante." }, { status: 403 });

  const token = `MLB_${randomBytes(32).toString("hex")}`;

  await prisma.restaurant.update({
    where: { id },
    data: { printBridgeToken: token },
  });

  return NextResponse.json({ token });
}
