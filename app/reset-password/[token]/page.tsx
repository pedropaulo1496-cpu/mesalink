"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("auth.resetPassword");

  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage(t("errors.passwordMismatch"));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || t("errors.generic"));
        return;
      }

      setMessage(t("successMessage"));

      setTimeout(() => {
        router.push(data.destination || "/login");
      }, 2000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070504] text-[#fff7ea]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(240,195,106,0.18),transparent_32%),linear-gradient(to_bottom,#070504,#120d08)]" />

      <div className="fixed right-4 top-4 z-30">
        <LanguageSwitcher />
      </div>

      <div className="relative flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-md rounded-[2rem] border border-[#f0c36a]/15 bg-[#15100b] p-8 shadow-2xl">
          <h1 className="text-3xl font-black">
            {t("title")}
          </h1>

          <p className="mt-3 text-[#a99a82]">
            {t("subtitle")}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="password"
              placeholder={t("newPasswordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 w-full rounded-2xl border border-[#f0c36a]/10 bg-black/20 px-4 text-white"
              required
            />

            <input
              type="password"
              placeholder={t("confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-14 w-full rounded-2xl border border-[#f0c36a]/10 bg-black/20 px-4 text-white"
              required
            />

            {message && (
              <p className="text-sm text-[#f0c36a]">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-14 w-full rounded-full bg-[#f0c36a] font-bold text-black"
            >
              {loading ? t("submitLoading") : t("submit")}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
