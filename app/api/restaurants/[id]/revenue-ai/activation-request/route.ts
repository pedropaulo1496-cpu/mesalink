import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { authOptions } from "@/lib/auth";
import { hasGrowthAccess } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";
import { normalizeE164 } from "@/lib/revenue-twilio";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!user || !hasGrowthAccess(user.subscription)) return NextResponse.json({ error: "O Revenue AI requer o plano Growth." }, { status: 403 });
  const restaurant = await prisma.restaurant.findFirst({ where: { id, userId: user.id } });
  if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const wantsWhatsapp = body?.wantsWhatsapp === true;
  const wantsCalls = body?.wantsCalls === true;
  const contactPhone = normalizeE164(typeof body?.contactPhone === "string" ? body.contactPhone : "");
  if (!wantsWhatsapp && !wantsCalls) return NextResponse.json({ error: "Escolhe WhatsApp, chamadas não atendidas ou ambos." }, { status: 400 });
  if (!contactPhone) return NextResponse.json({ error: "Indica o telefone público do restaurante com indicativo, por exemplo +351213000000." }, { status: 400 });

  const channels = [wantsWhatsapp ? "WHATSAPP" : "", wantsCalls ? "VOICE" : ""].filter(Boolean).join("+");
  const details = JSON.stringify({ contactPhone, requestedBy: session.user.email, channels });
  const previous = await prisma.marketingAction.findFirst({ where: { restaurantId: id, type: "CHANNEL_ACTIVATION_REQUEST", status: { in: ["REQUESTED", "PREPARING"] } }, orderBy: { createdAt: "desc" } });
  if (previous) {
    await prisma.marketingAction.update({ where: { id: previous.id }, data: { channel: channels, failureReason: details, sentAt: new Date() } });
  } else {
    await prisma.marketingAction.create({ data: { restaurantId: id, type: "CHANNEL_ACTIVATION_REQUEST", status: "REQUESTED", channel: channels, failureReason: details } });
  }

  await prisma.restaurant.update({ where: { id }, data: { revenueVoiceForwardNumber: contactPhone, revenueChannelsConfiguredAt: new Date() } });

  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: "MesaLink <noreply@mesalink.pt>",
      to: "info@mesalink.pt",
      replyTo: session.user.email,
      subject: `Ativação Revenue AI — ${restaurant.name}`,
      html: `<div style="font-family:Arial,sans-serif"><h1>Pedido de ativação Revenue AI</h1><p><strong>Restaurante:</strong> ${escapeHtml(restaurant.name)}</p><p><strong>Conta:</strong> ${escapeHtml(session.user.email)}</p><p><strong>Contacto:</strong> ${escapeHtml(contactPhone)}</p><p><strong>Ativar:</strong> ${escapeHtml(channels)}</p><p><strong>ID:</strong> ${escapeHtml(id)}</p></div>`,
    }).catch((error) => console.error("Não foi possível enviar o alerta de ativação Revenue AI:", error));
  }

  return NextResponse.json({ success: true, requestedAt: new Date().toISOString(), channels });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] || char);
}
