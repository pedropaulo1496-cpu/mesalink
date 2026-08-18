import { NextResponse } from "next/server";
import { getStaffIdentity } from "@/lib/staff-auth";
import { hqPushPublicKey } from "@/lib/hq-notifications";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const staff = await getStaffIdentity();
  if (!staff) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  return NextResponse.json({ publicKey: hqPushPublicKey() });
}

export async function POST(request: Request) {
  const staff = await getStaffIdentity();
  if (!staff) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const subscription = await request.json().catch(() => null);
  const endpoint = String(subscription?.endpoint || "");
  const p256dh = String(subscription?.keys?.p256dh || "");
  const auth = String(subscription?.keys?.auth || "");
  if (!endpoint || !p256dh || !auth) return NextResponse.json({ error: "Subscrição inválida." }, { status: 400 });
  await prisma.hqPushSubscription.upsert({
    where: { endpoint },
    create: { userId: staff.userId, endpoint, p256dh, auth },
    update: { userId: staff.userId, p256dh, auth },
  });
  return NextResponse.json({ success: true });
}
