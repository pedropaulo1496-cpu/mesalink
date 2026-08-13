import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { referralDayBounds } from "@/lib/referral-availability";

async function ownedRestaurant(id: string, email: string) {
  return prisma.restaurant.findFirst({ where: { id, user: { email } }, select: { id: true } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!await ownedRestaurant(id, session.user.email)) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const rawDate = new Date(`${String(body?.date || "")}T12:00:00.000Z`);
  const capacity = Number(body?.capacity);
  if (Number.isNaN(rawDate.getTime()) || !Number.isInteger(capacity) || capacity < 0 || capacity > 2000) {
    return NextResponse.json({ error: "Revê a data e a capacidade." }, { status: 400 });
  }
  const { start } = referralDayBounds(rawDate);
  if (start < referralDayBounds(new Date()).start) return NextResponse.json({ error: "Escolhe uma data futura." }, { status: 400 });

  const row = await prisma.referralDailyCapacity.upsert({
    where: { restaurantId_date: { restaurantId: id, date: start } },
    create: { restaurantId: id, date: start, capacity, enabled: capacity > 0 },
    update: { capacity, enabled: capacity > 0 },
  });
  return NextResponse.json({ success: true, id: row.id });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!await ownedRestaurant(id, session.user.email)) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });
  const body = await request.json().catch(() => null);
  const rawDate = new Date(`${String(body?.date || "")}T12:00:00.000Z`);
  if (Number.isNaN(rawDate.getTime())) return NextResponse.json({ error: "Data inválida." }, { status: 400 });
  const { start } = referralDayBounds(rawDate);
  await prisma.referralDailyCapacity.deleteMany({ where: { restaurantId: id, date: start } });
  return NextResponse.json({ success: true });
}
