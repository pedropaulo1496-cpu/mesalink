import { NextResponse } from "next/server";
import { Resend } from "resend";
import { completeEmailSend, refundEmailSend, reserveEmailSend } from "@/lib/email-billing";
import { requireAcceptedEmail } from "@/lib/email-delivery";
import { prisma } from "@/lib/prisma";
import { getRevenueMeter } from "@/lib/revenue-meter";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Não autorizado." }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ success: false, error: "Email indisponível." }, { status: 503 });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = new Date();
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
  const restaurants = await prisma.restaurant.findMany({
    where: {
      revenueSummaryEmailEnabled: true,
      user: { subscription: { status: { in: ["ACTIVE", "TRIAL"] } } },
    },
    select: { id: true, name: true, billingEmail: true, email: true, userId: true, user: { select: { email: true } } },
    take: 500,
  });
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const restaurant of restaurants) {
    const email = restaurant.billingEmail || restaurant.email || restaurant.user?.email;
    if (!restaurant.userId || !email) { skipped += 1; continue; }
    const meter = await getRevenueMeter(restaurant.id, from, to);
    if (!meter.reservations && !meter.marketing && !meter.protected) { skipped += 1; continue; }
    const weekKey = from.toISOString().slice(0, 10);
    const reference = `email:revenue_weekly:${restaurant.id}:${weekKey}`;
    let reserved = false;
    try {
      const allowance = await reserveEmailSend({ userId: restaurant.userId, restaurantId: restaurant.id, category: "REVENUE_WEEKLY", reference });
      if (!allowance.canSend) { skipped += 1; continue; }
      reserved = true;
      const delivery = await resend.emails.send({
        from: "MesaLink <noreply@mesalink.pt>",
        to: email,
        subject: `Resumo semanal de receita — ${restaurant.name}`,
        html: `<div style="margin:0;background:#F5EFE6;padding:30px;font-family:Arial,sans-serif;color:#17120D"><div style="max-width:600px;margin:auto;border:1px solid #E1D0B8;border-radius:26px;background:white;padding:28px"><p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#9B6F3B">MesaLink Revenue Meter</p><h1 style="margin:12px 0 0;font-size:30px">A semana em 60 segundos.</h1><p style="color:#6B6258">${escapeHtml(restaurant.name)} · últimos 7 dias</p><div style="margin:24px 0;border-radius:20px;background:#17120D;color:white;padding:22px"><p style="margin:0;color:#D7B267;font-size:11px;text-transform:uppercase;letter-spacing:.16em">Receita estimada</p><p style="margin:8px 0 0;font-size:42px;font-weight:700">${formatMoney(meter.total)}</p><p style="margin:8px 0 0;color:#BEB8B1">${meter.reservations} reservas · ${meter.roi ? `${meter.roi}× ROI MesaLink` : "ROI em construção"}</p></div>${row("Reservas diretas", meter.direct)}${row("Marketing AI", meter.marketing)}${row("Rede de Parceiros", meter.partners)}${row("Receita protegida", meter.protected)}${row("Experiências", meter.experiences)}<a href="${process.env.NEXT_PUBLIC_APP_URL || "https://www.mesalink.pt"}/restaurants/${restaurant.id}/revenue" style="display:block;margin-top:22px;padding:14px;border-radius:999px;background:#D7B267;color:#17120D;text-align:center;text-decoration:none;font-weight:700">Abrir Revenue Meter</a></div></div>`,
      });
      requireAcceptedEmail(delivery);
      await completeEmailSend(reference);
      sent += 1;
    } catch (error) {
      if (reserved) await refundEmailSend(reference);
      failed += 1;
      console.error("Weekly revenue email failed", restaurant.id, error);
    }
  }
  return NextResponse.json({ success: true, sent, skipped, failed });
}

function formatMoney(value: number) { return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value); }
function row(label: string, value: number) { return `<div style="display:flex;justify-content:space-between;border-bottom:1px solid #EEE3D4;padding:12px 2px"><span style="color:#6B6258">${label}</span><strong>${formatMoney(value)}</strong></div>`; }
function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] || char); }
