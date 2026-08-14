import Image from "next/image";
import { GalleryTile } from "./WebsiteCards";
import type { WebsiteTemplate } from "./templates";
import {
  formatOpeningHour,
  getGalleryItems,
  getFaqItems,
  getMapsEmbedUrl,
  getMapsUrl,
  getWebsiteMenus,
  getReserveUrl,
  type OpeningHour,
  type PublicRestaurant,
} from "./utils";

type Translator = (key: string, values?: Record<string, string | number>) => string;

function hasText(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0);
}

function getSectionPalette(template: WebsiteTemplate) {
  if (template === "LUXURY") {
    return {
      base: "bg-[#16120E] text-[#F5EFE6]",
      alt: "bg-[#211810] text-[#F5EFE6]",
      card: "border-white/10 bg-white/[0.055]",
      border: "border-white/10",
      eyebrow: "text-[#C8A56A]",
      muted: "text-[#D6C8B6]/70",
      strong: "text-[#F5EFE6]",
      chip: "border-white/10 bg-white/[0.06] text-[#EADBC5]",
    };
  }

  if (template === "MINIMAL") {
    return {
      base: "bg-white text-zinc-950",
      alt: "bg-zinc-50 text-zinc-950",
      card: "border-zinc-200 bg-white",
      border: "border-zinc-200",
      eyebrow: "text-zinc-400",
      muted: "text-zinc-500",
      strong: "text-zinc-950",
      chip: "border-zinc-200 bg-white text-zinc-600",
    };
  }

  if (template === "SOCIAL") {
    return {
      base: "bg-[#F7EFE5] text-[#1C1510]",
      alt: "bg-[#FFF8EF] text-[#1C1510]",
      card: "border-[#E6CBBB] bg-white",
      border: "border-[#E6CBBB]",
      eyebrow: "text-[#A14E36]",
      muted: "text-[#725F54]",
      strong: "text-[#1C1510]",
      chip: "border-[#E6CBBB] bg-white text-[#8A4937]",
    };
  }

  return {
    base: "bg-[#F5EFE6] text-[#16120E]",
    alt: "bg-[#FFF9F0] text-[#16120E]",
    card: "border-[#E1D0B8] bg-white",
    border: "border-[#E1D0B8]",
    eyebrow: "text-[#9B6F3B]",
    muted: "text-[#6B6258]",
    strong: "text-[#16120E]",
    chip: "border-[#DCCBAF] bg-[#FFF9F0] text-[#795D38]",
  };
}

