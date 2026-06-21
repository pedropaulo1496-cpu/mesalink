import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { reservationId, rating, comment } = await request.json();

    if (!reservationId || !rating) {
      return NextResponse.json(
        { error: "Dados inválidos." },
        { status: 400 },
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        restaurant: true,
        customer: true,
      },
    });

    if (!reservation || !reservation.restaurant) {
      return NextResponse.json(
        { error: "Reserva não encontrada." },
        { status: 404 },
      );
    }

    const threshold = reservation.restaurant.reviewRedirectThreshold ?? 4;
    const redirectToGoogle = rating >= threshold;

    await prisma.reviewFeedback.create({
      data: {
        restaurantId: reservation.restaurant.id,
        reservationId: reservation.id,
        customerId: reservation.customerId ?? undefined,
        rating,
        comment,
        redirectedToGoogle: redirectToGoogle,
      },
    });

    if (reservation.customerId && rating >= threshold) {
      await prisma.customer.update({
        where: { id: reservation.customerId },
        data: {
          vipTier: "BRONZE",
          marketingOptIn: true,
          marketingJoinedAt: new Date(),
        },
      });
    }

    await prisma.marketingAction.create({
      data: {
        restaurantId: reservation.restaurant.id,
        customerId: reservation.customerId ?? undefined,
        reservationId: reservation.id,
        type: "REVIEW_REQUEST",
        status: redirectToGoogle ? "CONVERTED" : "CLICKED",
        convertedAt: redirectToGoogle ? new Date() : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      redirectToGoogle,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao guardar review." },
      { status: 500 },
    );
  }
}