import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json(
      { error: "Email obrigatório." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = randomBytes(32).toString("hex");

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`;

  await resend.emails.send({
    from: "MesaLink <noreply@mesalink.pt>",
    to: email,
    subject: "Recuperar password - MesaLink",
    html: `
      <h1>Recuperar password</h1>
      <p>Clica no link abaixo para criares uma nova password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Este link expira em 30 minutos.</p>
    `,
  });

  return NextResponse.json({ ok: true });
}