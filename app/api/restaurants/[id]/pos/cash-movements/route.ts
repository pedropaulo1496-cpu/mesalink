import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isRestaurantOwner } from "@/lib/restaurant-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;
    if (!(await isRestaurantOwner(restaurantId))) return NextResponse.json({ error: "Sem acesso a este restaurante." }, { status: 403 });
    const { type, amount, reason } = await request.json();

    if (!["IN", "OUT"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo de movimento inválido." },
        { status: 400 },
      );
    }

    const parsedAmount = Number(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Valor inválido." },
        { status: 400 },
      );
    }

    const cashRegister = await prisma.pOSCashRegister.findFirst({
      where: {
        restaurantId,
        status: "OPEN",
      },
      orderBy: {
        openedAt: "desc",
      },
    });

    if (!cashRegister) {
      return NextResponse.json(
        { error: "Não existe caixa aberta." },
        { status: 400 },
      );
    }

    const movement = await prisma.pOSCashMovement.create({
      data: {
        restaurantId,
        cashRegisterId: cashRegister.id,
        type,
        amount: parsedAmount,
        reason: reason || null,
      },
    });

    return NextResponse.json({
      success: true,
      movement: {
        ...movement,
        amount: Number(movement.amount),
      },
    });
  } catch (error: any) {
    console.error("POS CASH MOVEMENT ERROR:", error);

    return NextResponse.json(
      { error: error?.message ?? "Erro interno." },
      { status: 500 },
    );
  }
}
