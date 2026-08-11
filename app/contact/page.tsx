import type { Metadata } from "next";
import Footer from "@/components/Footer";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Contacto e Demonstração",
  description: "Fale com a equipa MesaLink e peça uma demonstração do software de gestão para restaurantes.",
  alternates: { canonical: "https://www.mesalink.pt/contact" },
};

export default async function ContactPage() {
  const t = await getTranslations("staticPages.contact");

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-5 py-8 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <Badge>{t("badge")}</Badge>

            <h1 className="mt-5 text-[46px] font-semibold leading-[0.9] tracking-[-0.065em] sm:text-6xl">
              {t("title")}
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#6B6258]">
              {t("text")}
            </p>

            <div className="mt-8 rounded-[32px] border border-[#E1D0B8] bg-white p-6 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9B6F3B]">
                {t("emailCard.label")}
              </p>

              <p className="mt-3 break-all text-2xl font-semibold text-[#16120E]">
                info@mesalink.pt
              </p>

              <p className="mt-3 text-sm text-[#6B6258]">
                {t("emailCard.reply")}
              </p>
            </div>

            <div className="mt-5 rounded-[32px] border border-[#E1D0B8] bg-[#FFF9F0] p-6">
              <h2 className="text-xl font-semibold text-[#16120E]">
                {t("infoCard.title")}
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-[#6B6258]">
                {t("infoCard.text")}
              </p>
            </div>
          </div>

          <form className="rounded-[32px] border border-[#E1D0B8] bg-white p-6 shadow-[0_22px_70px_rgba(80,55,30,0.055)] sm:p-8">
            <div className="space-y-4">
              <Input placeholder={t("form.namePlaceholder")} />
              <Input placeholder={t("form.emailPlaceholder")} type="email" />
              <Input placeholder={t("form.restaurantPlaceholder")} />

              <textarea
                placeholder={t("form.messagePlaceholder")}
                rows={5}
                className="w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 py-4 text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
              />
            </div>

            <Button
              type="submit"
              className="mt-6 h-14 w-full rounded-full bg-[#16120E] text-base font-semibold text-white hover:bg-[#2A2118]"
            >
              {t("form.send")}
            </Button>

            <p className="mt-4 text-center text-xs text-[#9B8F82]">
              {t("form.note")}
            </p>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Input({
  placeholder,
  type = "text",
}: {
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className="h-14 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
    />
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-[#E1D0B8] bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#9B6F3B]">
      {children}
    </span>
  );
}
