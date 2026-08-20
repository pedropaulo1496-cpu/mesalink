import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import BottomNav from "@/components/BottomNav";
import PhoneField from "@/components/PhoneField";
import { getTranslations } from "next-intl/server";
import { assertRestaurantOwner } from "@/lib/restaurant-auth";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Info,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

async function createReservation(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  await assertRestaurantOwner(restaurantId);
  const reservationMode = String(formData.get("reservationMode"));
  const customerName = String(formData.get("customerName")).trim();
  const phone = String(formData.get("phone")).trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const birthDateValue = String(formData.get("birthDate") || "").trim();
  const guests = Number(formData.get("guests"));
  const dateValue = String(formData.get("date"));
  const timeValue = String(formData.get("time"));
  const notes = String(formData.get("notes") || "").trim();

  if (email && !isValidEmail(email)) {
    redirect(`/restaurants/${restaurantId}/reservations/new?error=email`);
  }

  const normalizedEmail = email || null;
  const birthDate = birthDateValue ? new Date(`${birthDateValue}T12:00:00`) : null;

  const date = new Date(`${dateValue}T${timeValue}`);

  const startDate = date;
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 2);

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      tables: {
        orderBy: { capacity: "asc" },
        include: {
          reservations: {
            where: {
              status: {
                notIn: ["CANCELLED", "FINISHED", "REJECTED", "NO_SHOW"],
              },
              date: {
                gte: new Date(startDate.getTime() - 2 * 60 * 60 * 1000),
                lt: endDate,
              },
            },
          },
        },
      },
    },
  });

  if (!restaurant) {
    redirect(`/restaurants/${restaurantId}/reservations/new?error=restaurant`);
  }

  let tableId: string | null = null;
  let status = "CONFIRMED";
  let approvalReason: string | null = null;

  if (
    restaurant.manualApprovalGuests &&
    guests >= restaurant.manualApprovalGuests
  ) {
    status = "PENDING";
    approvalReason = "LARGE_GROUP";
  }

  if (reservationMode === "TABLES") {
    const availableTables = restaurant.tables.filter(
      (table) => table.reservations.length === 0,
    );

    const singleTable = availableTables.find((table) => table.capacity >= guests);

    if (singleTable) {
      tableId = singleTable.id;
    } else {
      let totalCapacity = 0;

      for (const table of availableTables) {
        totalCapacity += table.capacity;

        if (totalCapacity >= guests) {
          break;
        }
      }

      if (totalCapacity < guests) {
        redirect(`/restaurants/${restaurantId}/reservations/new?error=no-table`);
      }

      tableId = null;

      if (restaurant.approvalOnTableMerge) {
        status = "PENDING";
        approvalReason = "TABLE_MERGE";
      }
    }
  }

  let customer = await prisma.customer.findFirst({
    where: {
      OR: [
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        { phone },
      ],
    },
  });

  if (customer) {
    customer = await prisma.customer.update({
      where: {
        id: customer.id,
      },
      data: {
        restaurantId,
        name: customerName,
        phone,
        ...(normalizedEmail && {
          email: normalizedEmail,
        }),
        ...(birthDate && {
          birthDate,
        }),
        lastReservationAt: date,
      },
    });
  } else {
    customer = await prisma.customer.create({
  data: {
    restaurantId,
    name: customerName,
    phone,
    email: normalizedEmail,
    birthDate,
    lastReservationAt: date,
    source: "MANUAL_RESERVATION",
    marketingOptIn: true,
    marketingJoinedAt: new Date(),
  },
});
  }

  await prisma.reservation.create({
    data: {
      restaurantId,
      customerId: customer.id,
      customerName,
      phone,
      guests,
      date,
      tableId,
      status,
      approvalReason,
      notes: notes || null,
    },
  });

  redirect(`/restaurants/${restaurantId}/calendar`);
}

const times = [
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
];

