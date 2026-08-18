import { NextResponse } from "next/server";
import { hqPushPublicKey } from "@/lib/hq-notifications";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  return NextResponse.json({ publicKey: await hqPushPublicKey() });
}

export async function POST(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const subscription = await request.json().catch(() => null);
  const endpoint = String(subscription?.endpoint || "");
  const p256dh = String(subscription?.keys?.p256dh || "");
  const auth = String(subscription?.keys?.auth || "");
  if (!endpoint || !p256dh || !auth) return NextResponse.json({ error: "Subscrição inválida." }, { status: 400 });
  await prisma.hqPushSubscription.upsert({
    where: { endpoint },
    create: { userId: partner.userId, endpoint, p256dh, auth },
    update: { userId: partner.userId, p256dh, auth },
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const payload = await request.json().catch(() => null);
  const endpoint = String(payload?.endpoint || "");
  if (endpoint) await prisma.hqPushSubscription.deleteMany({ where: { userId: partner.userId, endpoint } });
  return NextResponse.json({ success: true });
}
