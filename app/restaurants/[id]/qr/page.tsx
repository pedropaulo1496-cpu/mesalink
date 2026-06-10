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
      <main className="min-h-screen bg-[#0f0f0f] p-10 text-white">
        Restaurante não encontrado
      </main>
    );
  }

  const reservationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reserve/${restaurant.slug}`;

  const qrCode = await QRCode.toDataURL(reservationUrl, {
    margin: 2,
    width: 420,
    color: {
      dark: "#0f0f0f",
      light: "#ffffff",
    },
  });

  return (
    <main className="min-h-screen bg-[#0f0f0f] p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-6 border-b border-[#2b2b2b] pb-8 md:flex-row md:items-center">
          <div>
            <Link
              href={`/restaurants/${id}`}
              className="text-sm text-[#9e9e9e] hover:text-white"
            >
              ← Voltar ao dashboard
            </Link>

            <h1 className="mt-4 text-5xl font-black tracking-tight">
              QR Code
            </h1>

            <p className="mt-2 text-[#9e9e9e]">
              {restaurant.name}
            </p>
          </div>

          <div className="rounded-full border border-green-500/20 bg-green-500/10 px-5 py-3 text-sm font-bold text-green-300">
            Ativo
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
          <div className="rounded-[2rem] border border-[#2b2b2b] bg-[#181818] p-8">
            <p className="text-sm font-bold uppercase tracking-widest text-[#f0c36a]">
              QR de reservas
            </p>

            <h2 className="mt-3 text-4xl font-black">
              Transforme qualquer mesa, montra ou menu num ponto de reserva.
            </h2>

            <p className="mt-4 max-w-2xl text-[#9e9e9e]">
              Este QR Code abre diretamente a página pública de reservas do restaurante.
              Pode ser usado no Google Business Profile, menus, cartões, montra,
              Instagram ou campanhas impressas.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <InfoCard title="Destino" text="Página de reservas" />
              <InfoCard title="Comissões" text="0%" />
              <InfoCard title="Estado" text="Pronto a usar" />
            </div>

            <div className="mt-8 rounded-3xl border border-[#2b2b2b] bg-[#111111] p-6">
              <p className="mb-3 text-sm font-bold text-[#9e9e9e]">
                Link associado ao QR
              </p>

              <p className="break-all rounded-2xl bg-black/30 p-4 text-sm text-[#d6d6d6]">
                {reservationUrl}
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 md:flex-row">
              <a
                href={qrCode}
                download={`${restaurant.slug}-qr-reservas.png`}
                className="flex h-14 items-center justify-center rounded-full bg-[#f0c36a] px-8 font-black text-black hover:bg-[#ffd982]"
              >
                Download QR
              </a>

              <Link
                href={`/reserve/${restaurant.slug}`}
                className="flex h-14 items-center justify-center rounded-full border border-[#2b2b2b] bg-[#111111] px-8 font-bold text-white hover:border-[#f0c36a]"
              >
                Ver página pública
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#2b2b2b] bg-[#181818] p-8">
            <div className="rounded-[2rem] bg-white p-6">
              <img
                src={qrCode}
                alt="QR Code de reservas"
                className="mx-auto"
              />
            </div>

            <div className="mt-6 rounded-3xl border border-[#2b2b2b] bg-[#111111] p-6 text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-[#f0c36a]">
                MesaLink QR
              </p>

              <p className="mt-3 text-2xl font-black">
                Reservas online
              </p>

              <p className="mt-2 text-sm text-[#9e9e9e]">
                Imprima este QR Code e coloque-o em menus, cartões ou na montra.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#2b2b2b] bg-[#181818] p-8">
          <p className="text-sm font-bold uppercase tracking-widest text-[#f0c36a]">
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
      </div>
    </main>
  );
}

function InfoCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-[#2b2b2b] bg-[#111111] p-5">
      <p className="text-sm text-[#9e9e9e]">{title}</p>
      <p className="mt-2 text-xl font-black text-[#f0c36a]">{text}</p>
    </div>
  );
}

function FutureCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-[#2b2b2b] bg-[#111111] p-6">
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[#9e9e9e]">{text}</p>
    </div>
  );
}