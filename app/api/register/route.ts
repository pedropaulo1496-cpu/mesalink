import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";
import { notifyNewClient } from "@/lib/hq-notifications";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, email, password, commercialInvite } = await request.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const invitationToken = String(commercialInvite || "").trim();

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: "Email e password são obrigatórios." }, { status: 400 });
    }
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: "Introduza um email válido." }, { status: 400 });
    }

    const invitation = invitationToken ? await prisma.salesClientInvitation.findUnique({
      where: { token: invitationToken },
      include: { salesRepresentative: { select: { active: true } } },
    }) : null;
    if (invitationToken && (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date() || !invitation.salesRepresentative.active || invitation.email !== normalizedEmail)) {
      return NextResponse.json({ error: "Este convite comercial é inválido, expirou ou pertence a outro email." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { subscription: { select: { id: true } }, _count: { select: { restaurants: true } } },
    });
    if (existingUser && (existingUser.subscription || existingUser._count.restaurants > 0)) {
      return NextResponse.json({ error: "Já existe uma conta MesaLink Restaurante com este email." }, { status: 400 });
    }
    if (invitation && existingUser?.salesRepresentativeId && existingUser.salesRepresentativeId !== invitation.salesRepresentativeId) {
      return NextResponse.json({ error: "Esta conta já está associada a outro comercial MesaLink." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const subscription = {
      plan: "ESSENTIALS",
      status: "TRIAL",
      trialEndsAt: new Date(Date.now() + 7 * 86_400_000),
      restaurantLimit: 1,
      priceMonthly: 0,
    };
    const registeredUser = await prisma.$transaction(async (tx) => {
      let user;
      if (existingUser) {
        user = await tx.user.update({
          where: { id: existingUser.id },
          data: { name: name || existingUser.name, passwordHash, salesRepresentativeId: invitation?.salesRepresentativeId, subscription: { create: subscription } },
        });
      } else {
        user = await tx.user.create({
          data: { name, email: normalizedEmail, passwordHash, salesRepresentativeId: invitation?.salesRepresentativeId, subscription: { create: subscription } },
        });
      }
      if (invitation) {
        await tx.salesClientInvitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
      }
      return user;
    });

    await notifyNewClient({ name: registeredUser.name || "", email: registeredUser.email, salesRepresentativeId: registeredUser.salesRepresentativeId })
      .catch((error) => console.error("New client push failed", error));

    await resend.emails.send({
      from: "MesaLink <noreply@mesalink.pt>",
      to: normalizedEmail,
      subject: "Bem-vindo ao MesaLink",
      html: `<div style="font-family:Arial,sans-serif;background:#070504;padding:32px;color:#fff7ea"><div style="max-width:600px;margin:0 auto;background:#15100b;border:1px solid rgba(240,195,106,.2);border-radius:24px;padding:32px"><h1 style="margin:0 0 16px;font-size:32px">Mesa<span style="color:#f0c36a">Link</span></h1><h2 style="font-size:26px;margin:24px 0 12px">Bem-vindo ao MesaLink${name ? `, ${escapeHtml(String(name))}` : ""}!</h2><p style="color:#d6c7ad;font-size:16px;line-height:1.6">A sua conta foi criada com sucesso. O seu trial gratuito de 7 dias já está ativo${invitation ? " e o seu comercial ficou automaticamente associado" : ""}.</p><ol style="color:#d6c7ad;font-size:16px;line-height:1.8"><li>Criar o restaurante</li><li>Configurar horários e mesas</li><li>Partilhar o link público de reservas</li></ol><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://www.mesalink.pt"}/login" style="display:inline-block;margin-top:24px;background:#f0c36a;color:#000;padding:14px 22px;border-radius:999px;font-weight:bold;text-decoration:none">Entrar no MesaLink</a></div></div>`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar conta." }, { status: 500 });
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
}
