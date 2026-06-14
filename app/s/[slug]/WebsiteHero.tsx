import {
  getDisplayCuisine,
  getDisplayDescription,
  getDisplayTitle,
  getReserveUrl,
  hasValidHeroImage,
  normalizeInstagramUrl,
  type OpeningHour,
  type PublicRestaurant,
} from "./utils";
import type { WebsiteTemplate } from "./templates";

type Theme = {
  page: string;
  sectionDark: string;
  sectionLight: string;
  card: string;
  accent: string;
  eyebrow: string;
  muted: string;
};

export function WebsiteHero({
  restaurant,
  primaryColor,
  theme,
  template,
}: {
  restaurant: PublicRestaurant;
  hours: OpeningHour[];
  primaryColor: string;
  theme: Theme;
  template: WebsiteTemplate;
}) {
  const reserveUrl = getReserveUrl(restaurant);
  const instagramUrl = normalizeInstagramUrl(restaurant.websiteInstagram);
  const hasImage = hasValidHeroImage(restaurant);

  if (template === "MINIMAL") {
    return (
      <section className="bg-white px-6 py-8 text-zinc-950">
        <div className="mx-auto max-w-7xl">
          <header className="flex items-center justify-between border-b border-zinc-200 pb-5">
            <a href={`/s/${restaurant.slug}`} className="text-lg font-black">
              {restaurant.name}
            </a>

            <nav className="hidden items-center gap-7 text-sm font-bold text-zinc-500 md:flex">
              <a href="#sobre" className="hover:text-zinc-950">Sobre</a>
              <a href="#experiencia" className="hover:text-zinc-950">Experiência</a>
              <a href="#horario" className="hover:text-zinc-950">Horário</a>
              <a href="#localizacao" className="hover:text-zinc-950">Localização</a>
            </nav>

            <a
              href={reserveUrl}
              className="rounded-full px-5 py-2.5 text-sm font-black text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Reservar
            </a>
          </header>

          <div className="grid min-h-[75vh] gap-10 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="mb-5 text-xs font-black uppercase tracking-[0.35em] text-zinc-400">
                {getDisplayCuisine(restaurant)}
              </p>

              <h1 className="max-w-4xl text-6xl font-black leading-[0.85] tracking-[-0.08em] md:text-8xl">
                {getDisplayTitle(restaurant)}
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-500">
                {getDisplayDescription(restaurant)}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={reserveUrl}
                  className="inline-flex items-center justify-center rounded-full px-8 py-4 text-sm font-black text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Reservar mesa
                </a>

                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-8 py-4 text-sm font-black text-zinc-900 hover:bg-zinc-50"
                  >
                    Instagram
                  </a>
                )}
              </div>
            </div>

            <div className="relative min-h-[520px] overflow-hidden rounded-[2.5rem] bg-zinc-100">
              {hasImage ? (
                <img
                  src={restaurant.websiteHeroImage!}
                  alt={restaurant.name}
                  className="absolute inset-0 h-full w-full object-cover"
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
      <section className="relative min-h-screen overflow-hidden bg-[#0f0715] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(236,72,153,0.38),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.28),transparent_35%),linear-gradient(to_bottom,#16091f,#0f0715)]" />

        {hasImage && (
          <img
            src={restaurant.websiteHeroImage!}
            alt={restaurant.name}
            className="absolute right-0 top-0 h-full w-full object-cover opacity-35 lg:w-[58%]"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-[#0f0715]" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
          <header className="flex items-center justify-between">
            <a href={`/s/${restaurant.slug}`} className="text-lg font-black">
              {restaurant.name}
            </a>

            <div className="flex items-center gap-3">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-black text-white md:inline-flex"
                >
                  Instagram
                </a>
              )}

              <a
                href={reserveUrl}
                className="rounded-full px-5 py-2.5 text-sm font-black text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Reservar
              </a>
            </div>
          </header>

          <div className="flex flex-1 items-center">
            <div className="max-w-5xl py-20">
              <p className="mb-6 text-xs font-black uppercase tracking-[0.45em] text-pink-200/80">
                {getDisplayCuisine(restaurant)}
              </p>

              <h1 className="max-w-5xl text-6xl font-black leading-[0.82] tracking-[-0.08em] sm:text-7xl md:text-8xl lg:text-9xl">
                {getDisplayTitle(restaurant)}
              </h1>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-white/75 md:text-xl md:leading-9">
                {getDisplayDescription(restaurant)}
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <a
                  href={reserveUrl}
                  className="inline-flex items-center justify-center rounded-full px-8 py-4 text-sm font-black text-white shadow-2xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  Reservar mesa
                </a>

                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 py-4 text-sm font-black text-white backdrop-blur-xl hover:bg-white/15"
                  >
                    Ver Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (template === "LUXURY") {
    return (
      <section className="relative min-h-screen overflow-hidden bg-black text-[#f5ead7]">
        {hasImage ? (
          <img
            src={restaurant.websiteHeroImage!}
            alt={restaurant.name}
            className="absolute inset-0 h-full w-full object-cover opacity-45"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.16),transparent_35%),linear-gradient(to_bottom,#090909,#000)]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
          <header className="flex items-center justify-between border-b border-[#d4af37]/20 pb-5">
            <a href={`/s/${restaurant.slug}`} className="text-lg font-black tracking-[0.2em]">
              {restaurant.name}
            </a>

            <a
              href={reserveUrl}
              className="rounded-full border border-[#d4af37]/40 px-5 py-2.5 text-sm font-black text-[#d4af37]"
            >
              Reservar
            </a>
          </header>

          <div className="flex flex-1 items-center justify-center text-center">
            <div className="max-w-5xl py-20">
              <p className="mb-7 text-xs font-black uppercase tracking-[0.55em] text-[#d4af37]/70">
                {getDisplayCuisine(restaurant)}
              </p>

              <h1 className="text-6xl font-black leading-[0.86] tracking-[-0.075em] sm:text-7xl md:text-8xl lg:text-9xl">
                {getDisplayTitle(restaurant)}
              </h1>

              <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-[#f5ead7]/70">
                {getDisplayDescription(restaurant)}
              </p>

              <div className="mt-10 flex justify-center">
                <a
                  href={reserveUrl}
                  className="inline-flex items-center justify-center rounded-full bg-[#d4af37] px-9 py-4 text-sm font-black text-black shadow-2xl"
                >
                  Reservar mesa
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#120b07] text-white">
      {hasImage ? (
        <img
          src={restaurant.websiteHeroImage!}
          alt={restaurant.name}
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(180,83,9,0.35),transparent_35%),linear-gradient(to_bottom,#2a1208,#120b07)]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/45 to-[#120b07]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,0.8))]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
        <header className="flex items-center justify-between">
          <a href={`/s/${restaurant.slug}`} className="text-lg font-black">
            {restaurant.name}
          </a>

          <nav className="hidden items-center gap-7 text-sm font-bold text-white/75 md:flex">
            <a href="#sobre" className="hover:text-white">Sobre</a>
            <a href="#experiencia" className="hover:text-white">Experiência</a>
            <a href="#horario" className="hover:text-white">Horário</a>
            <a href="#localizacao" className="hover:text-white">Localização</a>
          </nav>

          <a
            href={reserveUrl}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-black"
          >
            Reservar
          </a>
        </header>

        <div className="flex flex-1 items-center">
          <div className="max-w-5xl py-20">
            <p className="mb-6 text-xs font-black uppercase tracking-[0.45em] text-amber-200/80">
              {getDisplayCuisine(restaurant)}
            </p>

            <h1 className="max-w-5xl text-6xl font-black leading-[0.82] tracking-[-0.08em] sm:text-7xl md:text-8xl lg:text-9xl">
              {getDisplayTitle(restaurant)}
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-white/80 md:text-xl md:leading-9">
              {getDisplayDescription(restaurant)}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href={reserveUrl}
                className="inline-flex items-center justify-center rounded-full px-8 py-4 text-sm font-black text-white shadow-2xl"
                style={{ backgroundColor: primaryColor }}
              >
                Reservar mesa
              </a>

              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-8 py-4 text-sm font-black text-white backdrop-blur-xl hover:bg-white/15"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-white/15 pt-5 text-sm text-white/70 md:grid-cols-3">
          {restaurant.address && (
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
                Morada
              </p>
              <p className="mt-2 font-semibold">{restaurant.address}</p>
            </div>
          )}

          {restaurant.phone && (
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
                Telefone
              </p>
              <p className="mt-2 font-semibold">{restaurant.phone}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
              Reservas
            </p>
            <p className="mt-2 font-semibold">Online em poucos segundos</p>
          </div>
        </div>
      </div>
    </section>
  );
}