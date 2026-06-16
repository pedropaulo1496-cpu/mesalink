import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  const sessionId = String(body.sessionId || "");
  const type = String(body.type || "");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Sessão inválida." },
      { status: 400 }
    );
  }

  const data: any = {};

  if (type === "waiter") {
    data.requestedWaiterAt = null;
  }

  if (type === "bill") {
    data.requestedBillAt = null;
  }

  await prisma.orderingTableSession.update({
    where: {
      id: sessionId,
    },
    data,
  });

  return NextResponse.json({
    success: true,
  });
}