import { createHash, randomBytes } from "crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { formatDateTimeInTimeZone, reservationTimeZone } from "@/lib/reservation-time-zone";

export const EXTERNAL_REFERRAL_COMMISSION_PER_PERSON = 1.5;
export const EXTERNAL_REFERRAL_MAX_ADVANCE_DAYS = 6;
export const EXTERNAL_REFERRAL_SIMULATION_MARKER = "[SIMULAÇÃO]";

export function isExternalReferralSimulation(offer: { group: { publicCode: string; notes: string | null } }) {
  return offer.group.publicCode.startsWith("SIM-") && offer.group.notes?.startsWith(EXTERNAL_REFERRAL_SIMULATION_MARKER) === true;
}

export function externalReferralTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function externalReferralBaseUrl(requestUrl?: string) {
  return (process.env.NEXT_PUBLIC_APP_URL || (requestUrl ? new URL(requestUrl).origin : "https://www.mesalink.pt")).replace(/\/$/, "");
}

export function externalReferralExpiry(desiredDate: Date, now = new Date()) {
  const latest = new Date(now.getTime() + EXTERNAL_REFERRAL_MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000);
  const beforeReservation = new Date(desiredDate.getTime() - 30 * 60 * 1000);
  return beforeReservation < latest ? beforeReservation : latest;
}

export async function findExternalReferralOffer(token: string) {
  if (!/^[A-Za-z0-9_-]{32,200}$/.test(token)) return null;
  return prisma.referralOffer.findUnique({
    where: { publicAccessTokenHash: externalReferralTokenHash(token) },
    include: { group: { include: { partner: true, payment: true } }, restaurant: true },
  });
}

