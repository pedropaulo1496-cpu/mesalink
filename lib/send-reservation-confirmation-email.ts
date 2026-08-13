import { Resend } from "resend";
import { completeEmailSend, refundEmailSend, reserveEmailSend } from "@/lib/email-billing";
import { requireAcceptedEmail } from "@/lib/email-delivery";
import { marketingBenefitValue } from "@/lib/marketing-card-themes";
import { prisma } from "@/lib/prisma";
import { reservationManagementUrl } from "@/lib/reservation-management";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReservationConfirmationEmail(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      experience: true,
      experienceAddOns: true,
      payment: true,
      marketingPromoCard: true,
      restaurant: { include: { user: { include: { subscription: true } } } },
    },
  });
  if (!reservation?.restaurant?.userId || !reservation.email || !process.env.RESEND_API_KEY) return false;
  const plan = String(reservation.restaurant.user?.subscription?.plan || reservation.restaurant.plan || "").toUpperCase();
  if (!["ESSENTIALS", "GROWTH", "PRO"].includes(plan)) return false;

  const reference = `email:reservation_confirmation:${reservation.id}`;
  let reserved = false;
  try {
    const allowance = await reserveEmailSend({
      userId: reservation.restaurant.userId,
      restaurantId: reservation.restaurant.id,
      category: "RESERVATION_CONFIRMATION",
      reference,
    });
    if (!allowance.canSend) return false;
    reserved = true;
    const pending = reservation.status === "PENDING";
    const paid = reservation.payment?.status === "PAID";
    const manageUrl = reservationManagementUrl(reservation.id, reservation.email);
    const cancelUrl = reservationManagementUrl(reservation.id, reservation.email, "cancel");
    const experienceRows = reservation.experience ? `
      <p><strong>Experiência:</strong> ${escapeHtml(reservation.experience.title)}</p>
      ${reservation.experienceAddOns.length ? `<p><strong>Extras:</strong> ${escapeHtml(reservation.experienceAddOns.map((item) => `${item.nameSnapshot} × ${item.quantity}`).join(", "))}</p>` : ""}
    ` : "";
    const paymentRow = paid ? `<p><strong>Pré-pagamento:</strong> ${formatMoney(Number(reservation.payment?.baseAmount || 0) + Number(reservation.payment?.addOnsAmount || 0))} pago</p>` : "";
    const offerRow = reservation.marketingPromoCard ? `<p><strong>Oferta:</strong> ${escapeHtml(`${reservation.marketingPromoCard.title} · ${marketingBenefitValue(reservation.marketingPromoCard.benefitType, reservation.marketingPromoCard.value == null ? null : Number(reservation.marketingPromoCard.value), reservation.marketingPromoCard.benefitLabel)}`)}</p>` : "";

    const delivery = await resend.emails.send({
      from: "MesaLink <noreply@mesalink.pt>",
      to: reservation.email,
      subject: `${pending ? "Pedido recebido" : "Reserva confirmada"} — ${reservation.restaurant.name}`,
      html: `<div style="margin:0;background:#F5EFE6;padding:32px;font-family:Arial,sans-serif;color:#16120E;line-height:1.5"><div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E1D0B8;border-radius:24px;padding:28px"><p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#9B6F3B">MesaLink</p><h1 style="margin:0;font-size:28px;line-height:1.1">${pending ? "O seu pedido foi recebido." : "A sua reserva está confirmada."}</h1><p style="margin:18px 0 0;color:#6B6258">Olá ${escapeHtml(reservation.customerName)}, estes são os dados da sua reserva.</p><div style="margin:24px 0;padding:18px;border:1px solid #E1D0B8;border-radius:18px;background:#FFF9F0"><p><strong>Restaurante:</strong> ${escapeHtml(reservation.restaurant.name)}</p><p><strong>Data:</strong> ${reservation.date.toLocaleDateString("pt-PT", { timeZone: "Europe/Lisbon" })}</p><p><strong>Hora:</strong> ${reservation.date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon" })}</p><p><strong>Pessoas:</strong> ${reservation.guests}</p>${experienceRows}${paymentRow}${offerRow}</div><p style="margin:0 0 12px;font-size:13px;color:#6B6258">Evite faltas: altere ou cancele atempadamente através destes botões.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding-right:6px"><a href="${manageUrl}" style="display:block;padding:13px 14px;border-radius:999px;background:#17120D;color:#fff;text-align:center;text-decoration:none;font-weight:700">Alterar reserva</a></td><td style="padding-left:6px"><a href="${cancelUrl}" style="display:block;padding:12px 14px;border:1px solid #D8C6A9;border-radius:999px;color:#7A3E2D;text-align:center;text-decoration:none;font-weight:700">Cancelar</a></td></tr></table><p style="margin:18px 0 0;font-size:12px;color:#9B8F82">Confirmação enviada automaticamente pelo MesaLink.</p></div></div>`,
    });
    requireAcceptedEmail(delivery);
    await completeEmailSend(reference);
    return true;
  } catch (error) {
    if (reserved) await refundEmailSend(reference);
    console.error("Reservation confirmation email failed", error);
    return false;
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] || char);
}
