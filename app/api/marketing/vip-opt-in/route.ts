import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { reservationId, birthDate } = await request.json();

    if (!reservationId) {
      return NextResponse.json(
        { error: "Reservation ID obrigatório." },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: {
        id: reservationId,
      },
      include: {
        customer: true,
      },
    });

    if (!reservation?.customer) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 }
      );
    }

    await prisma.customer.update({
      where: {
        id: reservation.customer.id,
      },
      data: {
        marketingOptIn: true,
        marketingJoinedAt: new Date(),
        birthDate: birthDate ? new Date(birthDate) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 }
    );
  }
}