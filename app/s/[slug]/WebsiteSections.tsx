import { GalleryTile } from "./WebsiteCards";
import {
  formatOpeningHour,
  getGalleryItems,
  getMapsUrl,
  getReserveUrl,
  normalizeInstagramUrl,
  type OpeningHour,
  type PublicRestaurant,
} from "./utils";

function hasText(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0);
}

export function MenuSection({
  restaurant,
  primaryColor,
}: {
  restaurant: PublicRestaurant;
  primaryColor: string;
}) {
  if (!restaurant.websiteMenuPdf) return null;

  const hasTitle = hasText(restaurant.websiteMenuTitle);
  const hasDescription = hasText(restaurant.websiteMenuDescription);

  return (
    <section id="menu" className="bg-[#f4eadf] px-6 py-24 text-[#1d120b]">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2.5rem] border border-[#1d120b]/10 bg-white/65 shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.75fr]">
            <div className="p-8 md:p-12">
              {hasTitle && (
                <h2 className="max-w-4xl text-5xl font-black leading-[0.9] tracking-[-0.07em] md:text-7xl">
                  {restaurant.websiteMenuTitle}
                </h2>
              )}

              {hasDescription && (
                <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4a3325]/75">
                  {restaurant.websiteMenuDescription}
                </p>
              )}

              <div className={hasTitle || hasDescription ? "mt-9 flex flex-col gap-3 sm:flex-row" : "flex flex-col gap-3 sm:flex-row"}>
                <a
                  href={restaurant.websiteMenuPdf}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-[#1d120b] px-8 py-4 text-sm font-black text-white shadow-lg hover:opacity-90"
                >
                  Ver menu
                </a>

                <a
                  href={getReserveUrl(restaurant)}
                  className="inline-flex items-center justify-center rounded-full px-8 py-4 text-sm font-black text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Reservar
                </a>
              </div>
            </div>

            <a
              href={restaurant.websiteMenuPdf}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[320px] items-center justify-center bg-[#1d120b] p-8 text-center text-white"
            >
              <div>
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-5xl">
                  📄
                </div>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.35em] text-white/35">
                  Abrir PDF
                </p>
              </div>
            </a>
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
}: {
  restaurant: PublicRestaurant;
  hours: OpeningHour[];
  primaryColor: string;
}) {
  const reserveUrl = getReserveUrl(restaurant);
  const hasIntro =
    hasText(restaurant.websiteAboutTitle) ||
    hasText(restaurant.websiteFeatureTitle) ||
    hasText(restaurant.websiteAboutText) ||
    hasText(restaurant.websiteFeatureText);

  if (!hasIntro && hours.length === 0) return null;

  return (
    <section id="sobre" className="bg-[#120b07] px-6 py-20 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        {hasIntro && (
          <div>
            {hasText(restaurant.websiteAboutTitle) && (
              <p className="text-xs font-black uppercase tracking-[0.4em] text-amber-200/60">
                {restaurant.websiteAboutTitle}
              </p>
            )}

            {hasText(restaurant.websiteFeatureTitle) && (
              <h2 className="mt-5 max-w-4xl text-5xl font-black leading-[0.9] tracking-[-0.07em] md:text-7xl">
                {restaurant.websiteFeatureTitle}
              </h2>
            )}

            {hasText(restaurant.websiteAboutText) && (
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/65">
                {restaurant.websiteAboutText}
              </p>
            )}

            {hasText(restaurant.websiteFeatureText) && (
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/45">
                {restaurant.websiteFeatureText}
              </p>
            )}

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href={reserveUrl}
                className="inline-flex items-center justify-center rounded-full px-8 py-4 text-sm font-black text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Reservar
              </a>

              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone}`}
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-sm font-black text-white hover:bg-white/10"
                >
                  Ligar
                </a>
              )}

              {restaurant.email && (
                <a
                  href={`mailto:${restaurant.email}`}
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-sm font-black text-white hover:bg-white/10"
                >
                  Email
                </a>
              )}
            </div>
          </div>
        )}

        <div
          id="horario"
          className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-200/50">
              Horário
            </p>
          </div>

          <div className="mt-6 grid gap-2">
            {hours.map((item) => (
              <div
                key={item.shortDay}
                className="flex items-center justify-between gap-4 border-b border-white/10 py-2 last:border-b-0"
              >
                <span className="text-sm font-black text-white">
                  {item.shortDay}
                </span>
                <span className="max-w-[220px] truncate text-right text-sm font-semibold text-white/55">
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
    <section className="bg-[#120b07] px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        {hasHeader && (
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            {hasText(restaurant.websiteGalleryTitle) && (
              <h2 className="max-w-4xl text-5xl font-black leading-[0.9] tracking-[-0.07em] md:text-7xl">
                {restaurant.websiteGalleryTitle}
              </h2>
            )}

            {hasText(restaurant.websiteGalleryDescription) && (
              <p className="max-w-md text-sm leading-7 text-white/50">
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
  primaryColor,
}: {
  restaurant: PublicRestaurant;
  primaryColor: string;
}) {
  const mapsUrl = getMapsUrl(restaurant);
  const reserveUrl = getReserveUrl(restaurant);

  if (!mapsUrl || !restaurant.address) return null;

  const hasTitle = hasText(restaurant.websiteLocationTitle);
  const hasDescription = hasText(restaurant.websiteLocationDescription);

  return (
    <section id="localizacao" className="bg-[#f4eadf] px-6 py-24 text-[#1d120b]">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          {hasTitle && (
            <h2 className="text-5xl font-black leading-[0.9] tracking-[-0.07em] md:text-7xl">
              {restaurant.websiteLocationTitle}
            </h2>
          )}

          {hasDescription && (
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#4a3325]/75">
              {restaurant.websiteLocationDescription}
            </p>
          )}

          <div className={hasTitle || hasDescription ? "mt-9 flex flex-col gap-3 sm:flex-row" : "flex flex-col gap-3 sm:flex-row"}>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full border border-[#1d120b]/20 px-8 py-4 text-sm font-black text-[#1d120b] hover:bg-[#1d120b]/5"
            >
              Google Maps
            </a>

            <a
              href={reserveUrl}
              className="inline-flex rounded-full px-8 py-4 text-sm font-black text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Reservar
            </a>
          </div>

          <div className="mt-10 grid gap-4 text-sm text-[#4a3325]/75">
            <p className="font-bold text-[#1d120b]">{restaurant.address}</p>

            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} className="font-bold text-[#1d120b] hover:opacity-70">
                {restaurant.phone}
              </a>
            )}

            {restaurant.email && (
              <a href={`mailto:${restaurant.email}`} className="break-words font-bold text-[#1d120b] hover:opacity-70">
                {restaurant.email}
              </a>
            )}
          </div>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-[420px] items-center justify-center rounded-[2.5rem] bg-[#1d120b] text-center text-white shadow-2xl"
        >
          <div>
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-white/10 text-6xl">📍</div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.35em] text-white/35">Ver mapa</p>
          </div>
        </a>
      </div>
    </section>
  );
}

export function InstagramSection({
  restaurant,
  primaryColor,
}: {
  restaurant: PublicRestaurant;
  primaryColor: string;
}) {
  const instagramUrl = normalizeInstagramUrl(restaurant.websiteInstagram);
  const reserveUrl = getReserveUrl(restaurant);

  if (!instagramUrl) return null;

  return (
    <section className="bg-[#120b07] px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-8 md:p-12">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full border border-white/20 px-8 py-4 text-sm font-black text-white hover:bg-white/10"
          >
            Instagram
          </a>

          <a
            href={reserveUrl}
            className="inline-flex rounded-full px-8 py-4 text-sm font-black text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Reservar
          </a>
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
    <section className="bg-[#120b07] px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl text-center">
        {hasText(restaurant.websiteFinalCtaTitle) && (
          <h2 className="mx-auto max-w-4xl text-6xl font-black leading-[0.85] tracking-[-0.08em] md:text-8xl">
            {restaurant.websiteFinalCtaTitle}
          </h2>
        )}

        {hasText(restaurant.websiteFinalCtaText) && (
          <p className="mx-auto mt-7 max-w-xl text-lg leading-8 text-white/60">
            {restaurant.websiteFinalCtaText}
          </p>
        )}

        <a
          href={reserveUrl}
          className="mt-10 inline-flex rounded-full px-10 py-5 text-sm font-black text-white"
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
    <footer className="bg-[#120b07] px-6 pb-24 text-white md:pb-10">
      <div className="mx-auto flex max-w-7xl justify-center border-t border-white/10 pt-8">
        <p className="text-xs font-bold text-white/35">
          Reservas online by <span className="text-white/55">MesaLink</span>
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
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#120b07]/90 p-3 backdrop-blur-xl md:hidden">
      <a
        href={getReserveUrl(restaurant)}
        className="flex h-14 items-center justify-center rounded-full text-sm font-black text-white"
        style={{ backgroundColor: primaryColor }}
      >
        Reservar
      </a>
    </div>
  );
}
