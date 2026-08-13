"use client";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { isValidEmail } from "@/lib/validation";
import { ArrowRight, CalendarCheck2, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from "lucide-react";

const inputClass =
  "h-[58px] w-full rounded-[18px] border border-[#E4D6C3] bg-[#FBF7F0] pl-12 pr-4 text-[15px] font-medium text-[#16120E] outline-none transition placeholder:font-normal placeholder:text-[#9B8F82] focus:border-[#B88C4A] focus:bg-white focus:ring-4 focus:ring-[#C8A56A]/10";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth.login");

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [appMode, setAppMode] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const invitedEmail = new URLSearchParams(window.location.search).get("email");
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone) ||
      document.referrer.startsWith("android-app://");
    const timer = window.setTimeout(() => {
      if (invitedEmail) setEmailAddress(invitedEmail);
      setAppMode(standalone);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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

      const requestedPath = new URLSearchParams(window.location.search).get("callbackUrl");
      const destination = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
        ? requestedPath
        : "/dashboard";
      router.push(destination);
      router.refresh();
    } catch {
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#17120D] text-[#16120E] lg:grid lg:grid-cols-[minmax(360px,0.82fr)_minmax(540px,1.18fr)]">
      <section className="relative hidden min-h-[100dvh] overflow-hidden bg-[#17120D] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-36 -top-36 h-[460px] w-[460px] rounded-full bg-[#C8A56A]/15 blur-3xl" />
        <div className="absolute -bottom-44 -right-32 h-[520px] w-[520px] rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3">
          <Image src="/icons/apps/restaurant-192.png" alt="" width={48} height={48} className="rounded-[15px]" priority />
          <div>
            <p className="text-2xl font-semibold tracking-[-0.05em]"><span className="text-[#D7B267]">Mesa</span>Link</p>
            <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/45">Restaurantes</p>
          </div>
        </div>
        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D7B267]/25 bg-[#D7B267]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#E7C985]"><Sparkles className="size-3.5" /> {t("appEyebrow")}</span>
          <h2 className="mt-6 text-5xl font-semibold leading-[0.98] tracking-[-0.065em]">{t("appHeadline")}</h2>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-white/58">{t("appDescription")}</p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-[22px] border border-white/10 bg-white/[0.055] p-4"><CalendarCheck2 className="size-5 text-[#D7B267]" /><p className="mt-5 text-sm font-semibold">{t("operationTitle")}</p><p className="mt-1 text-xs text-white/45">{t("operationText")}</p></div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.055] p-4"><Sparkles className="size-5 text-[#D7B267]" /><p className="mt-5 text-sm font-semibold">{t("growthTitle")}</p><p className="mt-1 text-xs text-white/45">{t("growthText")}</p></div>
          </div>
        </div>
        <p className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">MesaLink · Restaurant operating system</p>
      </section>

      <section className="relative flex min-h-[100dvh] flex-col bg-[#F5EFE6] lg:items-center lg:justify-center lg:px-10 lg:py-12">
        <div className="absolute right-4 top-[max(16px,env(safe-area-inset-top))] z-30 lg:right-8 lg:top-8">
          <LanguageSwitcher className="border-white/15 bg-white/10 text-white backdrop-blur-lg hover:bg-white/15 lg:border-[#E3D3BC] lg:bg-[#FFF9F0] lg:text-[#6B6258]" />
        </div>

        <div className="relative flex h-[224px] shrink-0 flex-col justify-end overflow-hidden bg-[#17120D] px-5 pb-12 pt-[max(28px,env(safe-area-inset-top))] text-white lg:hidden">
          <div className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-[#C8A56A]/20 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <Image src="/icons/apps/restaurant-192.png" alt="" width={52} height={52} className="rounded-[17px] shadow-xl" priority />
            <div><p className="text-[27px] font-semibold tracking-[-0.055em]"><span className="text-[#D7B267]">Mesa</span>Link</p><p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/45">Restaurantes</p></div>
          </div>
          <p className="relative mt-4 text-sm text-white/55">{t("mobileTagline")}</p>
        </div>

        <div className="relative z-10 -mt-7 flex min-h-[calc(100dvh-197px)] w-full flex-col rounded-t-[32px] bg-[#F5EFE6] px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-7 lg:mt-0 lg:min-h-0 lg:max-w-[500px] lg:rounded-[34px] lg:border lg:border-[#E1D0B8] lg:bg-white lg:p-9 lg:shadow-[0_26px_90px_rgba(72,48,24,0.09)]">
          {!appMode && <Link href="/" className="mb-5 hidden w-fit text-xs font-bold text-[#7B6B59] transition hover:text-[#16120E] lg:block">{t("back")}</Link>}

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#A6793E]">{t("accountEyebrow")}</p>
            <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.055em] sm:text-4xl">{t("title")}</h1>
            <p className="mt-2 text-sm leading-6 text-[#71675C]">{t("subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            <div className="space-y-3">
              <div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#9B7B54]" /><input value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} type="email" inputMode="email" autoComplete="email" placeholder={t("emailPlaceholder")} className={inputClass} required /></div>
              <div className="relative"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#9B7B54]" /><input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder={t("passwordPlaceholder")} className={`${inputClass} pr-12`} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? t("hidePassword") : t("showPassword")} className="absolute right-2.5 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-[#796B5B] transition hover:bg-[#EFE5D7]">{showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}</button></div>
            </div>

            <div className="mt-3 text-right"><Link href="/forgot-password" className="text-xs font-bold text-[#8D6738] hover:text-[#16120E]">{t("forgotPassword")}</Link></div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[18px] border border-[#E4D6C3] bg-white/60 p-3.5 lg:bg-[#FBF7F0]">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5 size-[18px] shrink-0 accent-[#16120E]" />
              <span className="text-[11px] leading-[1.55] text-[#6B6258]">{t("terms.prefix")}{" "}<a href="/terms" target="_blank" className="font-bold text-[#8D6738]">{t("terms.termsLink")}</a>{" "}{t("terms.and")}{" "}<a href="/privacy" target="_blank" className="font-bold text-[#8D6738]">{t("terms.privacyLink")}</a>{t("terms.suffix")}</span>
            </label>

            {error && <p role="alert" className="mt-4 rounded-[16px] border border-[#E7B7A8] bg-[#FFF0EA] px-4 py-3 text-xs font-medium leading-5 text-[#A14E36]">{error}</p>}

            <button type="submit" disabled={loading} className="mt-5 flex h-[58px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#17120D] text-[15px] font-bold text-white shadow-[0_14px_35px_rgba(23,18,13,0.2)] transition active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60">{loading ? t("submitLoading") : t("submit")} {!loading && <ArrowRight className="size-[18px]" />}</button>
          </form>

          <div className="mt-auto pt-7 text-center lg:mt-6 lg:border-t lg:border-[#E8DCCB] lg:pt-5">
            <p className="text-xs text-[#71675C]">{t("noAccount")} <Link href="/register" className="ml-1 font-bold text-[#8D6738] hover:text-[#16120E]">{t("registerLink")}</Link></p>
            <div className="mt-5 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-[#A29484]"><span className="h-px w-6 bg-[#D8C7B0]" /> {t("secure")} <span className="h-px w-6 bg-[#D8C7B0]" /></div>
          </div>
        </div>
      </section>
    </main>
  );
}
