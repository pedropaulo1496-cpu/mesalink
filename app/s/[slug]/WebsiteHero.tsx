import Image from "next/image";
import type { WebsiteTemplate } from "./templates";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  getDisplayCuisine,
  getDisplayDescription,
  getDisplayTitle,
  getPublicWebsiteUrl,
  getReserveUrl,
  getWebsiteMenus,
  hasValidHeroImage,
  hasValidLogo,
  normalizeInstagramUrl,
  type OpeningHour,
  type PublicRestaurant,
} from "./utils";

type Translator = (key: string) => string;

type Theme = {
  page: string;
  sectionDark: string;
  sectionLight: string;
  card: string;
  accent: string;
  eyebrow: string;
  muted: string;
};

function Brand({
  restaurant,
  light = false,
}: {
  restaurant: PublicRestaurant;
  light?: boolean;
}) {
  const hasLogo = hasValidLogo(restaurant);

  return (
    <a href={getPublicWebsiteUrl(restaurant)} className="flex min-w-0 items-center gap-3">
      {hasLogo ? (
        <img
          src={restaurant.websiteLogoImage!}
          alt={restaurant.name}
          className="h-11 max-w-[135px] object-contain sm:h-14 sm:max-w-[210px]"
        />
      ) : (
        <span
          className={
            light
              ? "text-lg font-semibold text-[#F5EFE6]"
              : "text-lg font-semibold text-[#16120E]"
          }
        >
          {restaurant.name}
        </span>
      )}
    </a>
  );
}

function Header({
  restaurant,
  reserveUrl,
  light = false,
  primaryColor,
  t,
}: {
  restaurant: PublicRestaurant;
  reserveUrl: string;
  light?: boolean;
  primaryColor: string;
  t: Translator;
}) {
  const instagramUrl = normalizeInstagramUrl(restaurant.websiteInstagram);
  const hasMenu = getWebsiteMenus(restaurant).length > 0;

  const navClass = light
    ? "hidden items-center gap-7 text-sm font-semibold text-[#F5EFE6]/70 md:flex"
    : "hidden items-center gap-7 text-sm font-semibold text-[#6B6258] md:flex";

  const navHover = light ? "hover:text-[#F5EFE6]" : "hover:text-[#16120E]";

  return (
    <header className="relative z-30 flex items-center justify-between gap-3">
      <Brand restaurant={restaurant} light={light} />

      <nav className={navClass}>
        <a href="#sobre" className={navHover}>{t("nav.about")}</a>
        {hasMenu && <a href="#menu" className={navHover}>{t("nav.menu")}</a>}
        <a href="#horario" className={navHover}>{t("nav.hours")}</a>
        <a href="#localizacao" className={navHover}>{t("nav.location")}</a>
      </nav>

      <div className="flex items-center gap-2">
        <LanguageSwitcher
          className={
            light
              ? "border-[#C8A56A]/30 bg-white/[0.06] text-[#F5EFE6] hover:bg-white/[0.1]"
              : undefined
          }
          contentClassName={
            light
              ? "border-[#C8A56A]/30 bg-[#241B13] text-[#F5EFE6]"
              : undefined
          }
        />

        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className={
              light
              ? "hidden rounded-full border border-[#C8A56A]/30 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-[#F5EFE6] transition hover:bg-white/[0.1] lg:inline-flex"
              : "hidden rounded-full border border-[#E1D0B8] bg-white px-4 py-2.5 text-sm font-semibold text-[#16120E] transition hover:bg-[#FFF9F0] lg:inline-flex"
            }
          >
            Instagram
          </a>
        )}

        <a
          href={reserveUrl}
          className={
            light
              ? "rounded-full bg-[#F5EFE6] px-4 py-2.5 text-xs font-semibold text-[#16120E] shadow-lg transition hover:-translate-y-0.5 sm:px-5 sm:text-sm"
              : "rounded-full px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:-translate-y-0.5 sm:px-5 sm:text-sm"
          }
          style={!light ? { backgroundColor: primaryColor } : undefined}
        >
          {t("reserveButton")}
        </a>
      </div>
    </header>
  );
}

