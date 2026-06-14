import type { WebsiteTemplate } from "./templates";
import {
  getDisplayCuisine,
  getDisplayDescription,
  getDisplayTitle,
  getReserveUrl,
  hasValidHeroImage,
  hasValidLogo,
  normalizeInstagramUrl,
  type OpeningHour,
  type PublicRestaurant,
} from "./utils";

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
  light = true,
}: {
  restaurant: PublicRestaurant;
  light?: boolean;
}) {
  const hasLogo = hasValidLogo(restaurant);

  return (
    <a href={`https://${restaurant.slug}.mesalink.pt`} className="flex items-center gap-3">
      {hasLogo ? (
        <img
          src={restaurant.websiteLogoImage!}
          alt={restaurant.name}
          className="h-20 max-w-[260px] object-contain"
        />
      ) : (
        <span
          className={
            light
              ? "text-lg font-black text-white"
              : "text-lg font-black text-zinc-950"
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
  light = true,
  primaryColor,
}: {
  restaurant: PublicRestaurant;
  reserveUrl: string;
  light?: boolean;
  primaryColor: string;
}) {
  const instagramUrl = normalizeInstagramUrl(restaurant.websiteInstagram);

  return (
    <header className="flex items-center justify-between gap-4">
      <Brand restaurant={restaurant} light={light} />

      <nav
        className={
          light
            ? "hidden items-center gap-7 text-sm font-bold text-white/75 md:flex"
            : "hidden items-center gap-7 text-sm font-bold text-zinc-500 md:flex"
        }
      >
        <a href="#sobre" className={light ? "hover:text-white" : "hover:text-zinc-950"}>
          Sobre
        </a>
        <a href="#menu" className={light ? "hover:text-white" : "hover:text-zinc-950"}>
          Menu
        </a>
        <a href="#horario" className={light ? "hover:text-white" : "hover:text-zinc-950"}>
          Horário
        </a>
        <a href="#localizacao" className={light ? "hover:text-white" : "hover:text-zinc-950"}>
          Localização
        </a>
      </nav>

      <div className="flex items-center gap-2">
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className={
              light
                ? "hidden rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-black text-white hover:bg-white/15 sm:inline-flex"
                : "hidden rounded-full border border-zinc-200 px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50 sm:inline-flex"
            }
          >
            Instagram
          </a>
        )}

        <a
          href={reserveUrl}
          className={
            light
              ? "rounded-full bg-white px-5 py-2.5 text-sm font-black text-black"
              : "rounded-full px-5 py-2.5 text-sm font-black text-white"
          }
          style={!light ? { backgroundColor: primaryColor } : undefined}
        >
          Reservar
        </a>
      </div>
    </header>
  );
}

function ContactBar({ restaurant }: { restaurant: PublicRestaurant }) {
  const hasContacts = restaurant.address || restaurant.phone || restaurant.email;

  if (!hasContacts) return null;

  return (
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
          <a href={`tel:${restaurant.phone}`} className="mt-2 block font-semibold hover:text-white">
            {restaurant.phone}
          </a>
        </div>
      )}

      {restaurant.email && (
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
            Email
          </p>
          <a href={`mailto:${restaurant.email}`} className="mt-2 block break-words font-semibold hover:text-white">
            {restaurant.email}
          </a>
        </div>
      )}
    </div>
  );
}

