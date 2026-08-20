import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import BottomNav from "@/components/BottomNav";
import PhoneField from "@/components/PhoneField";
import { getTranslations } from "next-intl/server";
import { assertRestaurantOwner } from "@/lib/restaurant-auth";

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
    <main className="min-h-screen bg-[#F1EBE2] text-[#16120E]">
      <section className="mx-auto max-w-5xl px-4 pb-28 pt-5 sm:px-7 sm:pt-8 lg:pb-8">
        <Link
          href={`/restaurants/${id}/calendar`}
          className="inline-flex h-10 items-center rounded-full border border-[#DCCBB3] bg-white px-4 text-xs font-bold text-[#765C3A] shadow-[0_8px_24px_rgba(80,55,30,0.04)] transition hover:border-[#B8915D] hover:text-[#16120E]"
        >
          ← {t("back")}
        </Link>

        <div className="mt-4 grid overflow-hidden rounded-[30px] border border-[#DCC9AA] bg-white shadow-[0_24px_70px_rgba(65,43,22,0.11)] lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,#634321_0,#2B1D13_42%,#17120D_100%)] p-6 text-white sm:p-8 lg:min-h-full">
            <div className="absolute -right-14 -top-14 h-48 w-48 rounded-full border border-white/10" />
            <div className="absolute -right-4 -top-4 h-28 w-28 rounded-full border border-[#D7B267]/20" />
            <div className="relative">
            <p className="font-serif text-xl font-bold"><span className="text-[#D7B267]">Mesa</span>Link</p>
            <p className="mt-8 text-[9px] font-black uppercase tracking-[0.22em] text-[#D7B267]">{t("eyebrow")}</p>

            <h1 className="mt-3 max-w-sm text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-5xl">
              {t("title")}
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-6 text-white/62">
              {t("description.prefix")}{" "}
              <span className="font-semibold text-white">
                {restaurant.name}
              </span>
              {t("description.suffix")}
            </p>

            <div className="mt-7 grid gap-2">
              <MiniCard label={t("miniCards.status.label")} value={t("miniCards.status.value")} />
              <MiniCard
                label={t("miniCards.table.label")}
                value={usesTables ? t("miniCards.table.auto") : t("miniCards.table.none")}
              />
              <MiniCard label={t("miniCards.crm.label")} value={t("miniCards.crm.value")} />
            </div>
            </div>
          </aside>

          <section className="bg-white p-4 sm:p-7 lg:p-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A27438]">Reserva interna</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.045em]">Dados da reserva</h2></div>
              <span className="hidden rounded-full bg-[#EFF8EF] px-3 py-1.5 text-[9px] font-black text-[#426A47] sm:inline-flex">Registo imediato</span>
            </div>
            <form action={createReservation} className="space-y-4">
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

              <FormSection title={t("sections.customer")}>
                <div className="grid gap-3 md:grid-cols-2">
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

              <FormSection title={t("sections.reservation")}>
                <div className="grid gap-3 md:grid-cols-2">
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

              <FormSection title={t("sections.time")}>
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {times.map((time) => (
                    <label key={time} className="group cursor-pointer">
                      <input
                        type="radio"
                        name="time"
                        value={time}
                        required
                        className="peer sr-only"
                      />

                      <span className="flex h-11 min-w-[72px] items-center justify-center rounded-full border border-[#DED0BC] bg-white px-4 text-xs font-bold text-[#655B50] transition peer-checked:border-[#16120E] peer-checked:bg-[#16120E] peer-checked:text-white group-hover:border-[#A97C42]">
                        {time}
                      </span>
                    </label>
                  ))}
                </div>
              </FormSection>

              <FormSection title={t("sections.notes")}>
                <textarea
                  name="notes"
                  rows={5}
                  placeholder={t("fields.notes.placeholder")}
                  className="min-h-[110px] w-full resize-none rounded-[15px] border border-[#DED0BC] bg-white px-4 py-4 text-sm text-[#16120E] outline-none transition placeholder:text-[#A49788] focus:border-[#A97C42] focus:ring-4 focus:ring-[#D7B267]/15"
                />
              </FormSection>

              {usesTables ? (
                <div className="rounded-[17px] border border-[#CFE0CC] bg-[#F3FAF2] p-4 text-xs leading-5 text-[#405C42]">
                  {t("tableInfo.auto")}
                </div>
              ) : (
                <div className="rounded-[17px] border border-[#CFE0CC] bg-[#F3FAF2] p-4 text-xs leading-5 text-[#405C42]">
                  {t("tableInfo.capacityMode.prefix")}{" "}
                  <strong>{t("tableInfo.capacityMode.bold")}</strong>
                  {t("tableInfo.capacityMode.suffix")}
                </div>
              )}

              <div className="mt-2 rounded-[21px] bg-[#17120D] p-2.5 shadow-[0_18px_45px_rgba(23,18,13,.22)] md:flex md:gap-2">
                <button className="h-12 flex-1 rounded-[15px] bg-[#D7B267] px-6 text-sm font-black text-[#17120D] transition hover:bg-[#E4C47F]">
                  {t("submit")}
                </button>

                <Link
                  href={`/restaurants/${id}/calendar`}
                  className="mt-2 flex h-12 flex-1 items-center justify-center rounded-[15px] border border-white/12 px-6 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white md:mt-0"
                >
                  {t("cancel")}
                </Link>
              </div>
            </form>
          </section>
        </div>
      </section>

      <BottomNav id={id} />
    </main>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-[#E4D7C6] bg-[#FBF8F4] p-4 sm:p-5">
      <SectionLabel>{title}</SectionLabel>
      <div className="mt-3">{children}</div>
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
    <div className="rounded-[15px] border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm">
      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#D7B267]">
        {label}
      </p>

      <p className="mt-1.5 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">
      {children}
    </p>
  );
}
