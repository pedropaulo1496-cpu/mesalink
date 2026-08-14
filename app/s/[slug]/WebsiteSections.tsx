import { GalleryTile } from "./WebsiteCards";
import {
  formatOpeningHour,
  getGalleryItems,
  getFaqItems,
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

export function MenuSection({
  restaurant,
  t,
}: {
  restaurant: PublicRestaurant;
  primaryColor: string;
  t: Translator;
}) {
  const menus = getWebsiteMenus(restaurant);

  if (menus.length === 0) return null;

  const hasTitle = hasText(restaurant.websiteMenuTitle);
  const hasDescription = hasText(restaurant.websiteMenuDescription);

  return (
    <section id="menu" className="bg-[#FFF9F0] px-6 py-24 text-[#16120E]">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2.5rem] border border-[#E1D0B8] bg-white shadow-[0_22px_70px_rgba(80,55,30,0.055)]">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.75fr]">
            <div className="p-8 md:p-12">
              {hasTitle && (
                <h2 className="max-w-4xl text-5xl font-semibold leading-[0.9] tracking-[-0.07em] md:text-7xl">
                  {restaurant.websiteMenuTitle}
                </h2>
              )}

              {hasDescription && (
                <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6B6258]">
                  {restaurant.websiteMenuDescription}
                </p>
              )}

              <div
                className={
                  hasTitle || hasDescription
                    ? "mt-9 flex flex-wrap gap-3"
                    : "flex flex-wrap gap-3"
                }
              >
                {menus.map((menu, index) => (
                  <a
                    key={`${menu.pdf}-${index}`}
                    href={menu.pdf}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-[#16120E] px-8 py-4 text-sm font-semibold text-white shadow-lg hover:bg-[#2A2118]"
                  >
                    {menu.title || t("menuSection.fallbackTitle", { index: index + 1 })}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex min-h-[320px] items-center justify-center bg-[#16120E] p-8 text-center text-white">
              <div>
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-4xl">
                  {t("menuSection.iconLabel")}
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.35em] text-white/50">
                  {t("menuSection.available", { count: menus.length })}
                </p>
              </div>
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
  t,
}: {
  restaurant: PublicRestaurant;
  hours: OpeningHour[];
  primaryColor: string;
  t: Translator;
}) {
  const hasIntro =
    hasText(restaurant.websiteAboutTitle) ||
    hasText(restaurant.websiteFeatureTitle) ||
    hasText(restaurant.websiteAboutText) ||
    hasText(restaurant.websiteFeatureText);

  if (!hasIntro && hours.length === 0) return null;

  return (
    <section id="sobre" className="bg-[#F5EFE6] px-6 py-20 text-[#16120E]">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        {hasIntro && (
          <div>
            {hasText(restaurant.websiteAboutTitle) && (
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9B6F3B]">
                {restaurant.websiteAboutTitle}
              </p>
            )}

            {hasText(restaurant.websiteFeatureTitle) && (
              <h2 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.9] tracking-[-0.07em] md:text-7xl">
                {restaurant.websiteFeatureTitle}
              </h2>
            )}

            {hasText(restaurant.websiteAboutText) && (
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#6B6258]">
                {restaurant.websiteAboutText}
              </p>
            )}

            {hasText(restaurant.websiteFeatureText) && (
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#6B6258]">
                {restaurant.websiteFeatureText}
              </p>
            )}

            {restaurant.websiteSpecialties.length > 0 && <div className="mt-7 flex flex-wrap gap-2">
              {restaurant.websiteSpecialties.map((specialty) => <span key={specialty} className="rounded-full border border-[#DCCBAF] bg-[#FFF9F0] px-4 py-2 text-xs font-semibold text-[#795D38]">{specialty}</span>)}
            </div>}

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone}`}
                  className="inline-flex items-center justify-center rounded-full border border-[#E1D0B8] bg-white px-8 py-4 text-sm font-semibold text-[#16120E] hover:bg-[#FFF9F0]"
                >
                  {t("call")}
                </a>
              )}

              {restaurant.email && (
                <a
                  href={`mailto:${restaurant.email}`}
                  className="inline-flex items-center justify-center rounded-full border border-[#E1D0B8] bg-white px-8 py-4 text-sm font-semibold text-[#16120E] hover:bg-[#FFF9F0]"
                >
                  {t("contact.email")}
                </a>
              )}
            </div>
          </div>
        )}

        <div
          id="horario"
          className="rounded-[2rem] border border-[#E1D0B8] bg-white p-6 shadow-[0_22px_70px_rgba(80,55,30,0.055)]"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9B6F3B]">
              {t("hoursTitle")}
            </p>
          </div>

          <div className="mt-6 grid gap-2">
            {hours.map((item) => (
              <div
                key={item.shortDay}
                className="flex items-center justify-between gap-4 border-b border-[#E8DCCB] py-2 last:border-b-0"
              >
                <span className="text-sm font-semibold text-[#16120E]">
                  {item.shortDay}
                </span>
                <span className="max-w-[220px] truncate text-right text-sm font-semibold text-[#6B6258]">
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

export function GallerySection({
  restaurant,
}: {
  restaurant: PublicRestaurant;
}) {
  const items = getGalleryItems(restaurant);

  if (items.length === 0) return null;

  const hasHeader =
    hasText(restaurant.websiteGalleryTitle) ||
    hasText(restaurant.websiteGalleryDescription);

  return (
    <section className="bg-[#F5EFE6] px-6 py-24 text-[#16120E]">
      <div className="mx-auto max-w-7xl">
        {hasHeader && (
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            {hasText(restaurant.websiteGalleryTitle) && (
              <h2 className="max-w-4xl text-5xl font-semibold leading-[0.9] tracking-[-0.07em] md:text-7xl">
                {restaurant.websiteGalleryTitle}
              </h2>
            )}

            {hasText(restaurant.websiteGalleryDescription) && (
              <p className="max-w-md text-sm leading-7 text-[#6B6258]">
                {restaurant.websiteGalleryDescription}
              </p>
            )}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-4">
          {items.map((item, index) => (
            <GalleryTile
              key={`${item.image}-${index}`}
              large={index === 0}
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
}: {
  restaurant: PublicRestaurant;
  primaryColor: string;
}) {
  const mapsUrl = getMapsUrl(restaurant);
  if (!mapsUrl || !restaurant.address) return null;

  const hasTitle = hasText(restaurant.websiteLocationTitle);
  const hasDescription = hasText(restaurant.websiteLocationDescription);

  return (
    <section id="localizacao" className="bg-[#FFF9F0] px-6 py-24 text-[#16120E]">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          {hasTitle && (
            <h2 className="text-5xl font-semibold leading-[0.9] tracking-[-0.07em] md:text-7xl">
              {restaurant.websiteLocationTitle}
            </h2>
          )}

          {hasDescription && (
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#6B6258]">
              {restaurant.websiteLocationDescription}
            </p>
          )}
          <div className={hasTitle || hasDescription ? "mt-9" : ""}>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full border border-[#E1D0B8] bg-white px-8 py-4 text-sm font-semibold text-[#16120E] hover:bg-[#F5EFE6]"
            >
              Google Maps
            </a>
          </div>

          <div className="mt-10 grid gap-4 text-sm text-[#6B6258]">
            <p className="font-semibold text-[#16120E]">{restaurant.address}</p>

            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} className="font-semibold text-[#16120E] hover:opacity-70">
                {restaurant.phone}
              </a>
            )}

            {restaurant.email && (
              <a href={`mailto:${restaurant.email}`} className="break-words font-semibold text-[#16120E] hover:opacity-70">
                {restaurant.email}
              </a>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.5rem] border border-[#E1D0B8] shadow-[0_22px_70px_rgba(80,55,30,0.055)]">
          <iframe
            src={`https://www.google.com/maps?q=${encodeURIComponent(
              restaurant.address || ""
            )}&output=embed`}
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

export function FaqSection({ restaurant }: { restaurant: PublicRestaurant }) {
  const items = getFaqItems(restaurant);
  if (items.length === 0) return null;

  return <section className="bg-[#17120D] px-6 py-24 text-white">
    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#D7B267]">Informação útil</p>
        <h2 className="mt-5 text-5xl font-semibold leading-[0.9] tracking-[-0.07em] md:text-7xl">{restaurant.websiteFaqTitle || "Perguntas frequentes"}</h2>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => <details key={`${item.question}-${index}`} className="group rounded-[24px] border border-white/10 bg-white/[0.04] p-5 open:bg-white/[0.07]">
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
  t,
}: {
  restaurant: PublicRestaurant;
  primaryColor: string;
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
    <section className="bg-[#F5EFE6] px-6 py-24 text-[#16120E]">
      <div className="mx-auto max-w-7xl rounded-[2.5rem] border border-[#E1D0B8] bg-white p-10 text-center shadow-[0_22px_70px_rgba(80,55,30,0.055)] md:p-16">
        {hasText(restaurant.websiteFinalCtaTitle) && (
          <h2 className="mx-auto max-w-4xl text-6xl font-semibold leading-[0.85] tracking-[-0.08em] md:text-8xl">
            {restaurant.websiteFinalCtaTitle}
          </h2>
        )}

        {hasText(restaurant.websiteFinalCtaText) && (
          <p className="mx-auto mt-7 max-w-xl text-lg leading-8 text-[#6B6258]">
            {restaurant.websiteFinalCtaText}
          </p>
        )}

        <a
          href={reserveUrl}
          className="mt-10 inline-flex rounded-full px-10 py-5 text-sm font-semibold text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {t("reserveButton")}
        </a>
      </div>
    </section>
  );
}

export function PublicFooter({ t }: { t: Translator }) {
  return (
    <footer className="bg-[#F5EFE6] px-6 pb-24 text-[#16120E] md:pb-10">
      <div className="mx-auto flex max-w-7xl justify-center border-t border-[#E1D0B8] pt-8">
        <p className="text-xs font-semibold text-[#6B6258]">
          {t("footerTagline")}
        </p>
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
