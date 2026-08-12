import { Resend } from "resend";
import { getLocale, getTranslations } from "next-intl/server";
import { completeEmailSend, refundEmailSend, reserveEmailSend } from "@/lib/email-billing";
import { requireAcceptedEmail } from "@/lib/email-delivery";
import { prisma } from "@/lib/prisma";
import { reservationManagementUrl } from "@/lib/reservation-management";

const dateLocales: Record<string, string> = { pt: "pt-PT", en: "en-GB", es: "es-ES", fr: "fr-FR", de: "de-DE", zh: "zh-CN" };

export async function sendReservationLifecycleEmail(reservationId: string, type: "UPDATED" | "CANCELLED") {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { restaurant: { select: { id: true, name: true, slug: true, userId: true } } },
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
    const rebookUrl = `${(process.env.NEXT_PUBLIC_APP_URL || "https://www.mesalink.pt").replace(/\/+$/, "")}/reserve/${reservation.restaurant.slug}`;
    const pending = reservation.status === "PENDING";

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
            <div style="margin:24px 0;padding:18px;border:1px solid #E1D0B8;border-radius:18px;background:#FFF9F0;">
              <p><strong>${escapeHtml(t("labelRestaurant"))}</strong> ${escapeHtml(reservation.restaurant.name)}</p>
              <p><strong>${escapeHtml(t("labelDate"))}</strong> ${reservation.date.toLocaleDateString(intlLocale, { timeZone: "Europe/Lisbon" })}</p>
              <p><strong>${escapeHtml(t("labelTime"))}</strong> ${reservation.date.toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon" })}</p>
              <p><strong>${escapeHtml(t("labelGuests"))}</strong> ${reservation.guests}</p>
              <p><strong>${escapeHtml(t("labelStatus"))}</strong> ${escapeHtml(status)}</p>
            </div>
            ${type === "CANCELLED" ? `
              <a href="${rebookUrl}" style="display:block;padding:14px 20px;border-radius:999px;background:#17120D;color:#fff;text-align:center;text-decoration:none;font-weight:700;">${escapeHtml(t("rebookButton"))}</a>
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