export async function issueExternalReferralAccess(offerId: string, requestUrl?: string) {
  const offer = await prisma.referralOffer.findUnique({
    where: { id: offerId },
    include: { group: { include: { partner: true } }, restaurant: true },
  });
  if (!offer || offer.group.targetMode !== "EXTERNAL" || !offer.restaurant.email) {
    throw new Error("EXTERNAL_REFERRAL_CONTACT_MISSING");
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = externalReferralTokenHash(token);
  const expiresAt = externalReferralExpiry(offer.group.desiredDate);
  if (expiresAt <= new Date()) throw new Error("EXTERNAL_REFERRAL_EXPIRED");
  await prisma.referralOffer.update({
    where: { id: offer.id },
    data: { publicAccessTokenHash: tokenHash, publicAccessExpiresAt: expiresAt },
  });

  const responseUrl = `${externalReferralBaseUrl(requestUrl)}/partner-reservation/${token}`;
  const timeZone = reservationTimeZone(offer.restaurant);
  const date = formatDateTime(offer.group.desiredDate, timeZone);
  const simulation = isExternalReferralSimulation(offer);
  const resend = mailer();
  let delivery;
  try {
    delivery = await resend.emails.send({
      from: "MesaLink Reservas <info@mesalink.pt>",
      to: offer.restaurant.email,
      replyTo: "info@mesalink.pt",
      subject: `${simulation ? "[SIMULAÇÃO] " : ""}Reserva pendente de confirmação · ${offer.group.guests} pessoas · ${date}`,
      text: `Olá,\n\n${simulation ? "Esta é uma simulação segura do fluxo de pedidos de grupo. Não existe um cliente real e nenhuma opção gera cobrança.\n\n" : ""}Recebemos um pedido de reserva para ${offer.restaurant.name}.\n\nReserva pendente de confirmação\nData e hora: ${date}\nPessoas: ${offer.group.guests}\nNome da reserva: ${offer.group.customerName || "Cliente MesaLink"}\nReferência: ${offer.group.publicCode}\n\nAceite, recuse ou sugira outro horário através desta ligação segura:\n${responseUrl}\n\nA ligação é válida até ${formatDateTime(expiresAt, timeZone)}.${simulation ? " Todas as respostas são apenas demonstrativas." : " Os contactos completos do cliente são disponibilizados após a confirmação."}\n\nMesaLink Reservas\ninfo@mesalink.pt`,
      html: requestEmailHtml({
        restaurantName: offer.restaurant.name,
        customerName: offer.group.customerName || "Cliente MesaLink",
        guests: offer.group.guests,
        date,
        code: offer.group.publicCode,
        responseUrl,
        expiresAt: formatDateTime(expiresAt, timeZone),
        simulation,
      }),
    });
    if (delivery.error) throw new Error(delivery.error.message);
  } catch (error) {
    await prisma.referralOffer.updateMany({
      where: { id: offer.id, publicAccessTokenHash: tokenHash },
      data: { publicAccessTokenHash: offer.publicAccessTokenHash, publicAccessExpiresAt: offer.publicAccessExpiresAt },
    }).catch(() => undefined);
    throw error;
  }
  return { token, expiresAt, deliveryId: delivery.data?.id || null };
}

export async function notifyExternalReferralOutcome(offerId: string, outcome: "DECLINED" | "ALTERNATIVE") {
  const offer = await prisma.referralOffer.findUnique({
    where: { id: offerId },
    include: { group: { include: { partner: true } }, restaurant: { select: { name: true, address: true, latitude: true, longitude: true, billingCountry: true } } },
  });
  if (!offer) return;
  const timeZone = reservationTimeZone(offer.restaurant);
  const alternative = offer.group.alternativeDate ? formatDateTime(offer.group.alternativeDate, timeZone) : null;
  const subject = outcome === "DECLINED"
    ? `Reserva ${offer.group.publicCode} recusada`
    : `Novo horário proposto · reserva ${offer.group.publicCode}`;
  const message = outcome === "DECLINED"
    ? `${offer.restaurant.name} não confirmou a reserva para ${formatDateTime(offer.group.desiredDate, timeZone)}.`
    : `${offer.restaurant.name} propôs ${alternative} para a reserva de ${offer.group.guests} pessoas.`;
  const appUrl = `${externalReferralBaseUrl()}/partners/app?tab=history`;
  const delivery = await mailer().emails.send({
    from: "MesaLink Reservas <info@mesalink.pt>",
    to: offer.group.partner.email,
    replyTo: "info@mesalink.pt",
    subject,
    text: `${message}\n\nConsulta e responde na app MesaLink Partners: ${appUrl}`,
    html: `<div style="margin:0;background:#f4eee5;padding:28px 14px;font-family:Arial,sans-serif;color:#17120d"><div style="max-width:600px;margin:auto;border:1px solid #dfcfb8;border-radius:22px;background:white;overflow:hidden"><div style="background:#17120d;padding:22px 26px;color:white"><strong style="font-family:Georgia,serif;font-size:24px"><span style="color:#d7b267">Mesa</span>Link</strong></div><div style="padding:28px"><p style="font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#9b6f3b">Atualização da reserva</p><h1 style="font:700 27px/1.2 Georgia,serif">${escapeHtml(subject)}</h1><p style="font-size:15px;line-height:1.65;color:#685d52">${escapeHtml(message)}</p><a href="${appUrl}" style="display:inline-block;margin-top:12px;border-radius:999px;background:#17120d;padding:14px 22px;color:white;text-decoration:none;font-weight:700">Abrir MesaLink Partners</a></div></div></div>`,
  });
  if (delivery.error) throw new Error(delivery.error.message);
}

export async function notifyExternalReferralCancellation(offerId: string) {
  const offer = await prisma.referralOffer.findUnique({
    where: { id: offerId },
    include: { group: { include: { partner: true } }, restaurant: { select: { name: true, email: true, address: true, latitude: true, longitude: true, billingCountry: true } } },
  });
  if (!offer?.restaurant.email) return;
  const simulation = isExternalReferralSimulation(offer);
  const subject = `${simulation ? "[SIMULAÇÃO] " : ""}Pedido de reserva ${offer.group.publicCode} cancelado`;
  const timeZone = reservationTimeZone(offer.restaurant);
  const message = `${offer.group.partner.businessName} cancelou o pedido para ${formatDateTime(offer.group.desiredDate, timeZone)}. Não é necessária qualquer ação e a ligação anterior já não permite responder.`;
  const delivery = await mailer().emails.send({
    from: "MesaLink Reservas <info@mesalink.pt>",
    to: offer.restaurant.email,
    replyTo: "info@mesalink.pt",
    subject,
    text: `Olá equipa ${offer.restaurant.name},\n\n${message}\n\nReferência: ${offer.group.publicCode}\n\nMesaLink Reservas\ninfo@mesalink.pt`,
    html: `<div style="margin:0;background:#f4eee5;padding:28px 14px;font-family:Arial,sans-serif;color:#17120d"><div style="max-width:600px;margin:auto;border:1px solid #dfcfb8;border-radius:22px;background:white;overflow:hidden"><div style="background:#17120d;padding:22px 26px;color:white"><strong style="font-family:Georgia,serif;font-size:24px"><span style="color:#d7b267">Mesa</span>Link</strong></div><div style="padding:28px"><p style="font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#934a35">Pedido cancelado</p><h1 style="font:700 27px/1.2 Georgia,serif">${escapeHtml(subject)}</h1><p style="font-size:15px;line-height:1.65;color:#685d52">${escapeHtml(message)}</p><div style="margin-top:18px;border:1px solid #e4d3b9;border-radius:14px;background:#fff9ef;padding:14px;font-size:12px;color:#806f5c">Referência ${escapeHtml(offer.group.publicCode)}</div></div></div></div>`,
  });
  if (delivery.error) throw new Error(delivery.error.message);
}

function mailer() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_NOT_CONFIGURED");
  return new Resend(process.env.RESEND_API_KEY);
}

