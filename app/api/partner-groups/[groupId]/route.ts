import { NextResponse } from "next/server";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { getReferralCapacity } from "@/lib/referral-availability";
import { referralAuthorizationRequiredUntil } from "@/lib/referral-deadlines";
import { EXTERNAL_REFERRAL_MAX_ADVANCE_DAYS, issueExternalReferralAccess } from "@/lib/external-referral-requests";
import { prisma } from "@/lib/prisma";

class PartnerReservationUpdateError extends Error {
  constructor(public code: "NOT_EDITABLE" | "CAPACITY" | "AUTHORIZATION" | "GUEST_LIMIT") { super(code); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const { groupId } = await params;
  const body = await request.json().catch(() => null);
  const customerName = typeof body?.customerName === "string" ? body.customerName.trim().slice(0, 100) : "";
  const customerPhone = typeof body?.customerPhone === "string" ? body.customerPhone.trim().slice(0, 30) : "";
  const customerEmail = typeof body?.customerEmail === "string" ? body.customerEmail.trim().toLowerCase().slice(0, 160) : "";
  const desiredDate = new Date(body?.desiredDate);
  const adults = Number(body?.adults);
  const children = Number(body?.children);
  const guests = adults + children;
  if (!customerName || customerPhone.replace(/\D/g, "").length < 7 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)
    || !Number.isInteger(adults) || adults < 1 || !Number.isInteger(children) || children < 0 || !Number.isInteger(guests) || guests > 200
    || Number.isNaN(desiredDate.getTime()) || desiredDate <= new Date(Date.now() + 2 * 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Revê o nome, contacto, data e número de pessoas." }, { status: 400 });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const group = await tx.referralGroup.findFirst({
        where: { id: groupId, partnerId: partner.id },
        include: {
          reservation: true,
          payment: true,
          acceptedRestaurant: { select: { referralDefaultDailyCapacity: true } },
          offers: { where: { status: "PENDING" }, take: 1, select: { id: true } },
        },
      });
      if (!group || !["OPEN", "BOOKED"].includes(group.status) || group.desiredDate <= new Date()) throw new PartnerReservationUpdateError("NOT_EDITABLE");
      if (group.targetMode === "EXTERNAL" && group.status === "OPEN") {
        const maxDate = new Date(Date.now() + EXTERNAL_REFERRAL_MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000);
        if (desiredDate > maxDate) throw new PartnerReservationUpdateError("NOT_EDITABLE");
      }

      if (group.status === "BOOKED") {
        if (!group.reservation || !group.acceptedRestaurantId || !group.acceptedRestaurant) throw new PartnerReservationUpdateError("NOT_EDITABLE");
        if (group.payment && group.commissionType === "PER_PERSON" && Number(group.commissionAmount) > 0) {
          const authorizedGuests = Math.max(1, Math.floor(Number(group.payment.grossCommission) / Number(group.commissionAmount) + 0.0001));
          if (guests > authorizedGuests) throw new PartnerReservationUpdateError("GUEST_LIMIT");
        }
        if (group.payment?.authorizationExpiresAt && referralAuthorizationRequiredUntil(desiredDate) > group.payment.authorizationExpiresAt) {
          throw new PartnerReservationUpdateError("AUTHORIZATION");
        }
        const capacity = await getReferralCapacity(tx, group.acceptedRestaurantId, desiredDate, group.acceptedRestaurant.referralDefaultDailyCapacity);
        if (capacity.capacity <= 0) throw new PartnerReservationUpdateError("CAPACITY");
        const currentReservationIncluded = Math.abs(group.reservation.date.getTime() - desiredDate.getTime()) < 2 * 60 * 60 * 1000
          && !["CANCELLED", "FINISHED", "REJECTED", "NO_SHOW"].includes(group.reservation.status);
        const available = capacity.remaining + (currentReservationIncluded ? group.reservation.guests : 0);
        if (available < guests) throw new PartnerReservationUpdateError("CAPACITY");
      }

      const groupUpdate = await tx.referralGroup.update({
        where: { id: group.id },
        data: { customerName, customerPhone, customerEmail, desiredDate, adults, children, guests, expiresAt: group.status === "OPEN" ? desiredDate : group.expiresAt },
        select: { id: true, status: true, targetMode: true, reservationId: true },
      });
      if (group.reservationId) {
        await tx.reservation.update({
          where: { id: group.reservationId },
          data: {
            customerName,
            phone: customerPhone,
            email: customerEmail,
            date: desiredDate,
            guests,
            notes: [`Reserva MesaLink Partner ${group.publicCode}.`, `${adults} adultos${children > 0 ? ` e ${children} crianças` : ""}.`, group.notes || ""].filter(Boolean).join(" "),
          },
        });
      }
      return { ...groupUpdate, pendingOfferId: group.offers[0]?.id || null };
    }, { isolationLevel: "Serializable" });

    let restaurantNotified = true;
    if (updated.targetMode === "EXTERNAL" && updated.status === "OPEN" && updated.pendingOfferId) {
      restaurantNotified = await issueExternalReferralAccess(updated.pendingOfferId, request.url).then(() => true).catch((error) => {
        console.error("Updated external referral email failed", error);
        return false;
      });
    }
    if (updated.reservationId) {
      const { sendReservationLifecycleEmail } = await import("@/lib/send-reservation-lifecycle-email");
      await sendReservationLifecycleEmail(updated.reservationId, "UPDATED").catch((error) => console.error("Partner reservation update email failed", error));
    }
    return NextResponse.json({ success: true, synced: Boolean(updated.reservationId), restaurantNotified });
  } catch (error) {
    if (error instanceof PartnerReservationUpdateError) {
      const messages = {
        NOT_EDITABLE: "Esta reserva já não pode ser alterada.",
        CAPACITY: "O restaurante não tem lugares suficientes para essa alteração.",
        AUTHORIZATION: "A garantia de pagamento não cobre essa nova data. Contacta o suporte para alterar a reserva.",
        GUEST_LIMIT: "Depois da confirmação podes reduzir o grupo, mas não aumentar acima do número inicialmente garantido.",
      };
      return NextResponse.json({ error: messages[error.code] }, { status: 409 });
    }
    console.error("Partner reservation update failed", error);
    return NextResponse.json({ error: "Não foi possível atualizar a reserva." }, { status: 500 });
  }
}