function ContactBar({
  restaurant,
  light = false,
  t,
}: {
  restaurant: PublicRestaurant;
  light?: boolean;
  t: Translator;
}) {
  const contacts = [
    restaurant.address ? { label: t("contact.address"), value: restaurant.address, href: null } : null,
    restaurant.phone ? { label: t("contact.phone"), value: restaurant.phone, href: `tel:${restaurant.phone}` } : null,
    restaurant.email ? { label: t("contact.email"), value: restaurant.email, href: `mailto:${restaurant.email}` } : null,
  ].filter(Boolean) as Array<{ label: string; value: string; href: string | null }>;

  if (!contacts.length) return null;
  const columns = contacts.length === 3 ? "sm:grid-cols-3" : contacts.length === 2 ? "sm:grid-cols-2" : "grid-cols-1";
  const divider = light ? "border-white/10" : "border-[#E1D0B8]";

  return (
    <div
      className={`${columns} grid overflow-hidden rounded-[1.35rem] border backdrop-blur-xl ${
        light
          ? "border-white/10 bg-black/25 text-[#F5EFE6]/75 shadow-[0_18px_55px_rgba(0,0,0,.18)]"
          : "border-[#E1D0B8] bg-white/80 text-[#6B6258] shadow-[0_18px_55px_rgba(80,55,30,.07)]"
      }`}
    >
      {contacts.map((contact, index) => {
        const value = contact.href ? (
          <a href={contact.href} className="mt-1.5 block truncate font-semibold hover:opacity-70">{contact.value}</a>
        ) : (
          <p className="mt-1.5 truncate font-semibold">{contact.value}</p>
        );
        return <div key={contact.label} className={`${index ? "border-t sm:border-l sm:border-t-0" : ""} ${divider} min-w-0 px-5 py-4 text-sm`}>
          <p className={light ? "text-[10px] font-bold uppercase tracking-[0.24em] text-[#C8A56A]" : "text-[10px] font-bold uppercase tracking-[0.24em] text-[#9B6F3B]"}>{contact.label}</p>
          {value}
        </div>;
      })}
    </div>
  );
}

function HeroButtons({
  restaurant,
  reserveUrl,
  primaryColor,
  light = false,
  t,
}: {
  restaurant: PublicRestaurant;
  reserveUrl: string;
  primaryColor: string;
  light?: boolean;
  t: Translator;
}) {
  const instagramUrl = normalizeInstagramUrl(restaurant.websiteInstagram);

  return (
    <div className="mt-10 flex flex-col gap-3 sm:flex-row">
      <a
        href={reserveUrl}
        className="inline-flex items-center justify-center rounded-full px-8 py-4 text-sm font-semibold text-white shadow-[0_18px_55px_rgba(80,55,30,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_65px_rgba(80,55,30,0.25)]"
        style={{ backgroundColor: primaryColor }}
      >
        {t("reserveButton")}
      </a>

      {restaurant.websiteMenuPdf && (
        <a
          href={restaurant.websiteMenuPdf}
          target="_blank"
          rel="noreferrer"
          className={
            light
              ? "inline-flex items-center justify-center rounded-full border border-[#C8A56A]/30 bg-white/[0.06] px-8 py-4 text-sm font-semibold text-[#F5EFE6] hover:bg-white/[0.1]"
              : "inline-flex items-center justify-center rounded-full border border-[#E1D0B8] bg-white px-8 py-4 text-sm font-semibold text-[#16120E] hover:bg-[#FFF9F0]"
          }
        >
          {t("viewMenu")}
        </a>
      )}

      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noreferrer"
          className={
            light
              ? "inline-flex items-center justify-center rounded-full border border-[#C8A56A]/30 bg-white/[0.06] px-8 py-4 text-sm font-semibold text-[#F5EFE6] hover:bg-white/[0.1]"
              : "inline-flex items-center justify-center rounded-full border border-[#E1D0B8] bg-white px-8 py-4 text-sm font-semibold text-[#16120E] hover:bg-[#FFF9F0]"
          }
        >
          Instagram
        </a>
      )}
    </div>
  );
}

