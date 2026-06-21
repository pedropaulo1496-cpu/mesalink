import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;
    const { sessionId, method } = await request.json();

    if (!sessionId || !method) {
      return NextResponse.json(
        { error: "Dados inválidos." },
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

    const amount = Number(session.remainingAmount ?? session.totalAmount ?? 0);

    if (amount <= 0) {
      return NextResponse.json(
        { error: "A conta não tem valor em aberto." },
        { status: 400 },
      );
    }

    const openCashRegister = await prisma.pOSCashRegister.findFirst({
      where: {
        restaurantId,
        status: "OPEN",
      },
      orderBy: {
        openedAt: "desc",
      },
    });

    if (!openCashRegister) {
      return NextResponse.json(
        { error: "Tens de abrir caixa antes de cobrar." },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.pOSPayment.create({
        data: {
          restaurantId,
          tableSessionId: session.id,
          cashRegisterId: openCashRegister.id,
          amount,
          method,
          status: "PAID",
        },
      });

      const fiscalDocument = await tx.fiscalDocument.create({
        data: {
          restaurantId,
          paymentId: payment.id,
          tableSessionId: session.id,
          documentType: "SIMPLIFIED_INVOICE",
          status: "DRAFT",
          provider: "MOLONI",
          totalAmount: amount,
        },
      });

      await tx.pOSTableSession.update({
        where: {
          id: session.id,
        },
        data: {
          paidAmount: {
            increment: amount,
          },
          remainingAmount: 0,
          status: "CLOSED",
          closedAt: new Date(),
        },
      });

      await tx.pOSOrder.updateMany({
        where: {
          tableSessionId: session.id,
        },
        data: {
          status: "CLOSED",
        },
      });

      return {
        payment,
        fiscalDocument,
      };
    });

    return NextResponse.json({
      success: true,
      paymentId: result.payment.id,
      fiscalDocumentId: result.fiscalDocument.id,
    });
  } catch (error: any) {
    console.error("POS PAYMENT ERROR:", error);

    return NextResponse.json(
      { error: error?.message ?? "Erro interno." },
      { status: 500 },
    );
  }
}