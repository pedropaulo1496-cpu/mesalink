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
  light = false,
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
          className="h-16 max-w-[240px] object-contain"
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
}: {
  restaurant: PublicRestaurant;
  reserveUrl: string;
  light?: boolean;
  primaryColor: string;
}) {
  const instagramUrl = normalizeInstagramUrl(restaurant.websiteInstagram);

  const navClass = light
    ? "hidden items-center gap-7 text-sm font-semibold text-[#F5EFE6]/70 md:flex"
    : "hidden items-center gap-7 text-sm font-semibold text-[#6B6258] md:flex";

  const navHover = light ? "hover:text-[#F5EFE6]" : "hover:text-[#16120E]";

  return (
    <header className="flex items-center justify-between gap-4">
      <Brand restaurant={restaurant} light={light} />

      <nav className={navClass}>
        <a href="#sobre" className={navHover}>Sobre</a>
        <a href="#menu" className={navHover}>Menu</a>
        <a href="#horario" className={navHover}>Horário</a>
        <a href="#localizacao" className={navHover}>Localização</a>
      </nav>

      <div className="flex items-center gap-2">
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className={
              light
                ? "hidden rounded-full border border-[#C8A56A]/30 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-[#F5EFE6] hover:bg-white/[0.1] sm:inline-flex"
                : "hidden rounded-full border border-[#E1D0B8] bg-white px-4 py-2.5 text-sm font-semibold text-[#16120E] hover:bg-[#FFF9F0] sm:inline-flex"
            }
          >
            Instagram
          </a>
        )}

        <a
          href={reserveUrl}
          className={
            light
              ? "rounded-full bg-[#F5EFE6] px-5 py-2.5 text-sm font-semibold text-[#16120E]"
              : "rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          }
          style={!light ? { backgroundColor: primaryColor } : undefined}
        >
          Reservar
        </a>
      </div>
    </header>
  );
}

