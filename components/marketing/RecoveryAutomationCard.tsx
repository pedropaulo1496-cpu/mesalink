"use client";

import { useTranslations } from "next-intl";
import RecoveryOfferButton from "@/components/marketing/RecoveryOfferButton";

export default function RecoveryAutomationCard({ inactiveCustomers, restaurantId, emailsRemaining }: { inactiveCustomers: number; restaurantId: string; emailsRemaining: number }) {
  const t = useTranslations("dashboardMarketing.recoveryCard");
  return <div className="flex min-h-[112px] flex-col gap-4 rounded-3xl border border-[#E1D0B8] bg-[#FFF9F0] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{t("title")}</p><p className="mt-1 text-sm text-[#6B6258]">{t("subtitle", { count: inactiveCustomers })}</p><p className="mt-2 text-xs font-semibold text-[#8A6130]">{t("emailBalance", { count: emailsRemaining })} · {t("creditRate")}</p></div><RecoveryOfferButton restaurantId={restaurantId} label="Escolher incentivo" /></div>;
}
