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
  const networkInvite = body?.kind === "JOIN_NETWORK";
  const provider = body?.provider === GOOGLE_PROVIDER ? GOOGLE_PROVIDER : "";
  const placeId = typeof body?.placeId === "string" && /^[A-Za-z0-9:_-]{8,500}$/.test(body.placeId) ? body.placeId : "";
  let restaurantName = typeof body?.restaurantName === "string" ? body.restaurantName.trim().slice(0, 120) : "";
  let email = typeof body?.restaurantEmail === "string" ? body.restaurantEmail.trim().toLowerCase().slice(0, 160) : "";
  let invitationKey = email;

  if (networkInvite) {
    if (!restaurantName || !isValidPublicRestaurantEmail(email)) return NextResponse.json({ error: "Indica o nome e um email válido do restaurante." }, { status: 400 });
  } else {
    if (!provider || !placeId) return NextResponse.json({ error: "Restaurante inválido." }, { status: 400 });
    const cached = await prisma.externalRestaurantPlace.findUnique({
      where: { placeId },
      select: { contactEmail: true },
    });
    const place = await getGoogleRestaurant(placeId).catch(() => null);
    if (!place) return NextResponse.json({ error: "Restaurante indisponível." }, { status: 404 });
    email = cached?.contactEmail || place.email || "";
    if (!email && place.websiteUrl) email = await discoverRestaurantEmail(place.websiteUrl) || "";
    if (!isValidPublicRestaurantEmail(email)) return NextResponse.json({ error: "Este restaurante não tem um email público válido." }, { status: 409 });
    restaurantName = place.name;
    invitationKey = placeId;
    await prisma.externalRestaurantPlace.upsert({
      where: { placeId },
      create: { provider, placeId, contactEmail: email, contactCheckedAt: new Date(), name: place.name, address: place.address, mapUrl: place.mapUrl },
      update: { contactEmail: email, contactCheckedAt: new Date(), name: place.name, address: place.address, mapUrl: place.mapUrl },
    });
  }
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "Envio temporariamente indisponível." }, { status: 503 });

  const registerUrl = "https://www.mesalink.pt/register?utm_source=partner_invite&utm_medium=email&utm_campaign=restaurant_network";
  const partnerName = partner.businessName || partner.contactName || "Um parceiro MesaLink";
  const subject = networkInvite
    ? `${partnerName} convidou o seu restaurante para conhecer a rede MesaLink`
    : "Convite para aceitar reservas imediatas através do MesaLink";
  const heading = networkInvite
    ? `${escapeHtml(partnerName)} quer recomendar ${escapeHtml(restaurantName)} através da MesaLink.`
    : `${escapeHtml(restaurantName)} pode começar a aceitar reservas imediatas.`;
  const introduction = networkInvite
    ? `${escapeHtml(partnerName)} gostaria de recomendar o seu restaurante aos respetivos clientes e convidou-o a conhecer a rede MesaLink.`
    : "Existem parceiros interessados em enviar clientes para o seu restaurante. Ao configurar as reservas imediatas, os pedidos compatíveis entram diretamente na agenda MesaLink.";
  const delivery = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: "MesaLink Partners <info@mesalink.pt>",
    to: email,
    replyTo: networkInvite ? partner.email : "info@mesalink.pt",
    subject,
    text: `Olá,\n\n${networkInvite ? `${partnerName} gostaria de recomendar ${restaurantName} aos seus clientes e convidou-o a conhecer a rede MesaLink.` : `Existem parceiros interessados em enviar clientes para ${restaurantName}. Ao ativar as reservas imediatas, os pedidos compatíveis entram diretamente na agenda MesaLink.`}\n\nNa MesaLink pode receber e gerir reservas, definir disponibilidade e comissão e acompanhar os pedidos.\n\nCriar conta: ${registerUrl}\n\n${networkInvite ? `Este convite foi feito por ${partnerName} (${partner.email}). Pode responder diretamente a este email para falar com o parceiro.` : "Se precisar de ajuda na configuração, responda a este email."}\n\nEquipa MesaLink\ninfo@mesalink.pt`,
    html: `<div style="margin:0;background:#f5efe6;padding:28px 14px;font-family:Arial,sans-serif;color:#17120d"><div style="max-width:620px;margin:auto;overflow:hidden;border:1px solid #dfcfb8;border-radius:22px;background:white"><div style="background:#17120d;padding:24px 28px;color:white"><strong style="font:700 26px Georgia,serif"><span style="color:#d7b267">Mesa</span>Link</strong></div><div style="padding:30px 28px"><p style="font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#9b6f3b">${networkInvite ? "Convite para a rede MesaLink" : "Reservas imediatas"}</p><h1 style="margin:10px 0 16px;font:700 29px/1.16 Georgia,serif">${heading}</h1><p style="font-size:15px;line-height:1.65;color:#685d52">${introduction}</p><div style="margin:20px 0;border:1px solid #e4d3b9;border-radius:16px;background:#fff9ef;padding:17px;font-size:14px;line-height:1.7"><strong>Na MesaLink pode:</strong><br>Receber e gerir reservas<br>Definir disponibilidade e comissão<br>Acompanhar confirmações e alterações</div><a href="${registerUrl}" style="display:inline-block;border-radius:999px;background:#17120d;padding:15px 24px;color:white;text-decoration:none;font-weight:700">${networkInvite ? "Conhecer e aderir à MesaLink" : "Ativar reservas imediatas"}</a><p style="margin-top:22px;font-size:12px;line-height:1.55;color:#918577">${networkInvite ? `Convite enviado por ${escapeHtml(partnerName)}. As respostas a este email seguem para ${escapeHtml(partner.email)}.` : "Se precisar de ajuda na configuração, responda a este email."}</p></div></div></div>`,
  }, { idempotencyKey: `partner-invite-${networkInvite ? "network" : "instant"}-${partner.id}-${createHash("sha256").update(invitationKey).digest("hex").slice(0, 24)}` });
  if (delivery.error) return NextResponse.json({ error: "Não foi possível enviar o convite." }, { status: 502 });
  return NextResponse.json({ success: true });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
}