function ContactBar({ restaurant, light = false }: { restaurant: PublicRestaurant; light?: boolean }) {
  const hasContacts = restaurant.address || restaurant.phone || restaurant.email;

  if (!hasContacts) return null;

  return (
    <div
      className={
        light
          ? "grid gap-3 border-t border-[#C8A56A]/20 pt-5 text-sm text-[#F5EFE6]/70 md:grid-cols-3"
          : "grid gap-3 border-t border-[#E1D0B8] pt-5 text-sm text-[#6B6258] md:grid-cols-3"
      }
    >
      {restaurant.address && (
        <div>
          <p className={light ? "text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A56A]" : "text-xs font-semibold uppercase tracking-[0.25em] text-[#9B6F3B]"}>
            Morada
          </p>
          <p className="mt-2 font-semibold">{restaurant.address}</p>
        </div>
      )}

      {restaurant.phone && (
        <div>
          <p className={light ? "text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A56A]" : "text-xs font-semibold uppercase tracking-[0.25em] text-[#9B6F3B]"}>
            Telefone
          </p>
          <a href={`tel:${restaurant.phone}`} className="mt-2 block font-semibold hover:opacity-70">
            {restaurant.phone}
          </a>
        </div>
      )}

      {restaurant.email && (
        <div>
          <p className={light ? "text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A56A]" : "text-xs font-semibold uppercase tracking-[0.25em] text-[#9B6F3B]"}>
            Email
          </p>
          <a href={`mailto:${restaurant.email}`} className="mt-2 block break-words font-semibold hover:opacity-70">
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
  light = false,
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
        className="inline-flex items-center justify-center rounded-full px-8 py-4 text-sm font-semibold text-white shadow-[0_18px_55px_rgba(80,55,30,0.18)]"
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
              ? "inline-flex items-center justify-center rounded-full border border-[#C8A56A]/30 bg-white/[0.06] px-8 py-4 text-sm font-semibold text-[#F5EFE6] hover:bg-white/[0.1]"
              : "inline-flex items-center justify-center rounded-full border border-[#E1D0B8] bg-white px-8 py-4 text-sm font-semibold text-[#16120E] hover:bg-[#FFF9F0]"
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
}: {
  restaurant: PublicRestaurant;
  hours: OpeningHour[];
  primaryColor: string;
  theme: Theme;
  template: WebsiteTemplate;
}) {
  const reserveUrl = getReserveUrl(restaurant);
  const hasImage = hasValidHeroImage(restaurant);

  if (template === "LUXURY") {
    return (
      <section className="relative min-h-screen overflow-hidden bg-[#16120E] text-[#F5EFE6]">
        {hasImage ? (
          <img
            src={restaurant.websiteHeroImage!}
            alt={restaurant.name}
            className="absolute inset-0 h-full w-full scale-105 object-cover opacity-32"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,165,106,0.18),transparent_38%),linear-gradient(to_bottom,#241B13,#16120E)]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-[#16120E]/92 via-[#16120E]/72 to-[#16120E]" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
          <Header restaurant={restaurant} reserveUrl={reserveUrl} light primaryColor="#C8A56A" />

          <div className="flex flex-1 items-center justify-center text-center">
            <div className="max-w-3xl py-20">
              {getDisplayCuisine(restaurant) && (
                <p className="mb-7 text-xs font-semibold uppercase tracking-[0.55em] text-[#C8A56A]">
                  {getDisplayCuisine(restaurant)}
                </p>
              )}

              <h1 className="text-6xl font-semibold leading-[0.86] tracking-[-0.075em] sm:text-7xl md:text-8xl lg:text-9xl">
                {getDisplayTitle(restaurant)}
              </h1>

              {getDisplayDescription(restaurant) && (
                <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-[#F5EFE6]/72">
                  {getDisplayDescription(restaurant)}
                </p>
              )}

              <div className="flex justify-center">
                <HeroButtons restaurant={restaurant} reserveUrl={reserveUrl} primaryColor="#C8A56A" light />
              </div>
            </div>
          </div>

          <ContactBar restaurant={restaurant} light />
        </div>
      </section>
    );
  }

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
                <p className="mb-5 text-xs font-semibold uppercase tracking-[0.35em] text-zinc-400">
                  {getDisplayCuisine(restaurant)}
                </p>
              )}

              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.9] tracking-[-0.07em] md:text-7xl">
                {getDisplayTitle(restaurant)}
              </h1>

              {getDisplayDescription(restaurant) && (
                <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-500">
                  {getDisplayDescription(restaurant)}
                </p>
              )}

              <HeroButtons restaurant={restaurant} reserveUrl={reserveUrl} primaryColor={primaryColor} />
            </div>

            <div className="relative min-h-[520px] overflow-hidden rounded-[2.5rem] bg-zinc-100">
              {hasImage ? (
                <img src={restaurant.websiteHeroImage!} alt={restaurant.name} className="absolute inset-0 h-full w-full object-cover" />
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
            <Header restaurant={restaurant} reserveUrl={reserveUrl} primaryColor="#A14E36" />

            <div className="py-12">
              {getDisplayCuisine(restaurant) && (
                <p className="mb-6 text-xs font-semibold uppercase tracking-[0.45em] text-[#A14E36]">
                  {getDisplayCuisine(restaurant)}
                </p>
              )}

              <h1 className="max-w-4xl text-6xl font-semibold leading-[0.82] tracking-[-0.08em] sm:text-7xl md:text-8xl">
                {getDisplayTitle(restaurant)}
              </h1>

              {getDisplayDescription(restaurant) && (
                <p className="mt-8 max-w-xl text-lg leading-8 text-[#6B6258] md:text-xl md:leading-9">
                  {getDisplayDescription(restaurant)}
                </p>
              )}

              <HeroButtons restaurant={restaurant} reserveUrl={reserveUrl} primaryColor="#A14E36" />
            </div>
          </div>

          <div className="relative min-h-[78vh] overflow-hidden rounded-[3rem] border border-[#E1D0B8] bg-white shadow-[0_22px_70px_rgba(80,55,30,0.055)]">
            {hasImage ? (
              <img src={restaurant.websiteHeroImage!} alt={restaurant.name} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(161,78,54,0.22),transparent_45%),linear-gradient(to_bottom,#FFF9F0,#EFE5D6)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#16120E]/65 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 rounded-[2rem] border border-white/25 bg-white/85 p-5 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#A14E36]">Online</p>
              <p className="mt-2 text-2xl font-semibold text-[#16120E]">Reserva em segundos</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#F5EFE6] text-[#16120E]">
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
        <Header restaurant={restaurant} reserveUrl={reserveUrl} primaryColor={primaryColor} />

        <div className="grid flex-1 gap-10 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="max-w-4xl">
            {getDisplayCuisine(restaurant) && (
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.45em] text-[#9B6F3B]">
                {getDisplayCuisine(restaurant)}
              </p>
            )}

            <h1 className="max-w-5xl text-6xl font-semibold leading-[0.82] tracking-[-0.08em] sm:text-7xl md:text-8xl lg:text-9xl">
              {getDisplayTitle(restaurant)}
            </h1>

            {getDisplayDescription(restaurant) && (
              <p className="mt-8 max-w-2xl text-lg leading-8 text-[#6B6258] md:text-xl md:leading-9">
                {getDisplayDescription(restaurant)}
              </p>
            )}

            <HeroButtons restaurant={restaurant} reserveUrl={reserveUrl} primaryColor={primaryColor} />
          </div>

          <div className="min-h-[560px] overflow-hidden rounded-[3rem] border border-[#E1D0B8] bg-white shadow-[0_22px_70px_rgba(80,55,30,0.055)]">
            {hasImage ? (
              <img src={restaurant.websiteHeroImage!} alt={restaurant.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(200,165,106,0.24),transparent_45%),linear-gradient(to_bottom,#FFF9F0,#EFE5D6)]" />
            )}
          </div>
        </div>

        <ContactBar restaurant={restaurant} />
      </div>
    </section>
  );
}
