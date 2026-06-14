import {
  FeatureCard,
  GalleryTile,
  GlassCard,
  PremiumCard,
  SectionTitle,
} from "./WebsiteCards";
import {
  formatOpeningHour,
  getDisplayCuisine,
  getMapsUrl,
  getReserveUrl,
  hasValidHeroImage,
  normalizeInstagramUrl,
  type OpeningHour,
  type PublicRestaurant,
} from "./utils";

export function QuickInfoSection({
  restaurant,
}: {
  restaurant: PublicRestaurant;
}) {
  return (
    <section className="mx-auto -mt-16 grid max-w-7xl gap-4 px-6 pb-14 md:grid-cols-3">
      {restaurant.address && (
        <GlassCard
          eyebrow="Onde estamos"
          title="Morada"
          value={restaurant.address}
        />
      )}

      {restaurant.phone && (
        <GlassCard
          eyebrow="Contacto direto"
          title="Telefone"
          value={restaurant.phone}
        />
      )}

      {restaurant.email && (
        <GlassCard
          eyebrow="Fala connosco"
          title="Email"
          value={restaurant.email}
        />
      )}
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

  return (
    <section className="mx-auto max-w-7xl px-6 pb-14">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <PremiumCard className="p-7 md:p-10">
          <SectionTitle
            eyebrow="Reservas online"
            title="Reserva a tua mesa sem chamadas, sem esperas, sem complicações."
            text="Escolhe o dia, a hora e o número de pessoas. A tua reserva entra diretamente no sistema do restaurante, com confirmação simples e rápida."
          />

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={reserveUrl}
              className="inline-flex items-center justify-center rounded-full px-8 py-4 text-sm font-black text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Fazer reserva
            </a>

            {restaurant.phone && (
              <a
                href={`tel:${restaurant.phone}`}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-8 py-4 text-sm font-black text-white hover:bg-white/15"
              >
                Ligar ao restaurante
              </a>
            )}
          </div>
        </PremiumCard>

        <PremiumCard className="p-7 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-white/35">
                Horário
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">
                Semana
              </h3>
            </div>

            <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white/50">
              Compacto
            </div>
          </div>

          <div className="mt-6 grid gap-2">
            {hours.map((item) => (
              <div
                key={item.shortDay}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm"
              >
                <span className="w-10 font-black text-white">
                  {item.shortDay}
                </span>
                <span className="truncate text-right font-semibold text-white/50">
                  {formatOpeningHour(item)}
                </span>
              </div>
            ))}
          </div>
        </PremiumCard>
      </div>
    </section>
  );
}

export function ExperienceSection({
  restaurant,
  primaryColor,
}: {
  restaurant: PublicRestaurant;
  primaryColor: string;
}) {
  const reserveUrl = getReserveUrl(restaurant);

  return (
    <section className="mx-auto max-w-7xl px-6 pb-14">
      <PremiumCard className="p-7 md:p-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <SectionTitle
            eyebrow="Experiência"
            title="Uma presença online pensada para transformar visitas em reservas."
          />

          <a
            href={reserveUrl}
            className="inline-flex shrink-0 items-center justify-center rounded-full px-7 py-4 text-sm font-black text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Reservar mesa
          </a>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <FeatureCard
            number="01"
            title="Reserva rápida"
            text="O cliente escolhe data, hora e pessoas sem precisar telefonar."
          />

          <FeatureCard
            number="02"
            title="Informação clara"
            text="Morada, contactos, horários e links importantes sempre visíveis."
          />

          <FeatureCard
            number="03"
            title="Design premium"
            text="Uma página elegante e moderna, criada para valorizar o restaurante."
          />
        </div>
      </PremiumCard>
    </section>
  );
}

export function GallerySection({
  restaurant,
}: {
  restaurant: PublicRestaurant;
}) {
  const image = hasValidHeroImage(restaurant)
    ? restaurant.websiteHeroImage!
    : null;

  return (
    <section className="mx-auto max-w-7xl px-6 pb-14">
      <div className="grid gap-5 lg:grid-cols-4">
        <GalleryTile
          large
          title={getDisplayCuisine(restaurant)}
          subtitle="Ambiente"
          image={image}
        />

        <GalleryTile title="Reserva" subtitle="Online" image={null} />
        <GalleryTile title="Mesa" subtitle="Preparada" image={null} />
        <GalleryTile title="Experiência" subtitle="Completa" image={null} />
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

  return (
    <section className="mx-auto max-w-7xl px-6 pb-14">
      <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
          <div className="p-7 md:p-10">
            <SectionTitle
              eyebrow="Localização"
              title="Visita-nos."
              text={restaurant.address}
            />

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-7 py-4 text-sm font-black text-white hover:bg-white/15"
              >
                Abrir no Google Maps
              </a>

              <a
                href={reserveUrl}
                className="inline-flex items-center justify-center rounded-full px-7 py-4 text-sm font-black text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Reservar antes de ir
              </a>
            </div>
          </div>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex min-h-[320px] items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16),transparent_68%)] p-8 text-center transition hover:bg-white/10"
          >
            <div>
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-white/10 text-5xl backdrop-blur-xl transition group-hover:scale-105">
                📍
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.35em] text-white/35">
                Ver mapa
              </p>
            </div>
          </a>
        </div>
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
    <section className="mx-auto max-w-7xl px-6 pb-14">
      <PremiumCard className="overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1fr_1fr]">
          <div className="p-7 md:p-10">
            <SectionTitle
              eyebrow="Instagram"
              title="Segue o restaurante e acompanha as novidades."
              text="Vê pratos, novidades, eventos e momentos do restaurante diretamente no Instagram."
            />

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-7 py-4 text-sm font-black text-white hover:bg-white/15"
              >
                Abrir Instagram
              </a>

              <a
                href={reserveUrl}
                className="inline-flex items-center justify-center rounded-full px-7 py-4 text-sm font-black text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Reservar mesa
              </a>
            </div>
          </div>

          <div className="flex min-h-[300px] items-center justify-center bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.20),transparent_65%)] p-8">
            <div className="text-center">
              <p className="text-6xl">📸</p>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.35em] text-white/35">
                Social
              </p>
            </div>
          </div>
        </div>
      </PremiumCard>
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

  return (
    <section className="mx-auto max-w-7xl px-6 pb-14">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur-xl md:p-14">
        <div
          className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: primaryColor }}
        />

        <div className="relative">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-white/35">
            Reserva
          </p>

          <h2 className="mx-auto mt-5 max-w-3xl text-5xl font-black leading-[0.9] tracking-[-0.07em] md:text-7xl">
            A tua mesa está à espera.
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/55">
            Faz a reserva agora e garante o teu lugar em{" "}
            <span className="font-bold text-white">{restaurant.name}</span>.
          </p>

          <a
            href={reserveUrl}
            className="mt-8 inline-flex items-center justify-center rounded-full px-9 py-4 text-sm font-black text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Reservar agora
          </a>
        </div>
      </div>
    </section>
  );
}

export function PublicFooter() {
  return (
    <footer className="mx-auto max-w-7xl px-6 pb-24 md:pb-8">
      <div className="flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-white/35">
            Powered by
          </p>
          <p className="mt-2 text-xl font-black">MesaLink</p>
        </div>

        <p className="max-w-md text-sm leading-6 text-white/35 md:text-right">
          Mini-sites com reservas online para restaurantes modernos.
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
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/80 p-3 backdrop-blur-xl md:hidden">
      <a
        href={getReserveUrl(restaurant)}
        className="flex h-14 items-center justify-center rounded-full text-sm font-black text-white"
        style={{ backgroundColor: primaryColor }}
      >
        Reservar mesa
      </a>
    </div>
  );
}