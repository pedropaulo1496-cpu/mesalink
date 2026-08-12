import { prisma } from "@/lib/prisma";
import {
  InvalidTwilioWebhookError,
  normalizeE164,
  readValidatedTwilioForm,
  twilio,
  twimlResponse,
} from "@/lib/revenue-twilio";

export async function POST(request: Request) {
  try {
    const payload = await readValidatedTwilioForm(request);
    const to = normalizeE164(payload.To);
    const response = new twilio.twiml.VoiceResponse();
    if (!to) {
      response.say({ language: "pt-PT" }, "Não foi possível encaminhar esta chamada.");
      response.hangup();
      return twimlResponse(response.toString());
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { revenueVoiceNumber: to } });
    const publicRestaurantNumber = normalizeE164(restaurant?.revenueVoiceForwardNumber);
    if (!restaurant?.revenueVoiceEnabled || !publicRestaurantNumber) {
      response.say({ language: "pt-PT" }, "Este canal encontra-se temporariamente indisponível. Por favor, tente novamente mais tarde.");
      response.hangup();
      return twimlResponse(response.toString());
    }

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/+$/, "");
    const action = `${baseUrl}/api/revenue-ai/webhooks/twilio/voice/status?restaurantId=${encodeURIComponent(restaurant.id)}&forwarded=1`;
    response.redirect({ method: "POST" }, action);
    return twimlResponse(response.toString());
  } catch (error) {
    if (error instanceof InvalidTwilioWebhookError) return new Response("Invalid signature", { status: 403 });
    console.error("Revenue voice incoming webhook failed", error);
    return new Response("Webhook failed", { status: 500 });
  }
}