function HeroButtons({
  restaurant,
  reserveUrl,
  primaryColor,
  light = true,
}: {
  restaurant: PublicRestaurant;
  reserveUrl: string;
  primaryColor: string;
  light?: boolean;
}) {
  const instagramUrl = normalizeInstagramUrl(restaurant.websiteInstagram);

  return (
    <div className="mt-10 flex flex-col gap-3 sm:flex-row">
      <a
        href={reserveUrl}
        className="inline-flex items-center justify-center rounded-full px-8 py-4 text-sm font-black text-white shadow-2xl"
        style={{ backgroundColor: primaryColor }}
      >
        Reservar
      </a>

      {restaurant.websiteMenuPdf && (
        <a
          href={restaurant.websiteMenuPdf}
          target="_blank"
          rel="noreferrer"
          className={
            light
              ? "inline-flex items-center justify-center rounded-full border border-white/30 bg-white/15 px-8 py-4 text-sm font-black text-white backdrop-blur-xl hover:bg-white/25"
              : "inline-flex items-center justify-center rounded-full border border-zinc-200 px-8 py-4 text-sm font-black text-zinc-900 hover:bg-zinc-50"
          }
        >
          Ver menu
        </a>
      )}

      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noreferrer"
          className={
            light
              ? "inline-flex items-center justify-center rounded-full border border-white/30 bg-white/15 px-8 py-4 text-sm font-black text-white backdrop-blur-xl hover:bg-white/25"
              : "inline-flex items-center justify-center rounded-full border border-zinc-200 px-8 py-4 text-sm font-black text-zinc-900 hover:bg-zinc-50"
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
}: {
  restaurant: PublicRestaurant;
  hours: OpeningHour[];
  primaryColor: string;
  theme: Theme;
  template: WebsiteTemplate;
}) {
  const reserveUrl = getReserveUrl(restaurant);
  const hasImage = hasValidHeroImage(restaurant);

  if (template === "MINIMAL") {
    return (
      <section className="bg-white px-6 py-8 text-zinc-950">
        <div className="mx-auto max-w-7xl">
          <header className="border-b border-zinc-200 pb-5">
            <Header restaurant={restaurant} reserveUrl={reserveUrl} light={false} primaryColor={primaryColor} />
          </header>

          <div className="grid min-h-[75vh] gap-10 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              {getDisplayCuisine(restaurant) && (
                <p className="mb-5 text-xs font-black uppercase tracking-[0.35em] text-zinc-400">
                  {getDisplayCuisine(restaurant)}
                </p>
              )}

              <h1 className="max-w-4xl text-5xl font-black leading-[0.9] tracking-[-0.07em] md:text-7xl">
                {getDisplayTitle(restaurant)}
              </h1>

              {getDisplayDescription(restaurant) && (
                <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-500">
                  {getDisplayDescription(restaurant)}
                </p>
              )}

              <HeroButtons
                restaurant={restaurant}
                reserveUrl={reserveUrl}
                primaryColor={primaryColor}
                light={false}
              />
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

  if (template === "LUXURY") {
    return (
      <section className="relative min-h-screen overflow-hidden bg-black text-[#f5ead7]">
        {hasImage ? (
          <img
            src={restaurant.websiteHeroImage!}
            alt={restaurant.name}
            className="absolute inset-0 h-full w-full scale-105 object-cover opacity-35 blur-[1px]"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.18),transparent_38%),linear-gradient(to_bottom,#0a0a0a,#000)]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/65 to-black" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
          <Header restaurant={restaurant} reserveUrl={reserveUrl} light primaryColor="#d4af37" />

          <div className="flex flex-1 items-center justify-center text-center">
            <div className="max-w-3xl py-20">
              {getDisplayCuisine(restaurant) && (
                <p className="mb-7 text-xs font-black uppercase tracking-[0.55em] text-[#d4af37]/70">
                  {getDisplayCuisine(restaurant)}
                </p>
              )}

              <h1 className="text-6xl font-black leading-[0.86] tracking-[-0.075em] sm:text-7xl md:text-8xl lg:text-9xl">
                {getDisplayTitle(restaurant)}
              </h1>

              {getDisplayDescription(restaurant) && (
                <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-[#f5ead7]/72">
                  {getDisplayDescription(restaurant)}
                </p>
              )}

              <div className="flex justify-center">
                <HeroButtons
                  restaurant={restaurant}
                  reserveUrl={reserveUrl}
                  primaryColor="#d4af37"
                />
              </div>
            </div>
          </div>

          <ContactBar restaurant={restaurant} />
        </div>
      </section>
    );
  }

  if (template === "SOCIAL") {
    return (
      <section className="relative min-h-screen overflow-hidden bg-[#0f0715] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(236,72,153,0.42),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(168,85,247,0.28),transparent_32%),linear-gradient(to_bottom,#16091f,#0f0715)]" />

        <div className="relative mx-auto grid min-h-screen max-w-7xl gap-8 px-6 py-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div className="relative z-10 flex min-h-[70vh] flex-col justify-between">
            <Header restaurant={restaurant} reserveUrl={reserveUrl} light primaryColor="#ec4899" />

            <div className="py-12">
              {getDisplayCuisine(restaurant) && (
                <p className="mb-6 text-xs font-black uppercase tracking-[0.45em] text-pink-200/80">
                  {getDisplayCuisine(restaurant)}
                </p>
              )}

              <h1 className="max-w-4xl text-6xl font-black leading-[0.82] tracking-[-0.08em] sm:text-7xl md:text-8xl">
                {getDisplayTitle(restaurant)}
              </h1>

              {getDisplayDescription(restaurant) && (
                <p className="mt-8 max-w-xl text-lg leading-8 text-white/75 md:text-xl md:leading-9">
                  {getDisplayDescription(restaurant)}
                </p>
              )}

              <HeroButtons
                restaurant={restaurant}
                reserveUrl={reserveUrl}
                primaryColor="#ec4899"
              />
            </div>
          </div>

          <div className="relative min-h-[78vh] overflow-hidden rounded-[3rem] border border-white/10 bg-white/10 shadow-2xl">
            {hasImage ? (
              <img
                src={restaurant.websiteHeroImage!}
                alt={restaurant.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.38),transparent_45%),linear-gradient(to_bottom,#271033,#0f0715)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0715]/75 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 rounded-[2rem] border border-white/15 bg-black/30 p-5 backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-white/45">
                Online
              </p>
              <p className="mt-2 text-2xl font-black">Reserva em segundos</p>
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
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-35 blur-[1px]"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(180,83,9,0.35),transparent_35%),linear-gradient(to_bottom,#2a1208,#120b07)]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/25" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/90" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
        <Header restaurant={restaurant} reserveUrl={reserveUrl} light primaryColor={primaryColor} />

        <div className="grid flex-1 gap-10 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="max-w-4xl rounded-[2rem] bg-black/35 p-6 py-10 backdrop-blur-sm md:p-10">
            {getDisplayCuisine(restaurant) && (
              <p className="mb-6 text-xs font-black uppercase tracking-[0.45em] text-amber-200/80">
                {getDisplayCuisine(restaurant)}
              </p>
            )}

            <h1 className="max-w-5xl text-6xl font-black leading-[0.82] tracking-[-0.08em] sm:text-7xl md:text-8xl lg:text-9xl">
              {getDisplayTitle(restaurant)}
            </h1>

            {getDisplayDescription(restaurant) && (
              <p className="mt-8 max-w-2xl text-lg leading-8 text-white/85 md:text-xl md:leading-9">
                {getDisplayDescription(restaurant)}
              </p>
            )}

            <HeroButtons
              restaurant={restaurant}
              reserveUrl={reserveUrl}
              primaryColor={primaryColor}
            />
          </div>

          <div className="hidden min-h-[560px] overflow-hidden rounded-[3rem] border border-white/10 bg-white/10 shadow-2xl lg:block">
            {hasImage ? (
              <img
                src={restaurant.websiteHeroImage!}
                alt={restaurant.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.25),transparent_45%),linear-gradient(to_bottom,#2a1208,#120b07)]" />
            )}
          </div>
        </div>

        <ContactBar restaurant={restaurant} />
      </div>
    </section>
  );
}
