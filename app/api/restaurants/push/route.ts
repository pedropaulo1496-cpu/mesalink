import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hqPushPublicKey } from "@/lib/hq-notifications";
import { prisma } from "@/lib/prisma";

async function restaurantUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.accountType !== "RESTAURANT") return null;
  return prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
}

export async function GET() {
  const user = await restaurantUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  return NextResponse.json({ publicKey: await hqPushPublicKey() });
}

export async function POST(request: Request) {
  const user = await restaurantUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const subscription = await request.json().catch(() => null);
  const endpoint = String(subscription?.endpoint || "");
  const p256dh = String(subscription?.keys?.p256dh || "");
  const auth = String(subscription?.keys?.auth || "");
  if (!endpoint || !p256dh || !auth) return NextResponse.json({ error: "Subscrição inválida." }, { status: 400 });
  await prisma.hqPushSubscription.upsert({
    where: { endpoint },
    create: { userId: user.id, endpoint, p256dh, auth },
    update: { userId: user.id, p256dh, auth },
  });
  return NextResponse.json({ success: true });
}
