import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasGrowthAccess } from "@/lib/ai-billing";
import {
  getRevenueChannelStatus,
  getTwilioClient,
  getTwilioCredentials,
  normalizeContentSid,
  normalizeE164,
} from "@/lib/revenue-twilio";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!user) return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
  if (!hasGrowthAccess(user.subscription)) return NextResponse.json({ error: "O Revenue AI está disponível no plano Growth." }, { status: 403 });
  const current = await prisma.restaurant.findFirst({ where: { id, userId: user.id } });
  if (!current) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const whatsappEnabled = body?.whatsappEnabled === true;
  const voiceEnabled = body?.voiceEnabled === true;
  const whatsappAutoReply = body?.whatsappAutoReply !== false;
  const missedCallAutoReply = body?.missedCallAutoReply !== false;
  const rawWhatsappNumber = typeof body?.whatsappNumber === "string" ? body.whatsappNumber.trim() : "";
  const rawVoiceNumber = typeof body?.voiceNumber === "string" ? body.voiceNumber.trim() : "";
  const rawForwardNumber = typeof body?.forwardNumber === "string" ? body.forwardNumber.trim() : "";
  const rawContentSid = typeof body?.contentSid === "string" ? body.contentSid.trim() : "";
  const whatsappNumber = rawWhatsappNumber ? normalizeE164(rawWhatsappNumber) : null;
  const voiceNumber = rawVoiceNumber ? normalizeE164(rawVoiceNumber) : null;
  const forwardNumber = rawForwardNumber ? normalizeE164(rawForwardNumber) : null;
  const contentSid = rawContentSid ? normalizeContentSid(rawContentSid) : null;

  if (rawWhatsappNumber && !whatsappNumber) return NextResponse.json({ error: "O número WhatsApp deve incluir o indicativo, por exemplo +351912345678." }, { status: 400 });
  if (rawVoiceNumber && !voiceNumber) return NextResponse.json({ error: "O número de chamadas deve incluir o indicativo, por exemplo +351210000000." }, { status: 400 });
  if (rawForwardNumber && !forwardNumber) return NextResponse.json({ error: "O telefone do restaurante deve incluir o indicativo, por exemplo +351912345678." }, { status: 400 });
  if (rawContentSid && !contentSid) return NextResponse.json({ error: "O identificador do modelo deve começar por HX e conter 34 caracteres." }, { status: 400 });
  if (whatsappEnabled && !whatsappNumber) return NextResponse.json({ error: "Indica o número WhatsApp antes de ativar o canal." }, { status: 400 });
  if (voiceEnabled && (!voiceNumber || !forwardNumber)) return NextResponse.json({ error: "Indica o número de deteção MesaLink e o telefone público do restaurante antes de ativar as chamadas." }, { status: 400 });

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/+$/, "");
  let providerWarning: string | null = null;
  if ((whatsappEnabled || voiceEnabled) && getTwilioCredentials().configured) {
    try {
      const client = getTwilioClient();
      await client.api.accounts(getTwilioCredentials().accountSid).fetch();
      const numbers = new Set([whatsappNumber, voiceNumber].filter((value): value is string => Boolean(value)));
      for (const phoneNumber of numbers) {
        const matches = await client.incomingPhoneNumbers.list({ phoneNumber, limit: 2 });
        const owned = matches.find((item) => normalizeE164(item.phoneNumber) === phoneNumber);
        if (!owned) {
          providerWarning = `O número ${phoneNumber} foi guardado, mas não foi encontrado na conta Twilio do MesaLink. O webhook terá de ser configurado manualmente.`;
          continue;
        }
        await client.incomingPhoneNumbers(owned.sid).update({
          voiceUrl: `${baseUrl}/api/revenue-ai/webhooks/twilio/voice/incoming`,
          voiceMethod: "POST",
          smsUrl: `${baseUrl}/api/revenue-ai/webhooks/twilio/whatsapp`,
          smsMethod: "POST",
        });
      }
    } catch (error) {
      providerWarning = error instanceof Error ? `A configuração foi guardada, mas o fornecedor respondeu: ${error.message}` : "A configuração foi guardada, mas o fornecedor não respondeu.";
    }
  } else if (whatsappEnabled || voiceEnabled) {
    providerWarning = "A configuração do restaurante foi guardada. Falta ativar as credenciais centrais Twilio do MesaLink.";
  }

  try {
    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        revenueWhatsappEnabled: whatsappEnabled,
        revenueWhatsappNumber: whatsappNumber,
        revenueWhatsappContentSid: contentSid,
        revenueWhatsappAutoReply: whatsappAutoReply,
        revenueVoiceEnabled: voiceEnabled,
        revenueVoiceNumber: voiceNumber,
        revenueVoiceForwardNumber: forwardNumber,
        revenueMissedCallAutoReply: missedCallAutoReply,
        revenueChannelsConfiguredAt: new Date(),
        revenueChannelsLastError: providerWarning,
      },
    });
    return NextResponse.json({ success: true, warning: providerWarning, status: getRevenueChannelStatus(restaurant) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Este número já está associado a outro restaurante MesaLink." }, { status: 409 });
    }
    throw error;
  }
}
