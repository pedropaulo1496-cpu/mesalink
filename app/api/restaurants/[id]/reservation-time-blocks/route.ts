import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validReservationSlot } from "@/lib/reservation-time-blocks";

async function ownedRestaurant(id: string, email: string) {
  return prisma.restaurant.findFirst({ where: { id, user: { email } }, select: { id: true } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!await ownedRestaurant(id, session.user.email)) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });
  const body = await request.json().catch(() => null);
  const day = String(body?.day || "");
  const time = String(body?.time || "");
  if (!validReservationSlot(day, time)) return NextResponse.json({ error: "Horário inválido." }, { status: 400 });
  const today = new Date().toISOString().slice(0, 10);
  if (day < today) return NextResponse.json({ error: "Não é possível bloquear um dia passado." }, { status: 400 });
  await prisma.reservationTimeBlock.upsert({
    where: { restaurantId_day_time: { restaurantId: id, day, time } },
    create: { restaurantId: id, day, time },
    update: {},
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!await ownedRestaurant(id, session.user.email)) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });
  const body = await request.json().catch(() => null);
  const day = String(body?.day || "");
  const time = String(body?.time || "");
  if (!validReservationSlot(day, time)) return NextResponse.json({ error: "Horário inválido." }, { status: 400 });
  await prisma.reservationTimeBlock.deleteMany({ where: { restaurantId: id, day, time } });
  return NextResponse.json({ success: true });
}
