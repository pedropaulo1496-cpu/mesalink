import twilio from "twilio";

export const REVENUE_CHANNEL_CREDIT_COSTS = {
  VOICE_STARTED_MINUTES: 2,
} as const;

type RevenueChannelRestaurant = {
  revenueWhatsappEnabled: boolean;
  revenueWhatsappNumber: string | null;
  revenueWhatsappContentSid: string | null;
  revenueVoiceEnabled: boolean;
  revenueVoiceNumber: string | null;
  revenueVoiceForwardNumber: string | null;
};

export class InvalidTwilioWebhookError extends Error {
  constructor() {
    super("Invalid Twilio webhook signature");
    this.name = "InvalidTwilioWebhookError";
  }
}

export function getTwilioCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim() || "";
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim() || "";
  return { accountSid, authToken, configured: Boolean(accountSid && authToken) };
}

export function getTwilioClient() {
  const credentials = getTwilioCredentials();
  if (!credentials.configured) throw new Error("O conector Twilio do MesaLink ainda não está configurado.");
  return twilio(credentials.accountSid, credentials.authToken);
}

export function getRevenueChannelStatus(restaurant: RevenueChannelRestaurant) {
  const providerConfigured = getTwilioCredentials().configured;
  const whatsappConfigured = Boolean(restaurant.revenueWhatsappNumber);
  const whatsappReady = Boolean(providerConfigured && restaurant.revenueWhatsappEnabled && whatsappConfigured);
  const whatsappProactiveReady = Boolean(whatsappReady && restaurant.revenueWhatsappContentSid);
  const voiceConfigured = Boolean(restaurant.revenueVoiceNumber && restaurant.revenueVoiceForwardNumber);
  const voiceReady = Boolean(providerConfigured && restaurant.revenueVoiceEnabled && voiceConfigured);
  return { providerConfigured, whatsappConfigured, whatsappReady, whatsappProactiveReady, voiceConfigured, voiceReady };
}

export function normalizeE164(value: string | null | undefined) {
  const cleaned = String(value || "").trim().replace(/^whatsapp:/i, "").replace(/[\s().-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(cleaned)) return null;
  return cleaned;
}

export function normalizeContentSid(value: string | null | undefined) {
  const cleaned = String(value || "").trim();
  return /^HX[a-fA-F0-9]{32}$/.test(cleaned) ? cleaned : null;
}

export function whatsappAddress(phone: string) {
  return `whatsapp:${phone}`;
}

export function getPublicWebhookUrl(request: Request) {
  const incoming = new URL(request.url);
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  return configuredOrigin ? `${configuredOrigin}${incoming.pathname}${incoming.search}` : request.url;
}

export async function readValidatedTwilioForm(request: Request) {
  const form = await request.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of form.entries()) params[key] = typeof value === "string" ? value : value.name;

  const credentials = getTwilioCredentials();
  const maySkip = process.env.NODE_ENV !== "production" && process.env.TWILIO_SKIP_SIGNATURE_VALIDATION === "true";
  const signature = request.headers.get("x-twilio-signature") || "";
  const valid = maySkip || (credentials.configured && twilio.validateRequest(credentials.authToken, signature, getPublicWebhookUrl(request), params));
  if (!valid) throw new InvalidTwilioWebhookError();
  return params;
}

export function twimlResponse(xml: string, status = 200) {
  return new Response(xml, { status, headers: { "Content-Type": "text/xml; charset=utf-8", "Cache-Control": "no-store" } });
}

export function emptyTwimlResponse() {
  return twimlResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>");
}

export function getVoiceCredits(durationSeconds: number) {
  return Math.max(1, Math.ceil(Math.max(0, durationSeconds) / (REVENUE_CHANNEL_CREDIT_COSTS.VOICE_STARTED_MINUTES * 60)));
}

export async function sendRevenueWhatsapp(input: {
  from: string;
  to: string;
  content: string;
  contactName: string;
  restaurantName: string;
  contentSid?: string | null;
  allowFreeform: boolean;
}) {
  const statusCallback = `${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "")}/api/revenue-ai/webhooks/twilio/whatsapp/status`;
  const base = {
    from: whatsappAddress(input.from),
    to: whatsappAddress(input.to),
    statusCallback,
  };

  if (input.allowFreeform) {
    return getTwilioClient().messages.create({ ...base, body: input.content });
  }
  if (!input.contentSid) throw new Error("É necessário um modelo WhatsApp aprovado para iniciar esta conversa.");
  return getTwilioClient().messages.create({
    ...base,
    contentSid: input.contentSid,
    contentVariables: JSON.stringify({ "1": input.contactName, "2": input.content, "3": input.restaurantName }),
  });
}

export { twilio };
