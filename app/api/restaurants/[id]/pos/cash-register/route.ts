import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;
    const { openingAmount } = await request.json();

    const existingOpenCashRegister = await prisma.pOSCashRegister.findFirst({
      where: {
        restaurantId,
        status: "OPEN",
      },
    });

    if (existingOpenCashRegister) {
      return NextResponse.json(
        { error: "Já existe uma caixa aberta." },
        { status: 400 },
      );
    }

    const cashRegister = await prisma.pOSCashRegister.create({
      data: {
        restaurantId,
        status: "OPEN",
        openingAmount: Number(openingAmount ?? 0),
      },
    });

    return NextResponse.json({
      success: true,
      cashRegister,
    });
  } catch (error) {
    console.error(error);

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
    const { cashRegisterId, closingAmount } = await request.json();

    if (!cashRegisterId) {
      return NextResponse.json(
        { error: "Caixa inválida." },
        { status: 400 },
      );
    }

    const cashRegister = await prisma.pOSCashRegister.findFirst({
      where: {
        id: cashRegisterId,
        restaurantId,
        status: "OPEN",
      },
      include: {
        payments: true,
      },
    });

    if (!cashRegister) {
      return NextResponse.json(
        { error: "Caixa não encontrada." },
        { status: 404 },
      );
    }

    const cashTotal = cashRegister.payments
      .filter((payment) => payment.method === "CASH")
      .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

    const expectedCash = Number(cashRegister.openingAmount ?? 0) + cashTotal;
    const countedCash = Number(closingAmount ?? 0);
    const difference = countedCash - expectedCash;

    await prisma.pOSCashRegister.update({
      where: {
        id: cashRegister.id,
      },
      data: {
        status: "CLOSED",
        closingAmount: countedCash,
        expectedCash,
        difference,
        closedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 },
    );
  }
}