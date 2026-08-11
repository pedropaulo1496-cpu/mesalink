"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const brand = {
  mesa: "#C8A56A",
  link: "#17130F",
};

export default function SiteHeader({
  variant = "full",
}: {
  variant?: "full" | "compact";
}) {
  const t = useTranslations("siteHeader");

  if (variant === "compact") {
    return (
      <header className="sticky top-0 z-50 border-b border-[#DECDB4] bg-[#F4ECDF]/90 px-5 py-4 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-md items-center justify-between">
          <Link href="/" className="text-3xl font-semibold tracking-[-0.06em]">
            <span style={{ color: brand.mesa }}>Mesa</span>
            <span style={{ color: brand.link }}>Link</span>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSwitcher className="h-8 px-2.5 text-[10px]" />

            <Link
              href="/login"
              className="rounded-full border border-[#D8C5A5] bg-[#FFF9F0] px-4 py-2 text-xs font-semibold"
            >
              {t("compact.login")}
            </Link>

            <Link
              href="/register"
              className="rounded-full bg-[#17130F] px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_32px_rgba(80,55,30,0.18)]"
            >
              {t("compact.cta")}
            </Link>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#DECDB4] bg-[#F4ECDF]/86 px-5 py-5 backdrop-blur-xl lg:px-8">
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="text-2xl font-semibold tracking-[-0.045em]">
          <span style={{ color: brand.mesa }}>Mesa</span>
          <span style={{ color: brand.link }}>Link</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-[#5C5348] lg:flex">
          <Link href="/software-para-restaurantes">{t("full.software")}</Link>
          <Link href="/#growth">{t("full.growth")}</Link>
          <Link href="/#platform">{t("full.platform")}</Link>
          <Link href="/#pricing">{t("full.pricing")}</Link>
          <Link href="/login">{t("full.login")}</Link>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <Link
            href="/register"
            className="rounded-full bg-[#17130F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
          >
            {t("full.cta")}
          </Link>
        </div>
      </nav>
    </header>
  );
}
