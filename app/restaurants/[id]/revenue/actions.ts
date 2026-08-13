"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertRestaurantOwner } from "@/lib/restaurant-auth";

export async function saveRevenueSettings(restaurantId: string, formData: FormData) {
  await assertRestaurantOwner(restaurantId);
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { paymentsStripeOnboardingComplete: true, paymentsStripeAccountId: true },
  });
  if (!restaurant) throw new Error("Restaurante não encontrado.");
  const wantsProtection = formData.get("noShowProtectionEnabled") === "on";
  if (wantsProtection && (!restaurant.paymentsStripeOnboardingComplete || !restaurant.paymentsStripeAccountId)) {
    redirect(`/restaurants/${restaurantId}/revenue?tab=protect&result=connect-required`);
  }

  const minGuests = boundedInt(formData.get("noShowMinGuests"), 1, 100, 6);
  const deposit = boundedNumber(formData.get("noShowDepositPerPerson"), 1, 500, 10);
  const cancellationHours = boundedInt(formData.get("noShowCancellationHours"), 1, 336, 24);
  const specialDates = String(formData.get("noShowSpecialDates") || "")
    .split(/[\s,;]+/)
    .map((value) => value.trim())
    .filter((value, index, list) => /^\d{4}-\d{2}-\d{2}$/.test(value) && list.indexOf(value) === index)
    .slice(0, 40);

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      revenueSummaryEmailEnabled: formData.get("revenueSummaryEmailEnabled") === "on",
      noShowProtectionEnabled: wantsProtection,
      noShowMinGuests: minGuests,
      noShowDepositPerPerson: deposit,
      noShowFridayEnabled: formData.get("noShowFridayEnabled") === "on",
      noShowSaturdayEnabled: formData.get("noShowSaturdayEnabled") === "on",
      noShowSpecialDates: specialDates,
      noShowCancellationHours: cancellationHours,
      noShowCreditOnLateCancellation: formData.get("noShowCreditOnLateCancellation") === "on",
    },
  });
  revalidatePath(`/restaurants/${restaurantId}/revenue`);
  redirect(`/restaurants/${restaurantId}/revenue?tab=protect&result=saved`);
}

export async function createExperience(restaurantId: string, formData: FormData) {
  await assertRestaurantOwner(restaurantId);
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { paymentsStripeOnboardingComplete: true, paymentsStripeAccountId: true, websiteHeroImage: true },
  });
  if (!restaurant?.paymentsStripeAccountId || !restaurant.paymentsStripeOnboardingComplete) {
    redirect(`/restaurants/${restaurantId}/revenue?tab=experiences&result=connect-required`);
  }

  const title = String(formData.get("title") || "").trim().slice(0, 90);
  const summary = String(formData.get("summary") || "").trim().slice(0, 320);
  const startsAt = lisbonLocalToUtc(String(formData.get("startsAt") || ""));
  const pricePerPerson = boundedNumber(formData.get("pricePerPerson"), 1, 5000, 0);
  const capacity = boundedInt(formData.get("capacity"), 1, 1000, 0);
  const cancellationHours = boundedInt(formData.get("cancellationHours"), 1, 336, 48);
  if (!title || !summary || !startsAt || startsAt <= new Date() || !pricePerPerson || !capacity) {
    redirect(`/restaurants/${restaurantId}/revenue?tab=experiences&result=invalid`);
  }

  const addOns = [1, 2, 3].flatMap((index) => {
    const name = String(formData.get(`addOnName${index}`) || "").trim().slice(0, 70);
    const price = boundedNumber(formData.get(`addOnPrice${index}`), 0, 1000, 0);
    if (!name || price <= 0) return [];
    return [{ name, price, perGuest: formData.get(`addOnPerGuest${index}`) === "on" }];
  });

  await prisma.diningExperience.create({
    data: {
      restaurantId,
      title,
      summary,
      startsAt,
      durationMinutes: boundedInt(formData.get("durationMinutes"), 30, 720, 120),
      pricePerPerson,
      capacity,
      cancellationHours,
      imageUrl: restaurant.websiteHeroImage,
      addOns: { create: addOns },
    },
  });
  revalidatePath(`/restaurants/${restaurantId}/revenue`);
  revalidatePath(`/reserve`);
  redirect(`/restaurants/${restaurantId}/revenue?tab=experiences&result=created`);
}

export async function updateExperienceState(restaurantId: string, formData: FormData) {
  await assertRestaurantOwner(restaurantId);
  const experienceId = String(formData.get("experienceId") || "");
  const intent = String(formData.get("intent") || "toggle");
  const experience = await prisma.diningExperience.findFirst({
    where: { id: experienceId, restaurantId },
    select: { id: true, active: true, _count: { select: { reservations: true } } },
  });
  if (!experience) throw new Error("Experiência não encontrada.");
  if (intent === "delete" && experience._count.reservations === 0) {
    await prisma.diningExperience.delete({ where: { id: experience.id } });
  } else {
    await prisma.diningExperience.update({ where: { id: experience.id }, data: { active: intent === "delete" ? false : !experience.active } });
  }
  revalidatePath(`/restaurants/${restaurantId}/revenue`);
  redirect(`/restaurants/${restaurantId}/revenue?tab=experiences&result=updated`);
}

function boundedInt(value: FormDataEntryValue | null, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function boundedNumber(value: FormDataEntryValue | null, min: number, max: number, fallback: number) {
  const parsed = Number(String(value || "").replace(",", "."));
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? Math.round(parsed * 100) / 100 : fallback;
}

function lisbonLocalToUtc(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const [dateValue, timeValue] = value.split("T");
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  const targetWall = Date.UTC(year, month - 1, day, hour, minute);
  let instant = new Date(targetWall);
  for (let index = 0; index < 2; index += 1) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(instant).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
    const localWall = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    instant = new Date(instant.getTime() + targetWall - localWall);
  }
  return Number.isNaN(instant.getTime()) ? null : instant;
}
