"use client";

import Footer from "@/components/Footer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { isValidEmail } from "@/lib/validation";

const inputClass =
  "h-14 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth.login");

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!isValidEmail(emailAddress)) {
      setError(t("errors.invalidEmail"));
      return;
    }

    if (!acceptedTerms) {
      setError(t("errors.termsRequired"));
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await signIn("credentials", {
        email: emailAddress,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("errors.invalidCredentials"));
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="fixed right-4 top-4 z-30">
        <LanguageSwitcher />
      </div>

      <section className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="text-3xl font-semibold tracking-[-0.05em]">
              <span className="text-[#C8A56A]">Mesa</span>
              <span className="text-[#16120E]">Link</span>
            </Link>
          </div>

          <div className="rounded-[32px] border border-[#E1D0B8] bg-white p-6 shadow-[0_22px_70px_rgba(80,55,30,0.055)] sm:p-8">
            <Link href="/" className="text-sm font-semibold text-[#6B6258] hover:text-[#16120E]">
              {t("back")}
            </Link>

            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.055em]">
              {t("title")}
            </h1>

            <p className="mb-8 mt-3 text-sm leading-6 text-[#6B6258]">
              {t("subtitle")}
            </p>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <input value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} type="email" placeholder={t("emailPlaceholder")} className={inputClass} required />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder={t("passwordPlaceholder")} className={inputClass} required />
              </div>

              <div className="mt-3 text-right">
                <Link href="/forgot-password" className="text-sm font-semibold text-[#9B6F3B] hover:text-[#16120E]">
                  {t("forgotPassword")}
                </Link>
              </div>

              <div className="mt-4 flex items-start gap-3">
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 h-4 w-4 accent-[#16120E]" />

                <label className="text-sm leading-relaxed text-[#6B6258]">
                  {t("terms.prefix")}{" "}
                  <a href="/terms" target="_blank" className="font-semibold text-[#9B6F3B] hover:text-[#16120E]">
                    {t("terms.termsLink")}
                  </a>{" "}
                  {t("terms.and")}{" "}
                  <a href="/privacy" target="_blank" className="font-semibold text-[#9B6F3B] hover:text-[#16120E]">
                    {t("terms.privacyLink")}
                  </a>
                  {t("terms.suffix")}
                </label>
              </div>

              {error && (
                <p className="mt-4 rounded-2xl border border-[#E7B7A8] bg-[#FFF0EA] p-3 text-sm text-[#A14E36]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-[#16120E] text-base font-semibold text-white transition hover:bg-[#2A2118] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t("submitLoading") : t("submit")}
              </button>
            </form>

            <div className="mt-8 border-t border-[#E8DCCB] pt-6 text-center">
              <p className="text-sm text-[#6B6258]">{t("noAccount")}</p>

              <Link href="/register" className="mt-2 inline-block font-semibold text-[#9B6F3B] hover:text-[#16120E]">
                {t("registerLink")}
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[#9B8F82]">
            {t("tagline")}
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}