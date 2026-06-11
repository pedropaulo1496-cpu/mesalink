import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import Link from "next/link";

export default async function QRPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#020617] p-10 text-white">
        Restaurante não encontrado
      </main>
    );
  }

  const reservationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reserve/${restaurant.slug}`;

  const qrCode = await QRCode.toDataURL(reservationUrl, {
    margin: 2,
    width: 420,
    color: {
      dark: "#020617",
      light: "#ffffff",
    },
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <header className="flex flex-col justify-between gap-6 border-b border-cyan-300/10 pb-8 md:flex-row md:items-center">
          <div>
            <Link
              href={`/restaurants/${id}`}
              className="text-sm font-bold text-slate-400 hover:text-white"
            >
              ← Voltar ao dashboard
            </Link>

            <p className="mt-8 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              MesaLink QR
            </p>

            <h1 className="mt-3 text-5xl font-black tracking-[-0.06em]">
              QR Code
            </h1>

            <p className="mt-2 text-slate-400">{restaurant.name}</p>
          </div>

          <div className="w-fit rounded-full border border-green-400/20 bg-green-500/10 px-5 py-3 text-sm font-black text-green-300">
            Ativo
          </div>
        </header>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
          <div className="rounded-[2rem] border border-cyan-300/15 bg-white/[0.04] p-6 shadow-[0_0_90px_rgba(34,211,238,0.12)] backdrop-blur-2xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              QR de reservas
            </p>

            <h2 className="mt-4 max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.05em]">
              Transforme qualquer mesa, montra ou menu num ponto de reserva.
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-400">
              Este QR Code abre diretamente a página pública de reservas do
              restaurante. Pode ser usado no Google Business Profile, menus,
              cartões, montra, Instagram ou campanhas impressas.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <InfoCard title="Destino" text="Página de reservas" />
              <InfoCard title="Comissões" text="0%" />
              <InfoCard title="Estado" text="Pronto a usar" />
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-black/25 p-5">
              <p className="mb-3 text-sm font-bold text-slate-400">
                Link associado ao QR
              </p>

              <p className="break-all rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-300">
                {reservationUrl}
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 md:flex-row">
              <a
                href={qrCode}
                download={`${restaurant.slug}-qr-reservas.png`}
                className="flex h-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-8 font-black text-black shadow-[0_0_60px_rgba(96,165,250,0.35)] hover:opacity-90"
              >
                Download QR
              </a>

              <Link
                href={`/reserve/${restaurant.slug}`}
                className="flex h-14 items-center justify-center rounded-full border border-cyan-300/25 bg-white/5 px-8 font-black text-white backdrop-blur hover:bg-white/10"
              >
                Ver página pública
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-cyan-300/15 bg-white/[0.04] p-6 shadow-[0_0_90px_rgba(34,211,238,0.12)] backdrop-blur-2xl sm:p-8">
            <div className="rounded-[2rem] bg-white p-6">
              <img
                src={qrCode}
                alt="QR Code de reservas"
                className="mx-auto"
              />
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 p-6 text-center">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                MesaLink QR
              </p>

              <p className="mt-3 text-2xl font-black">Reservas online</p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Imprima este QR Code e coloque-o em menus, cartões ou na
                montra.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-cyan-300/15 bg-white/[0.04] p-6 backdrop-blur-2xl sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
            Próximas versões
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <FutureCard
              title="QR por mesa"
              text="Cada mesa terá o seu próprio QR Code."
            />

            <FutureCard
              title="Chamar empregado"
              text="O cliente poderá pedir ajuda diretamente pelo QR."
            />

            <FutureCard
              title="Pedidos pela mesa"
              text="Menu digital e pedidos enviados para a operação."
            />
          </div>
        </section>
      </section>
    </main>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-xl font-black text-cyan-300">{text}</p>
    </div>
  );
}

function FutureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-6">
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute left-1/2 top-[-180px] h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="absolute right-[-160px] top-[280px] h-[360px] w-[360px] rounded-full bg-violet-500/15 blur-[110px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.15),transparent_35%),linear-gradient(to_bottom,#020617,#050816_45%,#020617)]" />
    </div>
  );
}