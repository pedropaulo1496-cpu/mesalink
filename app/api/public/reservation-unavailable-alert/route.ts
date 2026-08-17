import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { hasPublicReservationAccess } from "@/lib/public-reservation-access";

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

function sourceLabel(source: string | null) {
  if (source === "google_maps") return "através do Google Maps";
  if (source === "instagram") return "através do Instagram";
  if (source === "facebook") return "através do Facebook";
  if (source === "website") return "através do website";
  return "através da página pública de reservas";
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 403 });
  }

  let body: { slug?: unknown; visitorId?: unknown; source?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const visitorId = typeof body.visitorId === "string" ? body.visitorId.trim() : "";
  const requestedSource = typeof body.source === "string" ? body.source.trim().toLowerCase() : "";
  const source = ["google_maps", "instagram", "facebook", "website", "direct"].includes(requestedSource)
    ? requestedSource
    : "direct";

  if (!/^[a-z0-9-]{2,120}$/.test(slug) || visitorId.length < 8 || visitorId.length > 160) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      email: true,
      billingEmail: true,
      onlineReservationsEnabled: true,
      user: {
        select: {
          email: true,
          isAdmin: true,
          subscription: { select: { status: true, plan: true, trialEndsAt: true } },
        },
      },
    },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });
  }

  const subscriptionAccess = hasPublicReservationAccess(restaurant.user);
  const reservationsAvailable = restaurant.onlineReservationsEnabled && subscriptionAccess;
  if (reservationsAvailable) {
    return NextResponse.json({ error: "As reservas já estão disponíveis." }, { status: 409 });
  }

  const recipient = restaurant.email || restaurant.billingEmail || restaurant.user?.email;
  if (!recipient) {
    return NextResponse.json({ error: "Não foi possível avisar o restaurante." }, { status: 422 });
  }

  const visitorHash = createHash("sha256").update(visitorId).digest("hex");
  const existing = await prisma.reservationIssueAlert.findUnique({
    where: {
      restaurantId_visitorHash_dayKey: {
        restaurantId: restaurant.id,
        visitorHash,
        dayKey: dayKey(),
      },
    },
    select: { status: true },
  });
  if (existing?.status === "SENT" || existing?.status === "THROTTLED") {
    return NextResponse.json({ ok: true, alreadySent: true });
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentAlerts = await prisma.reservationIssueAlert.count({
    where: { restaurantId: restaurant.id, status: "SENT", createdAt: { gte: oneHourAgo } },
  });

  if (recentAlerts >= 5) {
    await prisma.reservationIssueAlert.upsert({
      where: { restaurantId_visitorHash_dayKey: { restaurantId: restaurant.id, visitorHash, dayKey: dayKey() } },
      create: { restaurantId: restaurant.id, visitorHash, dayKey: dayKey(), source, status: "THROTTLED" },
      update: { source, status: "THROTTLED" },
    });
    return NextResponse.json({ ok: true });
  }

  let alert: { id: string };
  try {
    alert = await prisma.reservationIssueAlert.upsert({
      where: { restaurantId_visitorHash_dayKey: { restaurantId: restaurant.id, visitorHash, dayKey: dayKey() } },
      create: { restaurantId: restaurant.id, visitorHash, dayKey: dayKey(), source },
      update: { source, status: "PENDING", failureReason: null },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ ok: true, alreadySent: true });
    }
    throw error;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    await prisma.reservationIssueAlert.update({
      where: { id: alert.id },
      data: { status: "FAILED", failureReason: "RESEND_NOT_CONFIGURED" },
    });
    return NextResponse.json({ error: "Não foi possível enviar o aviso agora." }, { status: 503 });
  }

  const restaurantName = escapeHtml(restaurant.name);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.mesalink.pt").replace(/\/$/, "");
  const actionUrl = subscriptionAccess
    ? `${appUrl}/restaurants/${restaurant.id}/settings`
    : `${appUrl}/billing`;
  const actionText = subscriptionAccess ? "Ativar reservas online" : "Voltar a receber reservas";
  const channel = sourceLabel(source);

  try {
    const delivery = await new Resend(apiKey).emails.send({
      from: "MesaLink <info@mesalink.pt>",
      to: recipient,
      subject: `Um cliente não conseguiu reservar online — ${restaurant.name}`,
      text: `Um potencial cliente tentou reservar ${channel}, mas encontrou as reservas online indisponíveis. Reative as reservas no MesaLink para não perder novas marcações: ${actionUrl}`,
      html: `
        <div style="margin:0;background:#f2ece3;padding:32px 14px;font-family:Arial,sans-serif;color:#17120d">
          <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #dfcfb8;border-radius:24px;overflow:hidden">
            <div style="background:#17120d;padding:22px 28px;color:#fff">
              <div style="font-family:Georgia,serif;font-size:24px;font-weight:700"><span style="color:#d7b267">Mesa</span>Link</div>
            </div>
            <div style="padding:32px 28px">
              <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#a27438">Possível reserva perdida</div>
              <h1 style="margin:12px 0 14px;font-family:Georgia,serif;font-size:30px;line-height:1.12">Um cliente tentou reservar em ${restaurantName}.</h1>
              <p style="margin:0;color:#685d52;font-size:16px;line-height:1.7">Um potencial cliente tentou reservar ${channel}, mas encontrou as reservas online indisponíveis.</p>
              <div style="margin:24px 0;padding:18px;border-radius:16px;background:#fbf5eb;border:1px solid #ead7b8">
                <strong style="display:block;margin-bottom:6px">Não perca a próxima marcação.</strong>
                <span style="color:#685d52;line-height:1.55">Reative o acesso no MesaLink para voltar a receber reservas pelo Google Maps, redes sociais e website.</span>
              </div>
              <a href="${actionUrl}" style="display:inline-block;background:#17120d;color:#fff;text-decoration:none;font-weight:700;padding:15px 24px;border-radius:999px">${actionText}</a>
              <p style="margin:24px 0 0;color:#9b8d7e;font-size:12px;line-height:1.5">Este aviso foi enviado porque o próprio cliente carregou em “Avisar o restaurante”. O mesmo cliente só pode enviar um aviso por dia.</p>
            </div>
          </div>
        </div>`,
    });

    if (delivery.error) throw new Error(delivery.error.message);

    await prisma.reservationIssueAlert.update({
      where: { id: alert.id },
      data: { status: "SENT", emailDeliveryId: delivery.data?.id || null },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    await prisma.reservationIssueAlert.update({
      where: { id: alert.id },
      data: { status: "FAILED", failureReason: error instanceof Error ? error.message.slice(0, 500) : "SEND_FAILED" },
    });
    return NextResponse.json({ error: "Não foi possível enviar o aviso agora." }, { status: 502 });
  }
}