export default async function NewReservationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { id } = await params;

  const query = searchParams ? await searchParams : {};

  const t = await getTranslations("dashboardCrm.reservations.new");

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      tables: {
        orderBy: { number: "asc" },
      },
    },
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#F5EFE6] p-10 text-[#16120E]">
        {t("notFound")}
      </main>
    );
  }

  const usesTables = restaurant.reservationMode === "TABLES";

  return (
    <main className="min-h-screen bg-[#F1EBE2] text-[#17120D]">
      <section className="mx-auto max-w-[1240px] px-3 pb-28 pt-3 sm:px-5 sm:pt-5 lg:px-7 lg:pb-7 lg:pt-7">
        <header className="mb-3 flex h-11 items-center justify-between gap-3 px-1 sm:mb-5 sm:px-2">
          <Link
            href={`/restaurants/${id}/calendar`}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[#DCCBB3] bg-white px-4 text-xs font-bold text-[#765C3A] shadow-[0_8px_24px_rgba(80,55,30,0.04)] transition hover:border-[#B8915D] hover:text-[#17120D]"
          >
            <ArrowLeft size={15} />
            {t("back")}
          </Link>
          <span className="font-serif text-xl font-bold tracking-[-0.04em]">
            <span className="text-[#B48645]">Mesa</span>Link
          </span>
        </header>

        <div className="grid min-w-0 overflow-hidden rounded-[28px] border border-[#DCCBB2] bg-white shadow-[0_30px_90px_rgba(69,48,28,.1)] lg:min-h-[720px] lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[390px_minmax(0,1fr)]">
          <aside
            className="relative min-h-[285px] overflow-hidden bg-[#17120D] text-white lg:min-h-full"
            style={restaurant.websiteHeroImage ? { backgroundImage: `url(${restaurant.websiteHeroImage})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
          >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,10,6,.15),rgba(15,10,6,.95))]" />
            <div className="relative flex min-h-[285px] flex-col justify-between p-5 sm:p-7 lg:min-h-full lg:p-8">
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8DD08B]" />
                  {t("eyebrow")}
                </span>
                {restaurant.websiteLogoImage && (
                  <span
                    className="h-12 w-12 shrink-0 rounded-full border-2 border-white/30 bg-white bg-cover bg-center shadow-lg"
                    style={{ backgroundImage: `url(${restaurant.websiteLogoImage})` }}
                  />
                )}
              </div>

              <div>
                <div className="mb-4 h-px w-10 bg-[#D7B267]" />
                <h1 className="max-w-[300px] text-[2.2rem] font-semibold leading-[0.95] tracking-[-0.06em] sm:text-[2.65rem]">
                  {t("title")}
                </h1>
                <p className="mt-3 text-sm font-semibold text-white/78">{restaurant.name}</p>
                {restaurant.address && (
                  <p className="mt-2 flex max-w-[300px] items-start gap-2 text-[10px] leading-5 text-white/55">
                    <MapPin size={13} className="mt-0.5 shrink-0 text-[#D7B267]" />
                    {restaurant.address}
                  </p>
                )}
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <MiniCard label={t("miniCards.status.label")} value={t("miniCards.status.value")} />
                  <MiniCard
                    label={t("miniCards.table.label")}
                    value={usesTables ? t("miniCards.table.auto") : t("miniCards.table.none")}
                  />
                  <MiniCard label={t("miniCards.crm.label")} value={t("miniCards.crm.value")} />
                </div>
              </div>
            </div>
          </aside>

          <section className="min-w-0 p-4 sm:p-6 lg:p-8 xl:p-10">
            <div className="mx-auto max-w-3xl">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#A27438]">{t("eyebrow")}</p>
                  <h2 className="mt-1.5 text-[1.65rem] font-semibold leading-none tracking-[-0.05em] sm:text-3xl">
                    {t("description.prefix")} {restaurant.name}{t("description.suffix")}
                  </h2>
                </div>
                <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-[#EDF6EC] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-[#46704A] sm:inline-flex">
                  <ShieldCheck size={13} /> {t("miniCards.status.value")}
                </span>
              </div>

              <form action={createReservation} className="space-y-4 sm:space-y-5">
              <input type="hidden" name="restaurantId" value={restaurant.id} />
              <input
                type="hidden"
                name="reservationMode"
                value={restaurant.reservationMode}
              />

              {query.error === "no-table" && (
                <div className="rounded-2xl border border-[#E7B7A8] bg-[#FFF0EA] p-4 text-sm font-semibold text-[#A14E36]">
                  {t("errors.noTable")}
                </div>
              )}

              {query.error === "conflict" && (
                <div className="rounded-2xl border border-[#E7B7A8] bg-[#FFF0EA] p-4 text-sm font-semibold text-[#A14E36]">
                  {t("errors.conflict")}
                </div>
              )}

              {query.error === "email" && (
                <div className="rounded-2xl border border-[#E7B7A8] bg-[#FFF0EA] p-4 text-sm font-semibold text-[#A14E36]">
                  {t("errors.email")}
                </div>
              )}

              <FormSection icon={<UserRound size={16} />} title={t("sections.customer")}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t("fields.customerName.label")}>
                    <input
                      name="customerName"
                      placeholder={t("fields.customerName.placeholder")}
                      className="input-premium"
                      required
                    />
                  </Field>

                  <Field label={t("fields.phone.label")}>
                    <PhoneField name="phone" required placeholder={t("fields.phone.placeholder")} />
                  </Field>

                  <Field label={t("fields.email.label")}>
                    <input
                      name="email"
                      type="email"
                      placeholder={t("fields.email.placeholder")}
                      className="input-premium"
                    />
                    <p className="mt-2 text-xs font-medium leading-5 text-[#8A7A68]">
                      {t("fields.email.helper")}
                    </p>
                  </Field>

                  <Field label={t("fields.birthDate.label")}>
                    <input
                      name="birthDate"
                      type="date"
                      className="input-premium"
                    />
                    <p className="mt-2 text-xs font-medium leading-5 text-[#8A7A68]">
                      {t("fields.birthDate.helper")}
                    </p>
                  </Field>
                </div>
              </FormSection>

              <FormSection icon={<CalendarDays size={16} />} title={t("sections.reservation")}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t("fields.guests.label")}>
                    <input
                      name="guests"
                      type="number"
                      min="1"
                      placeholder={t("fields.guests.placeholder")}
                      className="input-premium"
                      required
                    />
                  </Field>

                  <Field label={t("fields.date.label")}>
                    <input
                      name="date"
                      type="date"
                      className="input-premium"
                      required
                    />
                  </Field>
                </div>
              </FormSection>

              <FormSection icon={<Clock3 size={16} />} title={t("sections.time")}>
                <div className="grid grid-cols-3 gap-2 min-[480px]:grid-cols-4 xl:grid-cols-7">
                  {times.map((time) => (
                    <label key={time} className="group cursor-pointer">
                      <input
                        type="radio"
                        name="time"
                        value={time}
                        required
                        className="peer sr-only"
                      />

                      <span className="flex h-11 items-center justify-center rounded-full border border-[#DED0BC] bg-white px-2 text-xs font-bold text-[#655B50] transition peer-checked:border-[#17120D] peer-checked:bg-[#17120D] peer-checked:text-white peer-checked:shadow-[0_8px_20px_rgba(23,18,13,.18)] group-hover:border-[#A97C42]">
                        {time}
                      </span>
                    </label>
                  ))}
                </div>
              </FormSection>

              <FormSection icon={<Sparkles size={16} />} title={t("sections.notes")}>
                <textarea
                  name="notes"
                  rows={5}
                  placeholder={t("fields.notes.placeholder")}
                  className="min-h-[110px] w-full resize-none rounded-[16px] border border-[#DED0BC] bg-white px-4 py-3 text-sm text-[#17120D] outline-none transition placeholder:text-[#A49788] focus:border-[#A97C42] focus:ring-4 focus:ring-[#D7B267]/15"
                />
              </FormSection>

              {usesTables ? (
                <div className="flex items-start gap-3 rounded-[18px] border border-[#CFE0CC] bg-[#F3FAF2] p-4 text-xs leading-5 text-[#405C42]">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[#4D7550]"><Info size={15} /></span>
                  <p>{t("tableInfo.auto")}</p>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-[18px] border border-[#CFE0CC] bg-[#F3FAF2] p-4 text-xs leading-5 text-[#405C42]">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[#4D7550]"><Info size={15} /></span>
                  <p>
                    {t("tableInfo.capacityMode.prefix")} {" "}
                    <strong>{t("tableInfo.capacityMode.bold")}</strong>
                    {t("tableInfo.capacityMode.suffix")}
                  </p>
                </div>
              )}

              <div className="rounded-[21px] border border-white/10 bg-[#17120D] p-2.5 shadow-[0_18px_45px_rgba(23,18,13,.22)] sm:flex sm:gap-2">
                <button className="inline-flex h-12 w-full flex-1 items-center justify-center gap-2 rounded-[15px] bg-[#D7B267] px-6 text-sm font-black text-[#17120D] transition hover:bg-[#E4C47F]">
                  {t("submit")}
                  <Check size={16} />
                </button>

                <Link
                  href={`/restaurants/${id}/calendar`}
                  className="mt-2 flex h-12 flex-1 items-center justify-center rounded-[15px] border border-white/12 px-6 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white sm:mt-0"
                >
                  {t("cancel")}
                </Link>
              </div>
            </form>
            </div>
          </section>
        </div>
      </section>

      <BottomNav id={id} />
    </main>
  );
}

function FormSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-[#E4D7C6] bg-[#FBF8F4] p-3.5 sm:p-5">
      <div className="flex items-center gap-2 text-[#704F2C]">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[11px] bg-[#F1E5D3]">
          {icon}
        </span>
        <h3 className="text-sm font-bold text-[#17120D]">{title}</h3>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.12em] text-[#786A5C]">
        {label}
      </span>
      {children}
    </label>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[14px] border border-white/10 bg-white/[0.07] px-3 py-3 backdrop-blur-sm">
      <p className="truncate text-[7px] font-black uppercase tracking-[0.14em] text-[#D7B267]">
        {label}
      </p>

      <p className="mt-1.5 line-clamp-2 text-[10px] font-bold leading-4 text-white">{value}</p>
    </div>
  );
}
