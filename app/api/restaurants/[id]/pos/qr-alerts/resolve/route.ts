import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;
    const { sessionId, type } = await request.json();

    if (!sessionId || !type) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    if (type !== "waiter" && type !== "bill") {
      return NextResponse.json(
        { error: "Tipo de alerta inválido." },
        { status: 400 },
      );
    }

    const session = await prisma.orderingTableSession.findFirst({
      where: {
        id: sessionId,
        restaurantId,
        status: "OPEN",
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Sessão QR não encontrada." },
        { status: 404 },
      );
    }

    await prisma.orderingTableSession.update({
      where: { id: session.id },
      data:
        type === "waiter"
          ? { requestedWaiterAt: null }
          : { requestedBillAt: null },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("QR ALERT RESOLVE ERROR:", error);

    return NextResponse.json(
      { error: error?.message ?? "Erro interno." },
      { status: 500 },
    );
  }
}
