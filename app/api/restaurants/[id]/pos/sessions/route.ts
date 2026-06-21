import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;
    const { tableId, guestCount } = await request.json();

    const parsedGuestCount = Math.max(1, Number(guestCount ?? 1));

    if (!tableId) {
      return NextResponse.json(
        { error: "Mesa inválida" },
        { status: 400 },
      );
    }

    const table = await prisma.table.findFirst({
      where: {
        id: tableId,
        restaurantId,
      },
    });

    if (!table) {
      return NextResponse.json(
        { error: "Mesa não encontrada" },
        { status: 404 },
      );
    }

    const existingSession = await prisma.pOSTableSession.findFirst({
      where: {
        restaurantId,
        tableId,
        status: "OPEN",
      },
    });

    if (existingSession) {
      const updatedSession = await prisma.pOSTableSession.update({
        where: {
          id: existingSession.id,
        },
        data: {
          guestCount: parsedGuestCount,
        },
      });

      return NextResponse.json({
        success: true,
        sessionId: updatedSession.id,
      });
    }

    const session = await prisma.pOSTableSession.create({
      data: {
        restaurantId,
        tableId,
        status: "OPEN",
        guestCount: parsedGuestCount,
        subtotalAmount: 0,
        discountAmount: 0,
        totalAmount: 0,
        remainingAmount: 0,
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("POS SESSION CREATE ERROR:", error);

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;
    const { sessionId, action } = await request.json();

    if (!sessionId || !action) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 },
      );
    }

    const session = await prisma.pOSTableSession.findFirst({
      where: {
        id: sessionId,
        restaurantId,
        status: "OPEN",
      },
      include: {
        payments: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Sessão não encontrada" },
        { status: 404 },
      );
    }

    if (action === "cancel") {
      if (session.payments.length > 0) {
        return NextResponse.json(
          { error: "Não podes cancelar uma mesa que já tem pagamento." },
          { status: 400 },
        );
      }

      await prisma.$transaction([
        prisma.pOSOrder.updateMany({
          where: {
            tableSessionId: session.id,
          },
          data: {
            status: "CANCELLED",
          },
        }),

        prisma.pOSTableSession.update({
          where: {
            id: session.id,
          },
          data: {
            status: "CANCELLED",
            closedAt: new Date(),
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
      });
    }

    return NextResponse.json(
      { error: "Ação inválida" },
      { status: 400 },
    );
  } catch (error) {
    console.error("POS SESSION PATCH ERROR:", error);

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 },
    );
  }
}