import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";

const REGISTER_URL = "https://www.mesalink.pt/partners/register?utm_source=partner_invite&utm_medium=email&utm_campaign=partner_referral";

export async function POST(request: Request) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 160) : "";
  if (!isValidEmail(email)) return NextResponse.json({ error: "Indica um email válido." }, { status: 400 });
  if (email === partner.email.toLowerCase()) return NextResponse.json({ error: "Este é o email da tua própria conta Partners." }, { status: 400 });
  const existing = await prisma.referralPartner.findUnique({ where: { email }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "Este email já tem uma conta MesaLink Partners." }, { status: 409 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "Envio temporariamente indisponível." }, { status: 503 });

  const partnerName = partner.businessName || partner.contactName || "Um parceiro MesaLink";
  const delivery = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: "MesaLink Partners <info@mesalink.pt>",
    to: email,
    replyTo: partner.email,
    subject: `${partnerName} convidou-o para o MesaLink Partners`,
    text: `Olá,\n\n${partnerName} convidou-o a aderir ao MesaLink Partners.\n\nNa plataforma pode reservar restaurantes para os seus clientes, acompanhar cada confirmação e receber a comissão acordada por pessoa. A mesma conta funciona no computador e na app Android.\n\nCriar conta Partners: ${REGISTER_URL}\n\nEste convite foi enviado por ${partnerName}. Pode responder diretamente a este email para falar com o parceiro.\n\nEquipa MesaLink Partners\ninfo@mesalink.pt`,
    html: `<div style="margin:0;background:#f5efe6;padding:28px 14px;font-family:Arial,sans-serif;color:#17120d"><div style="max-width:620px;margin:auto;overflow:hidden;border:1px solid #dfcfb8;border-radius:22px;background:white"><div style="background:#17120d;padding:24px 28px;color:white"><strong style="font:700 26px Georgia,serif"><span style="color:#d7b267">Mesa</span>Link</strong><span style="margin-left:8px;color:#d7b267">Partners</span></div><div style="padding:30px 28px"><p style="font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#9b6f3b">Convite pessoal</p><h1 style="margin:10px 0 16px;font:700 29px/1.16 Georgia,serif">${escapeHtml(partnerName)} convidou-o para a rede.</h1><p style="font-size:15px;line-height:1.65;color:#685d52">Use o MesaLink Partners para reservar restaurantes para os seus clientes e receber a comissão acordada por pessoa.</p><div style="margin:20px 0;border:1px solid #e4d3b9;border-radius:16px;background:#fff9ef;padding:17px;font-size:14px;line-height:1.7"><strong>Com uma única conta pode:</strong><br>Pesquisar e reservar restaurantes<br>Acompanhar confirmações e alterações<br>Consultar comissões, faturas e pagamentos<br>Usar no computador ou na app Android</div><a href="${REGISTER_URL}" style="display:inline-block;border-radius:999px;background:#17120d;padding:15px 24px;color:white;text-decoration:none;font-weight:700">Criar conta MesaLink Partners</a><p style="margin-top:22px;font-size:12px;line-height:1.55;color:#918577">Convite enviado por ${escapeHtml(partnerName)}. As respostas seguem diretamente para ${escapeHtml(partner.email)}.</p></div></div></div>`,
  }, { idempotencyKey: `partner-referral-${partner.id}-${createHash("sha256").update(email).digest("hex").slice(0, 24)}` });
  if (delivery.error) return NextResponse.json({ error: "Não foi possível enviar o convite." }, { status: 502 });
  return NextResponse.json({ success: true });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
}
