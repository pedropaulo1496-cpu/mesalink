import { GalleryTile } from "./WebsiteCards";
import {
  formatOpeningHour,
  getGalleryItems,
  getMapsUrl,
  getWebsiteMenus,
  getReserveUrl,
  type OpeningHour,
  type PublicRestaurant,
} from "./utils";

function hasText(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0);
}

export function MenuSection({
  restaurant,
}: {
  restaurant: PublicRestaurant;
  primaryColor: string;
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
                    {menu.title || `Menu ${index + 1}`}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex min-h-[320px] items-center justify-center bg-[#16120E] p-8 text-center text-white">
              <div>
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-4xl">
                  Menu
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.35em] text-white/50">
                  {menus.length === 1 ? "Menu disponível" : `${menus.length} menus disponíveis`}
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
}: {
  restaurant: PublicRestaurant;
  hours: OpeningHour[];
  primaryColor: string;
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

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone}`}
                  className="inline-flex items-center justify-center rounded-full border border-[#E1D0B8] bg-white px-8 py-4 text-sm font-semibold text-[#16120E] hover:bg-[#FFF9F0]"
                >
                  Ligar
                </a>
              )}

              {restaurant.email && (
                <a
                  href={`mailto:${restaurant.email}`}
                  className="inline-flex items-center justify-center rounded-full border border-[#E1D0B8] bg-white px-8 py-4 text-sm font-semibold text-[#16120E] hover:bg-[#FFF9F0]"
                >
                  Email
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
              Horário
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
                  {formatOpeningHour(item)}
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
            className="h-[420px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}

export function FinalCtaSection({
  restaurant,
  primaryColor,
}: {
  restaurant: PublicRestaurant;
  primaryColor: string;
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
          Reservar
        </a>
      </div>
    </section>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-[#F5EFE6] px-6 pb-24 text-[#16120E] md:pb-10">
      <div className="mx-auto flex max-w-7xl justify-center border-t border-[#E1D0B8] pt-8">
        <p className="text-xs font-semibold text-[#6B6258]">
          Reservas online by <span className="text-[#16120E]">MesaLink</span>
        </p>
      </div>
    </footer>
  );
}

export function MobileStickyReserve({
  restaurant,
  primaryColor,
}: {
  restaurant: PublicRestaurant;
  primaryColor: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E1D0B8] bg-[#F5EFE6]/90 p-3 backdrop-blur-xl md:hidden">
      <a
        href={getReserveUrl(restaurant)}
        className="flex h-14 items-center justify-center rounded-full text-sm font-semibold text-white"
        style={{ backgroundColor: primaryColor }}
      >
        Reservar
      </a>
    </div>
  );
}
