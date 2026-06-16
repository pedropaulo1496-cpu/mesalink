import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const sessionId = String(body.sessionId || "");

  if (!sessionId) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 400 });
  }

  await prisma.orderingTableSession.update({
    where: { id: sessionId },
    data: {
      requestedBillAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}