export function MenuSection({
  restaurant,
  primaryColor,
  template,
  t,
}: {
  restaurant: PublicRestaurant;
  primaryColor: string;
  template: WebsiteTemplate;
  t: Translator;
}) {
  const menus = getWebsiteMenus(restaurant);

  if (menus.length === 0) return null;

  const hasTitle = hasText(restaurant.websiteMenuTitle);
  const hasDescription = hasText(restaurant.websiteMenuDescription);
  const palette = getSectionPalette(template);

  return (
    <section id="menu" className={`scroll-mt-24 px-6 py-20 md:py-28 ${palette.alt}`}>
      <div className="mx-auto max-w-7xl">
        <div className={`overflow-hidden rounded-[2.25rem] border shadow-[0_24px_80px_rgba(30,20,10,0.08)] ${palette.card}`}>
          <div className="grid gap-8 p-7 md:p-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.34em] ${palette.eyebrow}`}>{t("nav.menu")}</p>
              {hasTitle && (
                <h2 className={`mt-4 max-w-3xl text-4xl font-semibold leading-[0.94] tracking-[-0.055em] md:text-6xl ${palette.strong}`}>
                  {restaurant.websiteMenuTitle}
                </h2>
              )}

              {hasDescription && (
                <p className={`mt-6 max-w-xl text-base leading-7 md:text-lg md:leading-8 ${palette.muted}`}>
                  {restaurant.websiteMenuDescription}
                </p>
              )}
              <p className={`mt-7 text-xs font-semibold uppercase tracking-[0.18em] ${palette.eyebrow}`}>
                {t("menuSection.available", { count: menus.length })}
              </p>
            </div>

            <div className="grid content-start gap-3">
              {menus.map((menu, index) => (
                <a
                  key={`${menu.pdf}-${index}`}
                  href={menu.pdf}
                  target="_blank"
                  rel="noreferrer"
                  className={`group flex min-h-20 items-center justify-between gap-5 rounded-[1.35rem] border p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${palette.border}`}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: primaryColor }}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={`truncate text-base font-semibold ${palette.strong}`}>
                      {menu.title || t("menuSection.fallbackTitle", { index: index + 1 })}
                    </span>
                  </div>
                  <span className={`text-xl transition group-hover:translate-x-1 ${palette.eyebrow}`}>↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ReservationAndHoursSection({
  restaurant,
  hours,
  primaryColor,
  template,
  t,
}: {
  restaurant: PublicRestaurant;
  hours: OpeningHour[];
  primaryColor: string;
  template: WebsiteTemplate;
  t: Translator;
}) {
  const hasIntro =
    hasText(restaurant.websiteAboutTitle) ||
    hasText(restaurant.websiteFeatureTitle) ||
    hasText(restaurant.websiteAboutText) ||
    hasText(restaurant.websiteFeatureText);

  if (!hasIntro && hours.length === 0) return null;
  const palette = getSectionPalette(template);

  return (
    <section id="sobre" className={`scroll-mt-24 px-6 py-20 md:py-28 ${palette.base}`}>
      <div className={`mx-auto gap-12 ${hasIntro ? "grid max-w-7xl lg:grid-cols-[1.12fr_0.88fr] lg:items-start" : "max-w-3xl"}`}>
        {hasIntro && (
          <div>
            {hasText(restaurant.websiteAboutTitle) && (
              <p className={`text-xs font-semibold uppercase tracking-[0.38em] ${palette.eyebrow}`}>
                {restaurant.websiteAboutTitle}
              </p>
            )}

            {hasText(restaurant.websiteFeatureTitle) && (
              <h2 className={`mt-5 max-w-4xl text-4xl font-semibold leading-[0.94] tracking-[-0.06em] md:text-6xl ${palette.strong}`}>
                {restaurant.websiteFeatureTitle}
              </h2>
            )}

            {hasText(restaurant.websiteAboutText) && (
              <p className={`mt-7 max-w-2xl text-lg leading-8 ${palette.muted}`}>
                {restaurant.websiteAboutText}
              </p>
            )}

            {hasText(restaurant.websiteFeatureText) && (
              <p className={`mt-5 max-w-2xl text-sm leading-7 ${palette.muted}`}>
                {restaurant.websiteFeatureText}
              </p>
            )}

            {restaurant.websiteSpecialties.length > 0 && <div className="mt-7 flex flex-wrap gap-2">
              {restaurant.websiteSpecialties.map((specialty) => <span key={specialty} className={`rounded-full border px-4 py-2 text-xs font-semibold ${palette.chip}`}>{specialty}</span>)}
            </div>}

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone}`}
                  className={`inline-flex items-center justify-center rounded-full border px-7 py-3.5 text-sm font-semibold transition hover:-translate-y-0.5 ${palette.card} ${palette.strong}`}
                >
                  {t("call")}
                </a>
              )}

              {restaurant.email && (
                <a
                  href={`mailto:${restaurant.email}`}
                  className={`inline-flex items-center justify-center rounded-full border px-7 py-3.5 text-sm font-semibold transition hover:-translate-y-0.5 ${palette.card} ${palette.strong}`}
                >
                  {t("contact.email")}
                </a>
              )}
            </div>
          </div>
        )}

        <div
          id="horario"
          className={`overflow-hidden rounded-[2rem] border p-6 shadow-[0_24px_80px_rgba(30,20,10,0.08)] ${palette.card}`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${palette.eyebrow}`}>
              {t("hoursTitle")}
            </p>
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
          </div>

          <div className="mt-6 grid gap-2">
            {hours.map((item) => (
              <div
                key={item.shortDay}
                className={`flex items-center justify-between gap-4 border-b py-2.5 last:border-b-0 ${palette.border}`}
              >
                <span className={`text-sm font-semibold ${palette.strong}`}>
                  {item.shortDay}
                </span>
                <span className={`max-w-[220px] truncate text-right text-sm font-semibold ${palette.muted}`}>
                  {formatOpeningHour(item, t)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function StorySection({
  restaurant,
  primaryColor,
  template,
}: {
  restaurant: PublicRestaurant;
  primaryColor: string;
  template: WebsiteTemplate;
}) {
  if (!hasText(restaurant.websiteSectionTitle) && !hasText(restaurant.websiteSectionText)) return null;
  const image = restaurant.websiteGalleryImage2 || restaurant.websiteGalleryImage1 || restaurant.websiteHeroImage;

  return (
    <section className={template === "LUXURY" ? "bg-[#16120E] px-6 py-8" : template === "MINIMAL" ? "bg-white px-6 py-8" : "bg-[#F5EFE6] px-6 py-8"}>
      <div className="relative mx-auto min-h-[420px] max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#17120D] text-white shadow-[0_30px_100px_rgba(20,12,7,0.18)] md:min-h-[500px]">
        {image?.startsWith("http") ? (
          <Image src={image} alt="" fill sizes="100vw" className="object-cover opacity-35" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(200,165,106,.28),transparent_35%),#17120D]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#17120D] via-[#17120D]/88 to-[#17120D]/25" />
        <div className="relative flex min-h-[420px] max-w-3xl flex-col justify-center p-8 md:min-h-[500px] md:p-16">
          <span className="mb-8 block h-px w-16" style={{ backgroundColor: primaryColor }} />
          {hasText(restaurant.websiteSectionTitle) && (
            <h2 className="text-4xl font-semibold leading-[0.94] tracking-[-0.055em] md:text-6xl">
              {restaurant.websiteSectionTitle}
            </h2>
          )}
          {hasText(restaurant.websiteSectionText) && (
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/68 md:text-lg">
              {restaurant.websiteSectionText}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export function GallerySection({
  restaurant,
  template,
}: {
  restaurant: PublicRestaurant;
  template: WebsiteTemplate;
}) {
  const items = getGalleryItems(restaurant);

  if (items.length === 0) return null;

  const hasHeader =
    hasText(restaurant.websiteGalleryTitle) ||
    hasText(restaurant.websiteGalleryDescription);
  const palette = getSectionPalette(template);

  return (
    <section className={`px-6 py-20 md:py-28 ${palette.base}`}>
      <div className="mx-auto max-w-7xl">
        {hasHeader && (
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            {hasText(restaurant.websiteGalleryTitle) && (
              <h2 className={`max-w-4xl text-4xl font-semibold leading-[0.94] tracking-[-0.06em] md:text-6xl ${palette.strong}`}>
                {restaurant.websiteGalleryTitle}
              </h2>
            )}

            {hasText(restaurant.websiteGalleryDescription) && (
              <p className={`max-w-md text-sm leading-7 ${palette.muted}`}>
                {restaurant.websiteGalleryDescription}
              </p>
            )}
          </div>
        )}

        <div className={`grid gap-5 ${items.length === 1 ? "grid-cols-1" : "md:grid-cols-2"}`}>
          {items.map((item, index) => (
            <GalleryTile
              key={`${item.image}-${index}`}
              large={items.length === 1 || (items.length >= 3 && index === 0) || (items.length === 4 && index === 3)}
              title={item.title || ""}
              subtitle=""
              image={item.image}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function LocationSection({
  restaurant,
  primaryColor,
  template,
}: {
  restaurant: PublicRestaurant;
  primaryColor: string;
  template: WebsiteTemplate;
}) {
  const mapsUrl = getMapsUrl(restaurant);
  const displayAddress = restaurant.googleBusinessAddress || restaurant.address;
  if (!mapsUrl || !displayAddress) return null;

  const hasTitle = hasText(restaurant.websiteLocationTitle);
  const hasDescription = hasText(restaurant.websiteLocationDescription);
  const palette = getSectionPalette(template);

  return (
    <section id="localizacao" className={`scroll-mt-24 px-6 py-20 md:py-28 ${palette.alt}`}>
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
        <div className="lg:pr-8">
          <p className={`text-[10px] font-bold uppercase tracking-[0.34em] ${palette.eyebrow}`}>{restaurant.name}</p>
          {hasTitle && (
            <h2 className={`mt-4 text-4xl font-semibold leading-[0.94] tracking-[-0.06em] md:text-6xl ${palette.strong}`}>
              {restaurant.websiteLocationTitle}
            </h2>
          )}

          {hasDescription && (
            <p className={`mt-7 max-w-xl text-lg leading-8 ${palette.muted}`}>
              {restaurant.websiteLocationDescription}
            </p>
          )}
          <div className={hasTitle || hasDescription ? "mt-9" : ""}>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
              style={{ backgroundColor: primaryColor }}
            >
              Google Maps
            </a>
          </div>

          <div className={`mt-10 grid gap-4 text-sm ${palette.muted}`}>
            <p className={`font-semibold ${palette.strong}`}>{displayAddress}</p>

            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} className={`font-semibold hover:opacity-70 ${palette.strong}`}>
                {restaurant.phone}
              </a>
            )}

            {restaurant.email && (
              <a href={`mailto:${restaurant.email}`} className={`break-words font-semibold hover:opacity-70 ${palette.strong}`}>
                {restaurant.email}
              </a>
            )}
          </div>
        </div>

        <div className={`overflow-hidden rounded-[2.5rem] border shadow-[0_26px_90px_rgba(30,20,10,0.12)] ${palette.border}`}>
          <iframe
            src={getMapsEmbedUrl(restaurant)}
            title={`Localização de ${restaurant.name}`}
            className="h-[420px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ restaurant, template }: { restaurant: PublicRestaurant; template: WebsiteTemplate }) {
  const items = getFaqItems(restaurant);
  if (items.length === 0) return null;
  const socialTone = template === "SOCIAL";

  return <section className={`px-6 py-20 text-white md:py-28 ${socialTone ? "bg-[#7F3F2E]" : "bg-[#17120D]"}`}>
    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#D7B267]">Informação útil</p>
        <h2 className="mt-5 text-4xl font-semibold leading-[0.94] tracking-[-0.06em] md:text-6xl">{restaurant.websiteFaqTitle || "Perguntas frequentes"}</h2>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => <details key={`${item.question}-${index}`} className="group rounded-[20px] border border-white/12 bg-white/[0.045] p-5 transition open:bg-white/[0.09]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold"><span>{item.question}</span><span className="text-xl text-[#D7B267] transition group-open:rotate-45">+</span></summary>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D5C6B4]">{item.answer}</p>
        </details>)}
      </div>
    </div>
  </section>;
}

export function FinalCtaSection({
  restaurant,
  primaryColor,
  template,
  t,
}: {
  restaurant: PublicRestaurant;
  primaryColor: string;
  template: WebsiteTemplate;
  t: Translator;
}) {
  const reserveUrl = getReserveUrl(restaurant);

  if (
    !hasText(restaurant.websiteFinalCtaTitle) &&
    !hasText(restaurant.websiteFinalCtaText)
  ) {
    return null;
  }

  return (
    <section className={`px-6 py-20 md:py-28 ${template === "LUXURY" ? "bg-[#16120E]" : template === "MINIMAL" ? "bg-white" : "bg-[#F5EFE6]"}`}>
      <div className="relative mx-auto min-h-[440px] max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#17120D] p-8 text-center text-white shadow-[0_30px_100px_rgba(20,12,7,0.2)] md:p-16">
        {restaurant.websiteHeroImage?.startsWith("http") && (
          <Image src={restaurant.websiteHeroImage} alt="" fill sizes="100vw" className="object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.08),transparent_42%),linear-gradient(to_bottom,rgba(23,18,13,.45),rgba(23,18,13,.9))]" />
        <div className="relative flex min-h-[320px] flex-col items-center justify-center">
        {hasText(restaurant.websiteFinalCtaTitle) && (
          <h2 className="mx-auto max-w-4xl text-4xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-5xl md:text-7xl">
            {restaurant.websiteFinalCtaTitle}
          </h2>
        )}

        {hasText(restaurant.websiteFinalCtaText) && (
          <p className="mx-auto mt-7 max-w-xl text-lg leading-8 text-white/68">
            {restaurant.websiteFinalCtaText}
          </p>
        )}

        <a
          href={reserveUrl}
          className="mt-10 inline-flex rounded-full px-10 py-5 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5"
          style={{ backgroundColor: primaryColor }}
        >
          {t("reserveButton")}
        </a>
        </div>
      </div>
    </section>
  );
}

export function PublicFooter({ restaurant, template, t }: { restaurant: PublicRestaurant; template: WebsiteTemplate; t: Translator }) {
  const palette = getSectionPalette(template);
  return (
    <footer className={`px-6 pb-24 md:pb-10 ${palette.base}`}>
      <div className={`mx-auto flex max-w-7xl flex-col gap-5 border-t pt-8 sm:flex-row sm:items-center sm:justify-between ${palette.border}`}>
        <div>
          <p className={`font-semibold ${palette.strong}`}>{restaurant.name}</p>
          {restaurant.address && <p className={`mt-1 text-xs ${palette.muted}`}>{restaurant.address}</p>}
        </div>
        <a href="https://www.mesalink.pt" className={`text-xs font-semibold transition hover:opacity-70 ${palette.muted}`}>
          {t("footerTagline")} ↗
        </a>
      </div>
    </footer>
  );
}

export function MobileStickyReserve({
  restaurant,
  primaryColor,
  t,
}: {
  restaurant: PublicRestaurant;
  primaryColor: string;
  t: Translator;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E1D0B8] bg-[#F5EFE6]/90 p-3 backdrop-blur-xl md:hidden">
      <a
        href={getReserveUrl(restaurant)}
        className="flex h-14 items-center justify-center rounded-full text-sm font-semibold text-white"
        style={{ backgroundColor: primaryColor }}
      >
        {t("reserveButton")}
      </a>
    </div>
  );
}
