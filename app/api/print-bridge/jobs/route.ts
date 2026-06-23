import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const restaurantId = searchParams.get("restaurantId");
  const printerId = searchParams.get("printerId");

  if (!restaurantId || !printerId) {
    return NextResponse.json(
      { error: "restaurantId e printerId são obrigatórios." },
      { status: 400 },
    );
  }

  const jobs = await prisma.printJob.findMany({
    where: {
      restaurantId,
      printerId,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 10,
  });

  return NextResponse.json({ jobs });
}