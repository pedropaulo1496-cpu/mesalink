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

export function WebsiteHero({
  restaurant,
  hours,
  primaryColor,
}: {
  restaurant: PublicRestaurant;
  hours: OpeningHour[];
  primaryColor: string;
}) {
  const reserveUrl = getReserveUrl(restaurant);
  const instagramUrl = normalizeInstagramUrl(restaurant.websiteInstagram);
  const hasImage = hasValidHeroImage(restaurant);

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
            <a href="#sobre" className="hover:text-white">
              Sobre
            </a>
            <a href="#experiencia" className="hover:text-white">
              Experiência
            </a>
            <a href="#horario" className="hover:text-white">
              Horário
            </a>
            <a href="#localizacao" className="hover:text-white">
              Localização
            </a>
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