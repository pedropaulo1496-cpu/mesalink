"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function BirthdayAutomationCard({
  birthdayCustomers,
}: {
  birthdayCustomers: number;
}) {
  const t = useTranslations("dashboardMarketing.birthdayCard");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function runBirthdays() {
    try {
      setLoading(true);

      const response = await fetch("/api/marketing/run-birthdays", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setSuccess(false);
        setMessage(data.error || t("error"));
        return;
      }

      setSuccess(true);
      setMessage(
        t("successMessage", { emailsSent: data.emailsSent, skipped: data.skipped })
      );

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch {
      setSuccess(false);
      setMessage(t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-[#E1D0B8] bg-[#FFF9F0] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{t("title")}</p>

          <p className="mt-1 text-sm text-[#6B6258]">
            {t("subtitle", { count: birthdayCustomers })}
          </p>
        </div>

        <button
          onClick={runBirthdays}
          disabled={loading}
          className="rounded-full bg-[#16120E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2A2118] disabled:opacity-50"
        >
          {loading ? t("sending") : t("runNow")}
        </button>
      </div>

      {message && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-medium ${
            success
              ? "border border-green-200 bg-green-50 text-green-700"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {success ? "✅ " : "❌ "}
          {message}
        </div>
      )}
    </div>
  );
}