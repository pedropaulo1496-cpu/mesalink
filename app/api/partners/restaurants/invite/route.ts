import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { getGoogleRestaurant } from "@/lib/google-places";
import { prisma } from "@/lib/prisma";
import { discoverRestaurantEmail, isValidPublicRestaurantEmail } from "@/lib/restaurant-contact-discovery";

const GOOGLE_PROVIDER = "GOOGLE_PLACES";

export async function POST(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const provider = body?.provider === GOOGLE_PROVIDER ? GOOGLE_PROVIDER : "";
  const placeId = typeof body?.placeId === "string" && /^[A-Za-z0-9:_-]{8,500}$/.test(body.placeId) ? body.placeId : "";
  if (!provider || !placeId) return NextResponse.json({ error: "Restaurante inválido." }, { status: 400 });

  const cached = await prisma.externalRestaurantPlace.findUnique({
    where: { placeId },
    select: { contactEmail: true },
  });
  const place = await getGoogleRestaurant(placeId).catch(() => null);
  if (!place) return NextResponse.json({ error: "Restaurante indisponível." }, { status: 404 });
  let email = cached?.contactEmail || place.email || "";
  if (!email && place.websiteUrl) email = await discoverRestaurantEmail(place.websiteUrl) || "";
  if (!isValidPublicRestaurantEmail(email)) return NextResponse.json({ error: "Este restaurante não tem um email público válido." }, { status: 409 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "Envio temporariamente indisponível." }, { status: 503 });

  await prisma.externalRestaurantPlace.upsert({
    where: { placeId },
    create: { provider, placeId, contactEmail: email, contactCheckedAt: new Date(), name: place.name, address: place.address, mapUrl: place.mapUrl },
    update: { contactEmail: email, contactCheckedAt: new Date(), name: place.name, address: place.address, mapUrl: place.mapUrl },
  });

  const registerUrl = "https://www.mesalink.pt/register?utm_source=partner_invite&utm_medium=email&utm_campaign=restaurant_network";
  const delivery = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: "MesaLink Partners <info@mesalink.pt>",
    to: email,
    replyTo: "info@mesalink.pt",
    subject: "Uma equipa parceira gostaria de enviar reservas para o seu restaurante",
    text: `Olá,\n\nUma equipa parceira MesaLink demonstrou interesse em recomendar ${place.name} aos seus clientes e enviar pedidos de reserva.\n\nAo aderir ao MesaLink, pode receber e gerir estas reservas, definir disponibilidade e comissão e confirmar os pedidos diretamente na plataforma.\n\nCriar conta: ${registerUrl}\n\nA adesão pode ser iniciada gratuitamente. Se precisar de ajuda, responda a este email.\n\nEquipa MesaLink\ninfo@mesalink.pt`,
    html: `<div style="margin:0;background:#f5efe6;padding:28px 14px;font-family:Arial,sans-serif;color:#17120d"><div style="max-width:620px;margin:auto;overflow:hidden;border:1px solid #dfcfb8;border-radius:22px;background:white"><div style="background:#17120d;padding:24px 28px;color:white"><strong style="font:700 26px Georgia,serif"><span style="color:#d7b267">Mesa</span>Link</strong></div><div style="padding:30px 28px"><p style="font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#9b6f3b">Convite MesaLink Partners</p><h1 style="margin:10px 0 16px;font:700 29px/1.16 Georgia,serif">Uma equipa parceira quer recomendar ${escapeHtml(place.name)}.</h1><p style="font-size:15px;line-height:1.65;color:#685d52">Existe interesse em enviar clientes e pedidos de reserva para o seu restaurante através da rede MesaLink.</p><div style="margin:20px 0;border:1px solid #e4d3b9;border-radius:16px;background:#fff9ef;padding:17px;font-size:14px;line-height:1.7"><strong>Ao aderir, pode:</strong><br>Receber e gerir reservas<br>Definir disponibilidade e comissão<br>Confirmar ou sugerir outro horário</div><a href="${registerUrl}" style="display:inline-block;border-radius:999px;background:#17120d;padding:15px 24px;color:white;text-decoration:none;font-weight:700">Criar conta MesaLink</a><p style="margin-top:22px;font-size:12px;line-height:1.55;color:#918577">A adesão pode ser iniciada gratuitamente. Se precisar de ajuda, responda a este email.</p></div></div></div>`,
  }, { idempotencyKey: `partner-invite-${partner.id}-${createHash("sha256").update(placeId).digest("hex").slice(0, 24)}` });
  if (delivery.error) return NextResponse.json({ error: "Não foi possível enviar o convite." }, { status: 502 });
  return NextResponse.json({ success: true });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
}
