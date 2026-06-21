import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      sessionId: string;
    }>;
  },
) {
  try {
    const { id: restaurantId, sessionId } = await params;
    const { targetTableId, reason } = await request.json();

    if (!targetTableId) {
      return NextResponse.json(
        { error: "Mesa destino inválida." },
        { status: 400 },
      );
    }

    const session = await prisma.pOSTableSession.findFirst({
      where: {
        id: sessionId,
        restaurantId,
        status: "OPEN",
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Sessão não encontrada." },
        { status: 404 },
      );
    }

    if (session.tableId === targetTableId) {
      return NextResponse.json(
        { error: "A mesa destino é igual à mesa atual." },
        { status: 400 },
      );
    }

    const targetTable = await prisma.table.findFirst({
      where: {
        id: targetTableId,
        restaurantId,
      },
    });

    if (!targetTable) {
      return NextResponse.json(
        { error: "Mesa destino não encontrada." },
        { status: 404 },
      );
    }

    const existingOpenSession = await prisma.pOSTableSession.findFirst({
      where: {
        restaurantId,
        tableId: targetTableId,
        status: "OPEN",
      },
    });

    if (existingOpenSession) {
      return NextResponse.json(
        { error: "A mesa destino já está ocupada." },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedSession = await tx.pOSTableSession.update({
        where: {
          id: session.id,
        },
        data: {
          tableId: targetTableId,
        },
      });

      await tx.pOSTableTransfer.create({
        data: {
          restaurantId,
          fromTableId: session.tableId,
          toTableId: targetTableId,
          fromSessionId: session.id,
          toSessionId: session.id,
          reason: reason || null,
        },
      });

      return updatedSession;
    });

    return NextResponse.json({
      success: true,
      session: result,
    });
  } catch (error) {
    console.error("POS TABLE TRANSFER ERROR:", error);

    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 },
    );
  }
}