function requestEmailHtml(input: { restaurantName: string; customerName: string; guests: number; date: string; code: string; responseUrl: string; expiresAt: string; simulation: boolean }) {
  const simulationNotice = input.simulation ? `<div style="margin-bottom:18px;border:1px solid #9fc9a2;border-radius:14px;background:#edf8ee;padding:13px 15px;color:#315b36;font-size:13px;line-height:1.55"><strong>Simulação segura</strong><br>Não existe um cliente real e nenhuma resposta gera cobrança.</div>` : "";
  return `<div style="margin:0;background:#f4eee5;padding:28px 14px;font-family:Arial,sans-serif;color:#17120d"><div style="max-width:620px;margin:auto;border:1px solid #dfcfb8;border-radius:22px;background:white;overflow:hidden"><div style="background:#17120d;padding:22px 26px;color:white"><strong style="font-family:Georgia,serif;font-size:24px"><span style="color:#d7b267">Mesa</span>Link</strong></div><div style="padding:30px 28px">${simulationNotice}<p style="font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#9b6f3b">${input.simulation ? "Simulação · " : ""}Reserva pendente de confirmação</p><h1 style="margin:10px 0 14px;font:700 29px/1.16 Georgia,serif">Novo pedido para ${escapeHtml(input.restaurantName)}</h1><div style="border:1px solid #e4d3b9;border-radius:16px;background:#fff9ef;padding:18px;font-size:15px;line-height:1.75"><strong>${escapeHtml(input.customerName)}</strong><br>${input.guests} pessoas<br>${escapeHtml(input.date)}<br><span style="font-size:12px;color:#806f5c">Referência ${escapeHtml(input.code)}</span></div><p style="font-size:14px;line-height:1.65;color:#685d52">Confirme a reserva, recuse ou sugira outro horário através da ligação segura. ${input.simulation ? "Todas as respostas são apenas demonstrativas." : "Os contactos completos do cliente são disponibilizados após a confirmação."}</p><a href="${input.responseUrl}" style="display:inline-block;margin-top:8px;border-radius:999px;background:#17120d;padding:15px 24px;color:white;text-decoration:none;font-weight:700">Responder ao pedido</a><p style="margin-top:22px;font-size:11px;line-height:1.55;color:#918577">Ligação válida até ${escapeHtml(input.expiresAt)}.</p></div></div></div>`;
}

function formatDateTime(value: Date, timeZone: string) {
  return formatDateTimeInTimeZone(value, timeZone);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!);
}
