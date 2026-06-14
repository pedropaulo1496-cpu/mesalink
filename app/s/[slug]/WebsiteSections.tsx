import {
  GalleryTile,
  PremiumCard,
  SectionTitle,
} from "./WebsiteCards";
import {
  formatOpeningHour,
  getDisplayCuisine,
  getGalleryImages,
  getMapsUrl,
  getMenuItems,
  getReserveUrl,
  hasValidHeroImage,
  normalizeInstagramUrl,
  type OpeningHour,
  type PublicRestaurant,
} from "./utils";

export function MenuSection({
  restaurant,
  primaryColor,
}: {
  restaurant: PublicRestaurant;
  primaryColor: string;
}) {
  const menuItems = getMenuItems(restaurant);
  const reserveUrl = getReserveUrl(restaurant);

  if (menuItems.length === 0) return null;

  return (
    <section id="menu" className="bg-[#f4eadf] px-6 py-24 text-[#1d120b]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-[#8a5a32]/70">
              Menu
            </p>

            <h2 className="mt-5 max-w-4xl text-5xl font-black leading-[0.9] tracking-[-0.07em] md:text-7xl">
              {restaurant.websiteMenuTitle || "Pratos em destaque"}
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4a3325]/75">
              {restaurant.websiteMenuDescription ||
                "Uma seleção pensada para abrir o apetite antes da reserva."}
            </p>
          </div>

          <a
            href={reserveUrl}
            className="inline-flex shrink-0 rounded-full px-8 py-4 text-sm font-black text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Reservar mesa
          </a>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {menuItems.map((item, index) => (
            <article
              key={index}
              className="overflow-hidden rounded-[2rem] border border-[#1d120b]/10 bg-white/55 shadow-sm"
            >
              {item.image && item.image.startsWith("http") && (
                <div className="relative h-56 overflow-hidden bg-[#1d120b]">
                  <img
                    src={item.image}
                    alt={item.name || "Prato"}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between gap-5">
                  <h3 className="text-2xl font-black tracking-[-0.04em]">
                    {item.name || `Prato ${index + 1}`}
                  </h3>

                  {item.price && (
                    <p className="shrink-0 rounded-full bg-[#1d120b] px-4 py-2 text-sm font-black text-white">
                      {item.price}
                    </p>
                  )}
                </div>

                {item.description && (
                  <p className="mt-4 text-sm leading-7 text-[#4a3325]/75">
                    {item.description}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function QuickInfoSection({
  restaurant,
}: {
  restaurant: PublicRestaurant;
}) {
  return null;
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
    <section id="sobre" className="bg-[#120b07] px-6 py-20 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.4em] text-amber-200/60">
            A casa
          </p>

          <h2 className="mt-5 max-w-4xl text-5xl font-black leading-[0.9] tracking-[-0.07em] md:text-7xl">
            Um espaço pensado para comer bem, ficar mais um pouco e voltar.
          </h2>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/65">
            {restaurant.websiteDescription ||
              "Uma experiência simples, quente e memorável. Boa comida, bom ambiente e reservas online sem complicações."}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href={reserveUrl}
              className="inline-flex items-center justify-center rounded-full px-8 py-4 text-sm font-black text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Reservar mesa
            </a>

            {restaurant.phone && (
              <a
                href={`tel:${restaurant.phone}`}
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-sm font-black text-white hover:bg-white/10"
              >
                Ligar
              </a>
            )}
          </div>
        </div>

        <div
          id="horario"
          className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-200/50">
              Horário
            </p>

            <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-white/45">
              Semana
            </span>
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

export function ExperienceSection({
  restaurant,
  primaryColor,
}: {
  restaurant: PublicRestaurant;
  primaryColor: string;
}) {
  const reserveUrl = getReserveUrl(restaurant);

  return (
    <section
      id="experiencia"
      className="bg-[#f4eadf] px-6 py-24 text-[#1d120b]"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-[#8a5a32]/70">
              Experiência
            </p>

            <h2 className="mt-5 text-5xl font-black leading-[0.9] tracking-[-0.07em] md:text-7xl">
              Mais do que uma reserva. Uma primeira impressão.
            </h2>
          </div>

          <p className="max-w-2xl text-lg leading-8 text-[#4a3325]/75">
            O mini-site deve sentir-se como uma extensão do restaurante:
            acolhedor, bonito, direto e feito para transformar curiosidade em
            mesas ocupadas.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          <RestaurantMoment
            number="01"
            title="Chegar"
            text="Morada, contacto e reserva visíveis logo no início."
          />

          <RestaurantMoment
            number="02"
            title="Escolher"
            text="O cliente entende o conceito, o ambiente e a experiência."
          />

          <RestaurantMoment
            number="03"
            title="Reservar"
            text="O botão de reserva acompanha a página inteira, sem fricção."
          />
        </div>

        <div className="mt-12">
          <a
            href={reserveUrl}
            className="inline-flex rounded-full px-8 py-4 text-sm font-black text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Reservar agora
          </a>
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
  const image = hasValidHeroImage(restaurant)
    ? restaurant.websiteHeroImage!
    : null;

  return (
    <section className="bg-[#120b07] px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-amber-200/55">
              Galeria
            </p>

            <h2 className="mt-5 max-w-4xl text-5xl font-black leading-[0.9] tracking-[-0.07em] md:text-7xl">
              O ambiente antes da primeira visita.
            </h2>
          </div>

          <p className="max-w-md text-sm leading-7 text-white/50">
            Fotos, pratos e atmosfera fazem o cliente decidir antes sequer de
            abrir a página de reserva.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-4">
          <GalleryTile
            large
            title={getDisplayCuisine(restaurant)}
            subtitle="Ambiente"
            image={image}
          />
          <GalleryTile title="Comida" subtitle="Mesa" image={null} />
          <GalleryTile title="Momentos" subtitle="Sala" image={null} />
          <GalleryTile title="Reservas" subtitle="Online" image={null} />
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

  return (
    <section id="localizacao" className="bg-[#f4eadf] px-6 py-24 text-[#1d120b]">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.4em] text-[#8a5a32]/70">
            Localização
          </p>

          <h2 className="mt-5 text-5xl font-black leading-[0.9] tracking-[-0.07em] md:text-7xl">
            Estamos à tua espera.
          </h2>

          <p className="mt-7 max-w-xl text-lg leading-8 text-[#4a3325]/75">
            {restaurant.address}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full border border-[#1d120b]/20 px-8 py-4 text-sm font-black text-[#1d120b] hover:bg-[#1d120b]/5"
            >
              Abrir no Google Maps
            </a>

            <a
              href={reserveUrl}
              className="inline-flex rounded-full px-8 py-4 text-sm font-black text-white"
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
          className="flex min-h-[420px] items-center justify-center rounded-[2.5rem] bg-[#1d120b] text-center text-white shadow-2xl"
        >
          <div>
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-white/10 text-6xl">
              📍
            </div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.35em] text-white/35">
              Ver mapa
            </p>
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
        <div className="grid gap-10 lg:grid-cols-[1fr_0.7fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-amber-200/55">
              Instagram
            </p>

            <h2 className="mt-5 max-w-3xl text-5xl font-black leading-[0.9] tracking-[-0.07em] md:text-7xl">
              Acompanha o restaurante fora da mesa.
            </h2>

            <p className="mt-7 max-w-xl text-lg leading-8 text-white/60">
              Novidades, pratos, eventos e momentos do dia a dia.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full border border-white/20 px-8 py-4 text-sm font-black text-white hover:bg-white/10"
              >
                Abrir Instagram
              </a>

              <a
                href={reserveUrl}
                className="inline-flex rounded-full px-8 py-4 text-sm font-black text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Reservar mesa
              </a>
            </div>
          </div>

          <div className="flex min-h-[280px] items-center justify-center rounded-[2rem] bg-white/10">
            <p className="text-7xl">📸</p>
          </div>
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

  return (
    <section className="bg-[#120b07] px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl text-center">
        <p className="text-xs font-black uppercase tracking-[0.4em] text-amber-200/55">
          Reserva
        </p>

        <h2 className="mx-auto mt-5 max-w-4xl text-6xl font-black leading-[0.85] tracking-[-0.08em] md:text-8xl">
          A tua mesa está à espera.
        </h2>

        <p className="mx-auto mt-7 max-w-xl text-lg leading-8 text-white/60">
          Reserva em poucos segundos e garante o teu lugar em{" "}
          <span className="font-bold text-white">{restaurant.name}</span>.
        </p>

        <a
          href={reserveUrl}
          className="mt-10 inline-flex rounded-full px-10 py-5 text-sm font-black text-white"
          style={{ backgroundColor: primaryColor }}
        >
          Reservar agora
        </a>
      </div>
    </section>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-[#120b07] px-6 pb-24 text-white md:pb-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-white/30">
            Powered by
          </p>
          <p className="mt-2 text-xl font-black">MesaLink</p>
        </div>

        <p className="max-w-md text-sm leading-6 text-white/35 md:text-right">
          Reservas online e mini-sites para restaurantes.
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
        Reservar mesa
      </a>
    </div>
  );
}

function RestaurantMoment({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[2rem] border border-[#1d120b]/10 bg-white/40 p-6">
      <p className="text-xs font-black text-[#8a5a32]/60">{number}</p>
      <h3 className="mt-6 text-2xl font-black tracking-[-0.04em]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#4a3325]/70">{text}</p>
    </div>
  );
}