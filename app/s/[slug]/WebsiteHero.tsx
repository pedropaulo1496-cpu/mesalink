import { Badge, MiniLine } from "./WebsiteCards";
import {
  formatOpeningHour,
  getDisplayCuisine,
  getDisplayDescription,
  getDisplayTitle,
  getReserveUrl,
  getTodayOpeningHour,
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
  const today = getTodayOpeningHour(hours);
  const hasImage = hasValidHeroImage(restaurant);

  return (
    <section className="relative min-h-screen overflow-hidden">
      {hasImage ? (
        <img
          src={restaurant.websiteHeroImage!}
          alt={restaurant.name}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.22),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.14),transparent_30%),linear-gradient(to_bottom,#18181b,#060606)]" />
      )}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.2)_35%,rgba(0,0,0,0.9)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/55 to-[#060606]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black tracking-tight">
              {restaurant.name}
            </p>

            <p className="mt-1 text-xs font-bold uppercase tracking-[0.25em] text-white/40">
              {getDisplayCuisine(restaurant)}
            </p>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {restaurant.phone && (
              <a
                href={`tel:${restaurant.phone}`}
                className="rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-bold text-white/80 backdrop-blur-xl hover:bg-white/15"
              >
                Ligar
              </a>
            )}

            <a
              href={reserveUrl}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-black hover:bg-white/90"
            >
              Reservar
            </a>
          </div>
        </header>

        <div className="flex flex-1 items-center">
          <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="max-w-5xl pt-20 lg:pt-0">
              <div className="mb-6 flex flex-wrap gap-2">
                <Badge>Reservas online</Badge>
                <Badge>{getDisplayCuisine(restaurant)}</Badge>
                <Badge>Powered by MesaLink</Badge>
              </div>

              <h1 className="text-6xl font-black leading-[0.86] tracking-[-0.075em] sm:text-7xl md:text-8xl lg:text-9xl">
                {getDisplayTitle(restaurant)}
              </h1>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-white/70 md:text-xl md:leading-9">
                {getDisplayDescription(restaurant)}
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <a
                  href={reserveUrl}
                  className="inline-flex items-center justify-center rounded-full px-8 py-4 text-sm font-black text-white shadow-2xl transition hover:scale-[1.02]"
                  style={{ backgroundColor: primaryColor }}
                >
                  Reservar mesa agora
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

            <aside className="rounded-[2rem] border border-white/10 bg-black/35 p-5 shadow-2xl backdrop-blur-2xl md:p-6">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-white/35">
                Hoje
              </p>

              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-black">{today.shortDay}</p>
                  <p className="mt-1 text-sm text-white/45">
                    {formatOpeningHour(today)}
                  </p>
                </div>

                <a
                  href={reserveUrl}
                  className="rounded-full px-5 py-3 text-sm font-black text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Reservar
                </a>
              </div>

              <div className="mt-6 grid gap-2 border-t border-white/10 pt-5">
                {restaurant.address && (
                  <MiniLine label="Morada" value={restaurant.address} />
                )}

                {restaurant.phone && (
                  <MiniLine label="Telefone" value={restaurant.phone} />
                )}

                {restaurant.email && (
                  <MiniLine label="Email" value={restaurant.email} />
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}