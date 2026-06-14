import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type HourItem = [
  string,
  boolean,
  string | null,
  string | null
];

export default async function PublicRestaurantWebsitePage({
  params,
}: PageProps) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
  });

  if (!restaurant) notFound();

  const primaryColor = restaurant.websitePrimaryColor || "#111827";

  const hasImage =
    restaurant.websiteHeroImage &&
    restaurant.websiteHeroImage.startsWith("http");

  const hours: HourItem[] = [
    ["Seg", restaurant.mondayOpen, restaurant.mondayLunch, restaurant.mondayDinner],
    ["Ter", restaurant.tuesdayOpen, restaurant.tuesdayLunch, restaurant.tuesdayDinner],
    ["Qua", restaurant.wednesdayOpen, restaurant.wednesdayLunch, restaurant.wednesdayDinner],
    ["Qui", restaurant.thursdayOpen, restaurant.thursdayLunch, restaurant.thursdayDinner],
    ["Sex", restaurant.fridayOpen, restaurant.fridayLunch, restaurant.fridayDinner],
    ["Sáb", restaurant.saturdayOpen, restaurant.saturdayLunch, restaurant.saturdayDinner],
    ["Dom", restaurant.sundayOpen, restaurant.sundayLunch, restaurant.sundayDinner],
  ];

  const today = hours.find((item) => item[1]) ?? hours[0];

  const mapsUrl = restaurant.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        restaurant.address
      )}`
    : null;

  const reserveUrl = `/reserve/${restaurant.slug}`;

  return (
    <main className="min-h-screen bg-[#060606] text-white">
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
              {restaurant.websiteCuisine && (
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.25em] text-white/40">
                  {restaurant.websiteCuisine}
                </p>
              )}
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
                  {restaurant.websiteCuisine && <Badge>{restaurant.websiteCuisine}</Badge>}
                  <Badge>Powered by MesaLink</Badge>
                </div>

                <h1 className="text-6xl font-black leading-[0.86] tracking-[-0.075em] sm:text-7xl md:text-8xl lg:text-9xl">
                  {restaurant.websiteHeadline || restaurant.name}
                </h1>

                {restaurant.websiteDescription && (
                  <p className="mt-8 max-w-2xl text-lg leading-8 text-white/70 md:text-xl md:leading-9">
                    {restaurant.websiteDescription}
                  </p>
                )}

                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={reserveUrl}
                    className="inline-flex items-center justify-center rounded-full px-8 py-4 text-sm font-black text-white shadow-2xl transition hover:scale-[1.02]"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Reservar mesa agora
                  </a>

                  {restaurant.websiteInstagram && (
                    <a
                      href={restaurant.websiteInstagram}
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
                    <p className="text-3xl font-black">{today[0]}</p>
                    <p className="mt-1 text-sm text-white/45">
                      {today[1]
                        ? [today[2], today[3]].filter(Boolean).join(" · ") ||
                          "Aberto"
                        : "Fechado"}
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

      <section className="mx-auto max-w-7xl px-6 pb-14">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl backdrop-blur-xl md:p-10">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-white/35">
              Reservas online
            </p>

            <h2 className="mt-5 max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.06em] md:text-6xl">
              Reserva a tua mesa sem chamadas, sem esperas, sem complicações.
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/55">
              Escolhe o dia, a hora e o número de pessoas. A tua reserva entra
              diretamente no sistema do restaurante, com confirmação simples e
              rápida.
            </p>

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
          </div>

          <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl backdrop-blur-xl md:p-8">
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
              {hours.map(([day, open, lunch, dinner]) => (
                <div
                  key={String(day)}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm"
                >
                  <span className="w-10 font-black text-white">{day}</span>
                  <span className="truncate text-right font-semibold text-white/50">
                    {open
                      ? [lunch, dinner].filter(Boolean).join(" · ") || "Aberto"
                      : "Fechado"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
            <section className="mx-auto max-w-7xl px-6 pb-14">
        <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl backdrop-blur-xl md:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-white/35">
                Experiência
              </p>
              <h2 className="mt-4 max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.06em] md:text-6xl">
                Uma página feita para transformar visitas em reservas.
              </h2>
            </div>

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
              text="Uma presença online elegante, pensada para restaurantes modernos."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-14">
        <div className="grid gap-5 lg:grid-cols-4">
          <GalleryTile
            large
            title={restaurant.websiteCuisine || "Restaurante"}
            subtitle="Ambiente"
            image={hasImage ? restaurant.websiteHeroImage! : null}
          />
          <GalleryTile title="Reserva" subtitle="Online" image={null} />
          <GalleryTile title="Mesa" subtitle="Preparada" image={null} />
          <GalleryTile title="Experiência" subtitle="Completa" image={null} />
        </div>
      </section>

      {mapsUrl && (
        <section className="mx-auto max-w-7xl px-6 pb-14">
          <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
              <div className="p-7 md:p-10">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-white/35">
                  Localização
                </p>

                <h2 className="mt-5 text-4xl font-black tracking-[-0.06em] md:text-6xl">
                  Visita-nos.
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-white/55">
                  {restaurant.address}
                </p>

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
      )}

      <section className="mx-auto max-w-7xl px-6 pb-14">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur-xl md:p-14">
          <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: primaryColor }} />

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

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href={reserveUrl}
                className="inline-flex items-center justify-center rounded-full px-9 py-4 text-sm font-black text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Reservar agora
              </a>

              {restaurant.websiteInstagram && (
                <a
                  href={restaurant.websiteInstagram}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-9 py-4 text-sm font-black text-white hover:bg-white/15"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

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

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/80 p-3 backdrop-blur-xl md:hidden">
        <a
          href={reserveUrl}
          className="flex h-14 items-center justify-center rounded-full text-sm font-black text-white"
          style={{ backgroundColor: primaryColor }}
        >
          Reservar mesa
        </a>
      </div>
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-white/60 backdrop-blur-xl">
      {children}
    </span>
  );
}

function MiniLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-3 text-sm">
      <span className="font-bold text-white/35">{label}</span>
      <span className="font-semibold text-white/75">{value}</span>
    </div>
  );
}

function GlassCard({
  eyebrow,
  title,
  value,
}: {
  eyebrow: string;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
        {eyebrow}
      </p>
      <h3 className="mt-3 text-xl font-black tracking-[-0.03em]">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-white/55">
        {value}
      </p>
    </div>
  );
}

function FeatureCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-black/20 p-5">
      <p className="text-xs font-black text-white/30">{number}</p>
      <h3 className="mt-5 text-xl font-black tracking-[-0.03em]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-white/50">{text}</p>
    </div>
  );
}

function GalleryTile({
  title,
  subtitle,
  image,
  large,
}: {
  title: string;
  subtitle: string;
  image: string | null;
  large?: boolean;
}) {
  return (
    <div
      className={
        large
          ? "relative min-h-[420px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl md:col-span-2 lg:col-span-2"
          : "relative min-h-[260px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl"
      }
    >
      {image ? (
        <img
          src={image}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%),linear-gradient(to_bottom,#18181b,#09090b)]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/85" />

      <div className="relative flex h-full min-h-[220px] flex-col justify-end">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-white/35">
          {subtitle}
        </p>
        <h3 className="mt-2 text-3xl font-black tracking-[-0.05em]">
          {title}
        </h3>
      </div>
    </div>
  );
}