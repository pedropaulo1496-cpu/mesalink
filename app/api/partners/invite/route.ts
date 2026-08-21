import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { partnerRestaurantInvitationTokenHash } from "@/lib/partner-restaurant-invitations";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";

export async function POST(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 160) : "";
  if (!isValidEmail(email)) return NextResponse.json({ error: "Indica um email válido." }, { status: 400 });
  const existingRestaurant = await prisma.restaurant.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true, userId: true } });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "Envio temporariamente indisponível." }, { status: 503 });

  const partnerName = partner.businessName || partner.contactName || "Um parceiro MesaLink";
  const token = randomBytes(32).toString("base64url");
  const invitation = await prisma.referralPartnerRestaurantInvitation.create({
    data: { partnerId: partner.id, restaurantId: existingRestaurant?.id || null, email, tokenHash: partnerRestaurantInvitationTokenHash(token), expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
    select: { id: true },
  });
  const destinationUrl = `https://www.mesalink.pt/restaurant-invite/${token}`;
  const delivery = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: "MesaLink Partners <info@mesalink.pt>",
    to: email,
    replyTo: partner.email,
    subject: `${partnerName} quer enviar clientes ao seu restaurante`,
    text: `Olá,\n\n${partnerName} convidou o seu restaurante a aderir ao MesaLink para começar a receber novos clientes através da nossa plataforma e respetivos parceiros.\n\nCada reserva representa mais mesas ocupadas e mais faturação para o restaurante. Em troca, a comissão é definida por pessoa e negociada diretamente entre o restaurante e ${partnerName}.\n\nO restaurante mantém sempre o controlo da disponibilidade, dos horários e das reservas que recebe.\n\nComeçar a receber clientes: ${destinationUrl}\n\nEste convite foi enviado por ${partnerName}. Pode responder diretamente a este email para falar com o parceiro.\n\nEquipa MesaLink\ninfo@mesalink.pt`,
    html: `<div style="margin:0;background:#f5efe6;padding:28px 14px;font-family:Arial,sans-serif;color:#17120d"><div style="max-width:620px;margin:auto;overflow:hidden;border:1px solid #dfcfb8;border-radius:22px;background:white"><div style="background:#17120d;padding:24px 28px;color:white"><strong style="font:700 26px Georgia,serif"><span style="color:#d7b267">Mesa</span>Link</strong></div><div style="padding:30px 28px"><p style="font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#9b6f3b">Novos clientes e mais faturação</p><h1 style="margin:10px 0 16px;font:700 29px/1.16 Georgia,serif">${escapeHtml(partnerName)} quer enviar clientes ao seu restaurante.</h1><p style="font-size:15px;line-height:1.65;color:#685d52">${escapeHtml(partnerName)} convidou o seu restaurante a aderir ao MesaLink para começar a receber novos clientes através da nossa plataforma e respetivos parceiros.</p><p style="font-size:15px;line-height:1.65;color:#685d52">Cada reserva representa mais mesas ocupadas e mais faturação para o restaurante.</p><div style="margin:20px 0;border:1px solid #e4d3b9;border-radius:16px;background:#fff9ef;padding:17px;font-size:14px;line-height:1.7"><strong>Como funciona:</strong><br>${escapeHtml(partnerName)} envia-lhe clientes através do MesaLink.<br>A comissão é definida por pessoa e negociada diretamente entre ambos.<br>O restaurante controla a disponibilidade, os horários e as reservas.</div><a href="${destinationUrl}" style="display:inline-block;border-radius:999px;background:#17120d;padding:15px 24px;color:white;text-decoration:none;font-weight:700">Começar a receber clientes</a><p style="margin-top:22px;font-size:12px;line-height:1.55;color:#918577">Convite enviado por ${escapeHtml(partnerName)}. As respostas seguem diretamente para ${escapeHtml(partner.email)}.</p></div></div></div>`,
  }, { idempotencyKey: `restaurant-referral-${invitation.id}` }).catch(() => null);
  if (!delivery || delivery.error) {
    await prisma.referralPartnerRestaurantInvitation.deleteMany({ where: { id: invitation.id, acceptedAt: null } }).catch(() => undefined);
    return NextResponse.json({ error: "Não foi possível enviar o convite." }, { status: 502 });
  }
  return NextResponse.json({ success: true });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
}
