import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { prisma } from "@/lib/prisma";
import { settleReservationCheckoutSession } from "@/lib/reservation-payments";

const successDateLocales: Record<string, string> = {
  pt: "pt-PT",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
  zh: "zh-CN",
  es: "es-ES",
};

export default async function ReservationSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    name?: string;
    guests?: string;
    date?: string;
    status?: string;
    already?: string;
    offer?: string;
    experience?: string;
    session_id?: string;
    reservationId?: string;
  }>;
}) {
  const { slug } = await params;
  const { name, guests, date, status, already, offer, experience, session_id: sessionId, reservationId } = await searchParams;

  let paidReservationId = reservationId || null;
  if (sessionId && /^cs_/.test(sessionId)) {
    try {
      paidReservationId = await settleReservationCheckoutSession(sessionId);
    } catch (error) {
      console.error("Reservation success settlement failed", error);
    }
  }
  const paidReservation = paidReservationId ? await prisma.reservation.findUnique({
    where: { id: paidReservationId },
    include: { experience: true, payment: true, restaurant: { select: { slug: true } } },
  }) : null;
  const verifiedPaidReservation = paidReservation?.restaurant?.slug === slug ? paidReservation : null;
  const resolvedName = verifiedPaidReservation?.customerName || name;
  const resolvedGuests = verifiedPaidReservation ? String(verifiedPaidReservation.guests) : guests;
  const resolvedDate = verifiedPaidReservation?.date || (date ? new Date(date) : null);
  const resolvedStatus = verifiedPaidReservation?.status || status;

  const t = await getTranslations("publicFlows.reserveSuccess");
  const locale = await getLocale();
  const intlLocale = successDateLocales[locale] ?? "pt-PT";

  const reservationDate = resolvedDate;
  const isPending = resolvedStatus === "PENDING";
  const isAlreadyBooked = already === "1";

  return (
    <main className="min-h-screen bg-[#F5EFE6] px-4 py-6 text-[#16120E]">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-xl flex-col justify-center">
        <div className="rounded-[32px] border border-[#E1D0B8] bg-white p-6 shadow-[0_22px_70px_rgba(80,55,30,0.08)] sm:p-8">
          <div className="mb-6 flex justify-center">
            <div
              className={
                isPending
                  ? "flex h-16 w-16 items-center justify-center rounded-full border border-[#D8C5A5] bg-[#FFF1D0] text-2xl font-semibold text-[#9B6F3B]"
                  : "flex h-16 w-16 items-center justify-center rounded-full border border-[#9CCB9B] bg-[#ECF7EC] text-2xl font-semibold text-[#3F6A4D]"
              }
            >
              {isPending ? "…" : "✓"}
            </div>
          </div>

          <div className="mb-4 flex items-center justify-end">
            <LanguageSwitcher />
          </div>

          <div className="text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
              MesaLink
            </p>

            <h1 className="text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
              {isAlreadyBooked
                ? t("titleAlready")
                : isPending
                  ? t("titlePending")
                  : t("titleConfirmed")}
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#6B6258]">
              {isAlreadyBooked
                ? t("textAlready")
                : isPending
                  ? t("textPending")
                  : t("textConfirmed")}
            </p>
          </div>

          <div className="mt-8 space-y-3 rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-4">
            {resolvedName && <InfoRow label={t("labels.name")} value={resolvedName} />}
            {resolvedGuests && <InfoRow label={t("labels.guests")} value={resolvedGuests} />}

            {reservationDate && (
              <>
                <InfoRow
                  label={t("labels.date")}
                  value={reservationDate.toLocaleDateString(intlLocale)}
                />

                <InfoRow
                  label={t("labels.time")}
                  value={reservationDate.toLocaleTimeString(intlLocale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                />
              </>
            )}

            <InfoRow
              label={t("labels.status")}
              value={isPending ? t("statusPending") : t("statusConfirmed")}
              highlight
            />
            {(verifiedPaidReservation?.experience?.title || experience) && <InfoRow label="Menu" value={verifiedPaidReservation?.experience?.title || experience || ""} highlight />}
            {verifiedPaidReservation?.payment?.status === "PAID" && <InfoRow label="Pagamento" value={`${new Intl.NumberFormat(intlLocale, { style: "currency", currency: verifiedPaidReservation.payment.currency }).format(Number(verifiedPaidReservation.payment.totalAmount))} · pago`} highlight />}
            {offer && <InfoRow label={t("labels.offer")} value={offer} highlight />}
          </div>

          <a
            href="https://www.mesalink.pt"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[#16120E] text-sm font-semibold text-white transition hover:bg-[#2A2118] active:scale-[0.99]"
          >
            {t("cta")}
          </a>

          <div className="mt-4 text-center"><Link href="/" className="inline-flex min-h-9 items-center rounded-full px-3 text-sm font-semibold text-[#8B7863] transition hover:bg-[#F5EBDD] hover:text-[#17120D]">{t("poweredBy")}</Link></div>
        </div>
      </section>
    </main>
  );
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E8DCCB] bg-white px-4 py-3">
      <span className="text-sm text-[#6B6258]">{label}</span>
      <span
        className={`text-right text-sm font-semibold ${
          highlight ? "text-[#9B6F3B]" : "text-[#16120E]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
