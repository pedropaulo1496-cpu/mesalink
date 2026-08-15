import { Resend } from "resend";
import { getLocale, getTranslations } from "next-intl/server";
import { completeEmailSend, refundEmailSend, reserveEmailSend } from "@/lib/email-billing";
import { requireAcceptedEmail } from "@/lib/email-delivery";
import { prisma } from "@/lib/prisma";
import { reservationManagementUrl } from "@/lib/reservation-management";
import { publicCustomerOrigin, publicReservationUrl } from "@/lib/public-links";

const dateLocales: Record<string, string> = { pt: "pt-PT", en: "en-GB", es: "es-ES", fr: "fr-FR", de: "de-DE", zh: "zh-CN" };

export async function sendReservationLifecycleEmail(reservationId: string, type: "UPDATED" | "CANCELLED") {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      restaurant: { select: { id: true, name: true, slug: true, userId: true } },
      experience: true,
      experienceAddOns: true,
      payment: true,
      customer: { include: { marketingPromoCards: { where: { status: "ACTIVE", title: "Crédito de reserva" }, orderBy: { createdAt: "desc" }, take: 1 } } },
    },
  });
  if (!reservation?.email || !reservation.restaurant?.userId || !process.env.RESEND_API_KEY) return false;
  const resend = new Resend(process.env.RESEND_API_KEY);

  const reference = type === "CANCELLED"
    ? `email:reservation_cancelled:${reservation.id}`
    : `email:reservation_updated:${reservation.id}:${reservation.date.getTime()}:${reservation.guests}:${reservation.status}`;
  let reserved = false;

  try {
    const allowance = await reserveEmailSend({
      userId: reservation.restaurant.userId,
      restaurantId: reservation.restaurant.id,
      reference,
      category: type === "CANCELLED" ? "RESERVATION_CANCELLED" : "RESERVATION_UPDATED",
    });
    if (!allowance.canSend) return false;
    reserved = true;

    const locale = await getLocale();
    const t = await getTranslations("publicFlows.reserve.email");
    const intlLocale = dateLocales[locale] || "pt-PT";
    const manageUrl = reservationManagementUrl(reservation.id, reservation.email);
    const cancelUrl = reservationManagementUrl(reservation.id, reservation.email, "cancel");
    const rebookUrl = publicReservationUrl(reservation.restaurant.slug);
    const creditCard = reservation.customer?.marketingPromoCards[0];
    const paymentMessage = reservation.payment?.status === "PARTIALLY_REFUNDED" || reservation.payment?.status === "REFUNDED"
      ? `O valor de ${new Intl.NumberFormat("pt-PT", { style: "currency", currency: reservation.payment.currency }).format(Number(reservation.payment.refundedAmount))} foi devolvido através da Stripe. A taxa de serviço não é reembolsável.`
      : reservation.payment?.status === "CREDIT_ISSUED" && creditCard
        ? `Emitimos um crédito digital de ${new Intl.NumberFormat("pt-PT", { style: "currency", currency: reservation.payment.currency }).format(Number(reservation.payment.baseAmount) + Number(reservation.payment.addOnsAmount))}, válido para uma nova reserva.`
        : "";
    const pending = reservation.status === "PENDING";
    const experienceRows = reservation.experience ? `
      <div style="margin:16px 0 0;padding:15px 16px;border-radius:16px;background:#17120D;color:#fff;">
        <p style="margin:0 0 5px;font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#D7B267;">Menu da reserva</p>
        <p style="margin:0;font-size:18px;font-weight:700;">${escapeHtml(reservation.experience.title)}</p>
        <p style="margin:5px 0 0;font-size:13px;color:#E8DED2;">${formatMoney(Number(reservation.experience.pricePerPerson))} por pessoa</p>
        ${reservation.experienceAddOns.length ? `<p style="margin:5px 0 0;font-size:13px;color:#E8DED2;"><strong>Extras:</strong> ${escapeHtml(reservation.experienceAddOns.map((item) => `${item.nameSnapshot} × ${item.quantity}`).join(", "))}</p>` : ""}
      </div>
    ` : "";

    const subject = type === "CANCELLED"
      ? t("subjectCancelled", { restaurantName: reservation.restaurant.name })
      : t("subjectUpdated", { restaurantName: reservation.restaurant.name });
    const heading = type === "CANCELLED" ? t("headingCancelled") : t("headingUpdated");
    const body = type === "CANCELLED" ? t("bodyCancelled") : pending ? t("bodyUpdatedPending") : t("bodyUpdated");
    const status = type === "CANCELLED" ? t("statusCancelled") : pending ? t("statusPending") : t("statusConfirmed");

    const delivery = await resend.emails.send({
      from: "MesaLink <noreply@mesalink.pt>",
      to: reservation.email,
      subject,
      html: `
        <div style="margin:0;background:#F5EFE6;padding:32px;font-family:Arial,sans-serif;color:#16120E;line-height:1.5;">
          <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E1D0B8;border-radius:24px;padding:28px;">
            <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#9B6F3B;">MesaLink</p>
            <h1 style="margin:0;font-size:28px;line-height:1.1;color:#16120E;">${escapeHtml(heading)}</h1>
            <p style="margin:18px 0 0;color:#6B6258;">${escapeHtml(t("greeting", { customerName: reservation.customerName }))}</p>
            <p style="margin:10px 0 0;color:#6B6258;">${escapeHtml(body)}</p>
            ${type === "CANCELLED" && paymentMessage ? `<div style="margin:18px 0 0;padding:14px 16px;border-radius:16px;background:#FFF3D8;color:#6B4C24;font-weight:700;">${escapeHtml(paymentMessage)}</div>` : ""}
            <div style="margin:24px 0;padding:18px;border:1px solid #E1D0B8;border-radius:18px;background:#FFF9F0;">
              <p><strong>${escapeHtml(t("labelRestaurant"))}</strong> ${escapeHtml(reservation.restaurant.name)}</p>
              <p><strong>${escapeHtml(t("labelDate"))}</strong> ${reservation.date.toLocaleDateString(intlLocale, { timeZone: "Europe/Lisbon" })}</p>
              <p><strong>${escapeHtml(t("labelTime"))}</strong> ${reservation.date.toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon" })}</p>
              <p><strong>${escapeHtml(t("labelGuests"))}</strong> ${reservation.guests}</p>
              <p><strong>${escapeHtml(t("labelStatus"))}</strong> ${escapeHtml(status)}</p>
              ${experienceRows}
            </div>
            ${type === "CANCELLED" ? `
              <a href="${rebookUrl}" style="display:block;padding:14px 20px;border-radius:999px;background:#17120D;color:#fff;text-align:center;text-decoration:none;font-weight:700;">${escapeHtml(t("rebookButton"))}</a>
              ${creditCard ? `<a href="${publicCustomerOrigin()}/offers/${encodeURIComponent(creditCard.publicCode)}" style="display:block;margin-top:10px;padding:13px 20px;border:1px solid #D8C6A9;border-radius:999px;color:#7A5427;text-align:center;text-decoration:none;font-weight:700;">Abrir crédito digital · ${escapeHtml(creditCard.publicCode)}</a>` : ""}
            ` : `
              <p style="margin:0 0 12px;font-size:13px;color:#6B6258;">${escapeHtml(t("manageIntro"))}</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                <td style="padding-right:6px;"><a href="${manageUrl}" style="display:block;padding:13px 14px;border-radius:999px;background:#17120D;color:#fff;text-align:center;text-decoration:none;font-weight:700;">${escapeHtml(t("manageButton"))}</a></td>
                <td style="padding-left:6px;"><a href="${cancelUrl}" style="display:block;padding:12px 14px;border:1px solid #D8C6A9;border-radius:999px;color:#7A3E2D;text-align:center;text-decoration:none;font-weight:700;">${escapeHtml(t("cancelButton"))}</a></td>
              </tr></table>
            `}
            <p style="margin:20px 0 0;font-size:12px;color:#9B8F82;">${escapeHtml(t("footerNote"))}</p>
          </div>
        </div>`,
    });
    requireAcceptedEmail(delivery);
    await completeEmailSend(reference);
    return true;
  } catch (error) {
    if (reserved) await refundEmailSend(reference);
    console.error(`Erro ao enviar email de reserva ${type.toLowerCase()}:`, error);
    return false;
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] || char);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
}