export function WebsiteHero({
  restaurant,
  primaryColor,
  template,
  t,
}: {
  restaurant: PublicRestaurant;
  hours: OpeningHour[];
  primaryColor: string;
  theme: Theme;
  template: WebsiteTemplate;
  t: Translator;
}) {
  const reserveUrl = getReserveUrl(restaurant);
  const hasImage = hasValidHeroImage(restaurant);

  if (template === "LUXURY") {
    return (
      <section className="relative min-h-screen overflow-hidden bg-[#16120E] text-[#F5EFE6]">
        {hasImage ? (
          <Image
            src={restaurant.websiteHeroImage!}
            alt={restaurant.name}
            fill
            priority
            sizes="100vw"
            className="scale-105 object-cover opacity-32"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,165,106,0.18),transparent_38%),linear-gradient(to_bottom,#241B13,#16120E)]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-[#16120E]/92 via-[#16120E]/72 to-[#16120E]" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
          <Header restaurant={restaurant} reserveUrl={reserveUrl} light primaryColor="#C8A56A" t={t} />

          <div className="flex flex-1 items-center justify-center text-center">
            <div className="max-w-3xl py-20">
              {getDisplayCuisine(restaurant) && (
                <p className="mb-7 text-xs font-semibold uppercase tracking-[0.55em] text-[#C8A56A]">
                  {getDisplayCuisine(restaurant)}
                </p>
              )}

              <h1 className="text-5xl font-semibold leading-[0.88] tracking-[-0.065em] sm:text-6xl md:text-7xl lg:text-8xl">
                {getDisplayTitle(restaurant)}
              </h1>

              {getDisplayDescription(restaurant) && (
                <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-[#F5EFE6]/72">
                  {getDisplayDescription(restaurant)}
                </p>
              )}

              <div className="flex justify-center">
                <HeroButtons restaurant={restaurant} reserveUrl={reserveUrl} primaryColor="#C8A56A" light t={t} />
              </div>
            </div>
          </div>

          <ContactBar restaurant={restaurant} light t={t} />
        </div>
      </section>
    );
  }

  if (template === "MINIMAL") {
    return (
      <section className="bg-white px-6 py-8 text-zinc-950">
        <div className="mx-auto max-w-7xl">
          <header className="border-b border-zinc-200 pb-5">
            <Header restaurant={restaurant} reserveUrl={reserveUrl} light={false} primaryColor={primaryColor} t={t} />
          </header>

          <div className="grid min-h-[75vh] gap-10 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              {getDisplayCuisine(restaurant) && (
                <p className="mb-5 text-xs font-semibold uppercase tracking-[0.35em] text-zinc-400">
                  {getDisplayCuisine(restaurant)}
                </p>
              )}

              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.065em] md:text-7xl">
                {getDisplayTitle(restaurant)}
              </h1>

              {getDisplayDescription(restaurant) && (
                <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-500">
                  {getDisplayDescription(restaurant)}
                </p>
              )}

              <HeroButtons restaurant={restaurant} reserveUrl={reserveUrl} primaryColor={primaryColor} t={t} />
            </div>

            <div className="relative min-h-[520px] overflow-hidden rounded-[2.5rem] bg-zinc-100">
              {hasImage ? (
                <Image
                  src={restaurant.websiteHeroImage!}
                  alt={restaurant.name}
                  fill
                  priority
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.12),transparent_50%),linear-gradient(to_bottom,#f4f4f5,#e4e4e7)]" />
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (template === "SOCIAL") {
    return (
      <section className="relative min-h-screen overflow-hidden bg-[#F5EFE6] text-[#16120E]">
        <div className="relative mx-auto grid min-h-screen max-w-7xl gap-8 px-6 py-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div className="relative z-10 flex min-h-[70vh] flex-col justify-between">
            <Header restaurant={restaurant} reserveUrl={reserveUrl} primaryColor="#A14E36" t={t} />

            <div className="py-12">
              {getDisplayCuisine(restaurant) && (
                <p className="mb-6 text-xs font-semibold uppercase tracking-[0.45em] text-[#A14E36]">
                  {getDisplayCuisine(restaurant)}
                </p>
              )}

              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.88] tracking-[-0.065em] sm:text-6xl md:text-7xl">
                {getDisplayTitle(restaurant)}
              </h1>

              {getDisplayDescription(restaurant) && (
                <p className="mt-8 max-w-xl text-lg leading-8 text-[#6B6258] md:text-xl md:leading-9">
                  {getDisplayDescription(restaurant)}
                </p>
              )}

              <HeroButtons restaurant={restaurant} reserveUrl={reserveUrl} primaryColor="#A14E36" t={t} />
            </div>
          </div>

          <div className="relative min-h-[78vh] overflow-hidden rounded-[3rem] border border-[#E1D0B8] bg-white shadow-[0_22px_70px_rgba(80,55,30,0.055)]">
            {hasImage ? (
              <Image
                src={restaurant.websiteHeroImage!}
                alt={restaurant.name}
                fill
                priority
                sizes="(min-width: 1024px) 59vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(161,78,54,0.22),transparent_45%),linear-gradient(to_bottom,#FFF9F0,#EFE5D6)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#16120E]/65 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 rounded-[2rem] border border-white/25 bg-white/85 p-5 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#A14E36]">{t("heroBadgeOnline")}</p>
              <p className="mt-2 text-2xl font-semibold text-[#16120E]">{t("heroBadgeText")}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#F5EFE6] text-[#16120E]">
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
        <Header restaurant={restaurant} reserveUrl={reserveUrl} primaryColor={primaryColor} t={t} />

        <div className="grid flex-1 gap-10 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="max-w-4xl">
            {getDisplayCuisine(restaurant) && (
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.45em] text-[#9B6F3B]">
                {getDisplayCuisine(restaurant)}
              </p>
            )}

            <h1 className="max-w-5xl text-5xl font-semibold leading-[0.88] tracking-[-0.065em] sm:text-6xl md:text-7xl lg:text-8xl">
              {getDisplayTitle(restaurant)}
            </h1>

            {getDisplayDescription(restaurant) && (
              <p className="mt-8 max-w-2xl text-lg leading-8 text-[#6B6258] md:text-xl md:leading-9">
                {getDisplayDescription(restaurant)}
              </p>
            )}

            <HeroButtons restaurant={restaurant} reserveUrl={reserveUrl} primaryColor={primaryColor} t={t} />
          </div>

          <div className="group relative min-h-[500px] overflow-hidden rounded-[2.5rem] border border-[#E1D0B8] bg-white shadow-[0_28px_90px_rgba(80,55,30,0.1)] md:min-h-[560px]">
            {hasImage ? (
              <Image
                src={restaurant.websiteHeroImage!}
                alt={restaurant.name}
                fill
                priority
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover transition duration-1000 group-hover:scale-[1.025]"
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(200,165,106,0.24),transparent_45%),linear-gradient(to_bottom,#FFF9F0,#EFE5D6)]" />
            )}
            {hasImage && <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />}
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-4 rounded-[1.4rem] border border-white/25 bg-white/85 px-5 py-4 text-[#16120E] shadow-xl backdrop-blur-xl">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9B6F3B]">{t("heroBadgeOnline")}</p>
                <p className="mt-1 font-semibold">{t("heroBadgeText")}</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.13)]" />
            </div>
          </div>
        </div>

        <ContactBar restaurant={restaurant} t={t} />
      </div>
    </section>
  );
}
