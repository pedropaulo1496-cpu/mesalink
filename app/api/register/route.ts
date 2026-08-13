import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { error: "Email e password são obrigatórios." },
        { status: 400 },
      );
    }

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Introduza um email válido." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { subscription: { select: { id: true } }, _count: { select: { restaurants: true } } },
    });

    if (existingUser && (existingUser.subscription || existingUser._count.restaurants > 0)) {
      return NextResponse.json(
        { error: "Já existe uma conta MesaLink Restaurante com este email." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const subscription = {
      plan: "ESSENTIALS",
      status: "TRIAL",
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      restaurantLimit: 1,
      priceMonthly: 0,
    };
    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { name: name || existingUser.name, passwordHash, subscription: { create: subscription } },
      });
    } else {
      await prisma.user.create({
        data: { name, email: normalizedEmail, passwordHash, subscription: { create: subscription } },
      });
    }

    await resend.emails.send({
      from: "MesaLink <noreply@mesalink.pt>",
      to: normalizedEmail,
      subject: "Bem-vindo ao MesaLink",
      html: `
        <div style="font-family: Arial, sans-serif; background:#070504; padding:32px; color:#fff7ea;">
          <div style="max-width:600px; margin:0 auto; background:#15100b; border:1px solid rgba(240,195,106,0.2); border-radius:24px; padding:32px;">
            <h1 style="margin:0 0 16px; font-size:32px;">Mesa<span style="color:#f0c36a;">Link</span></h1>
            <h2 style="font-size:26px; margin:24px 0 12px;">Bem-vindo ao MesaLink${name ? `, ${name}` : ""}!</h2>
            <p style="color:#d6c7ad; font-size:16px; line-height:1.6;">A sua conta foi criada com sucesso. O seu trial gratuito de 7 dias já está ativo.</p>
            <ol style="color:#d6c7ad; font-size:16px; line-height:1.8;"><li>Criar o restaurante</li><li>Configurar horários e mesas</li><li>Partilhar o link público de reservas</li></ol>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="display:inline-block; margin-top:24px; background:#f0c36a; color:#000; padding:14px 22px; border-radius:999px; font-weight:bold; text-decoration:none;">Entrar no MesaLink</a>
            <p style="margin-top:32px; color:#8d7b60; font-size:13px;">Restaurant essentials by MesaLink.</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar conta." }, { status: 500 });
  }
}
