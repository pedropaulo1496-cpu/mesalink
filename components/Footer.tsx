"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-[#E1D0B8] bg-[#EFE5D6] text-[#16120E]">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div>
            <h3 className="text-2xl font-semibold tracking-[-0.05em]">
              <span className="text-[#C8A56A]">Mesa</span>
              <span className="text-[#16120E]">Link</span>
            </h3>

            <p className="mt-4 max-w-sm text-sm leading-6 text-[#6B6258]">
              {t("tagline")}
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-[#9B6F3B]">
              {t("linksTitle")}
            </h4>

            <div className="space-y-3">
              <FooterLink href="/software-para-restaurantes">{t("software")}</FooterLink>
              <FooterLink href="/pricing">{t("pricing")}</FooterLink>
              <FooterLink href="/contact">{t("contact")}</FooterLink>
              <FooterLink href="/global-sales-partners">Parceiros comerciais</FooterLink>
              <FooterLink href="/#downloads">Apps Android</FooterLink>
              <FooterLink href="/login">{t("login")}</FooterLink>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-[#9B6F3B]">
              {t("legalTitle")}
            </h4>

            <div className="space-y-3">
              <FooterLink href="/privacy">{t("privacy")}</FooterLink>
              <FooterLink href="/terms">{t("terms")}</FooterLink>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-[#E1D0B8] pt-6 text-sm text-[#6B6258] md:flex-row md:items-center md:justify-between">
          <p>{t("copyright")}</p>
          <p>info@mesalink.pt</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block text-sm text-[#6B6258] transition hover:text-[#16120E]"
    >
      {children}
    </Link>
  );
}
