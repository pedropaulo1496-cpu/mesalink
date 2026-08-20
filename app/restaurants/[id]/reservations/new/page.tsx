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
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <section className="mx-auto max-w-6xl px-5 pt-7 pb-28 sm:px-8 lg:pb-7">
        <Link
          href={`/restaurants/${id}/calendar`}
          className="text-sm font-semibold text-[#9B6F3B] hover:text-[#16120E]"
        >
          ← {t("back")}
        </Link>

        <div className="mt-7 grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="rounded-[32px] border border-[#E1D0B8] bg-white p-7 shadow-[0_22px_70px_rgba(80,55,30,0.055)]">
            <SectionLabel>{t("eyebrow")}</SectionLabel>

            <h1 className="mt-4 text-5xl font-semibold leading-[0.9] tracking-[-0.065em]">
              {t("title")}
            </h1>

            <p className="mt-5 text-sm leading-6 text-[#6B6258]">
              {t("description.prefix")}{" "}
              <span className="font-semibold text-[#16120E]">
                {restaurant.name}
              </span>
              {t("description.suffix")}
            </p>

            <div className="mt-8 grid gap-3">
              <MiniCard label={t("miniCards.status.label")} value={t("miniCards.status.value")} />
              <MiniCard
                label={t("miniCards.table.label")}
                value={usesTables ? t("miniCards.table.auto") : t("miniCards.table.none")}
              />
              <MiniCard label={t("miniCards.crm.label")} value={t("miniCards.crm.value")} />
            </div>
          </aside>

          <section className="rounded-[32px] border border-[#E1D0B8] bg-white p-7 shadow-[0_22px_70px_rgba(80,55,30,0.055)]">
            <form action={createReservation} className="space-y-8">
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
                <div className="grid gap-4 md:grid-cols-2">
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
                <div className="grid gap-4 md:grid-cols-2">
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
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {times.map((time) => (
                    <label key={time} className="group cursor-pointer">
                      <input
                        type="radio"
                        name="time"
                        value={time}
                        required
                        className="peer sr-only"
                      />

                      <span className="flex h-12 items-center justify-center rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] text-sm font-semibold text-[#16120E] transition peer-checked:border-[#16120E] peer-checked:bg-[#16120E] peer-checked:text-white group-hover:border-[#C8A56A]">
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
                  className="min-h-[130px] w-full resize-none rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 py-4 text-[#16120E] outline-none transition placeholder:text-[#9B8B7A] focus:border-[#C8A56A] focus:bg-white"
                />
              </FormSection>

              {usesTables ? (
                <div className="rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4 text-sm leading-6 text-[#6B6258]">
                  {t("tableInfo.auto")}
                </div>
              ) : (
                <div className="rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4 text-sm leading-6 text-[#6B6258]">
                  {t("tableInfo.capacityMode.prefix")}{" "}
                  <strong>{t("tableInfo.capacityMode.bold")}</strong>
                  {t("tableInfo.capacityMode.suffix")}
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-[#E1D0B8] pt-6 md:flex-row">
                <button className="h-14 flex-1 rounded-full bg-[#16120E] px-6 font-semibold text-white transition hover:bg-[#2A2118]">
                  {t("submit")}
                </button>

                <Link
                  href={`/restaurants/${id}/calendar`}
                  className="flex h-14 flex-1 items-center justify-center rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-6 font-semibold text-[#16120E] transition hover:bg-white"
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
    <div>
      <SectionLabel>{title}</SectionLabel>
      <div className="mt-5">{children}</div>
    </div>
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
      <span className="mb-2 block text-sm font-semibold text-[#6B6258]">
        {label}
      </span>
      {children}
    </label>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9B6F3B]">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold text-[#16120E]">{value}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9B6F3B]">
      {children}
    </p>
  );
}
