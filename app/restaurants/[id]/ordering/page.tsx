import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { canAccessApp } from "@/lib/check-subscription";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function RestaurantOrderingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) redirect("/login");

  const hasAccess = await canAccessApp(session.user.email);
  if (!hasAccess) redirect("/billing");

  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      tables: {
        orderBy: {
          number: "asc",
        },
      },
    },
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#020617] p-6 text-white">
        Restaurante não encontrado
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] pb-24 text-white">
      <Background />

      <div className="relative z-10 mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <header className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_70px_rgba(34,211,238,0.08)] backdrop-blur-xl lg:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link href={`/restaurants/${id}`} className="text-2xl font-black">
                Mesa
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Link
                </span>
              </Link>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black leading-none tracking-[-0.04em] sm:text-4xl">
                  QR Ordering
                </h1>

                <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">
                  Coming soon
                </span>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Pedidos por QR Code direto da mesa. Menu digital, carrinho,
                pedidos em tempo real e integração futura com POS.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                disabled
                className="cursor-not-allowed rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 py-2.5 text-sm font-black text-black opacity-50"
              >
                Ativar QR Ordering
              </button>

              <Link
                href={`/restaurants/${id}`}
                className="rounded-full border border-cyan-300/20 bg-white/[0.04] px-4 py-2 text-sm font-black text-slate-200 transition hover:border-cyan-300/50 hover:bg-cyan-400/10 hover:text-white"
              >
                Voltar
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
              Novo add-on
            </p>

            <h2 className="mt-2 max-w-3xl text-3xl font-black tracking-[-0.05em] sm:text-5xl">
              Transforme cada mesa num ponto de venda.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
              O cliente lê o QR Code, vê o menu, adiciona produtos ao pedido e
              envia tudo diretamente para o restaurante. Sem pagamentos nesta
              primeira versão. Apenas estrutura premium para vender a
              funcionalidade.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Pedidos hoje" value="—" sub="brevemente" />
              <MetricCard label="Mesas ativas" value={restaurant.tables.length} sub="QR futuro" />
              <MetricCard label="Tempo médio" value="—" sub="em análise" />
              <MetricCard label="Estado" value="Soon" sub="add-on" />
            </div>

            <div className="mt-6 rounded-[24px] border border-violet-300/15 bg-violet-500/10 p-5">
              <p className="text-sm font-bold leading-6 text-violet-100">
                Ideal para vender como add-on ao plano Pro: mais pedidos,
                menos fricção, operação mais rápida e preparado para POS.
              </p>
            </div>
          </div>

          <CustomerPreview />
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <FlowCard />

          <div className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                  Mesas
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                  QR Codes por mesa
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Cada mesa terá um QR Code único para abrir a página pública de
                  pedidos.
                </p>
              </div>

              <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">
                {restaurant.tables.length} mesas
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {restaurant.tables.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-cyan-300/15 bg-[#020617]/60 p-5 text-sm text-slate-400 sm:col-span-2 xl:col-span-3">
                  Ainda não tens mesas criadas. Quando criares mesas, elas vão
                  aparecer aqui com QR Ordering.
                </div>
              ) : (
                restaurant.tables.map((table) => (
                  <TableQrCard
                    key={table.id}
                    number={table.number}
                    capacity={table.capacity}
                  />
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-violet-300/20 bg-gradient-to-br from-violet-500/15 via-cyan-500/10 to-white/[0.04] p-5 shadow-[0_0_55px_rgba(167,139,250,0.08)] backdrop-blur-xl lg:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-200">
                Premium
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                QR Ordering será um add-on pago.
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Esta página já prepara a venda da funcionalidade sem mexer na
                lógica atual de reservas, billing ou website.
              </p>
            </div>

            <button
              disabled
              className="cursor-not-allowed rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-slate-500"
            >
              Disponível em breve
            </button>
          </div>
        </section>
      </div>

      <BottomNav id={id} />
    </main>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute left-1/2 top-[-180px] h-[430px] w-[430px] -translate-x-1/2 rounded-full bg-cyan-500/18 blur-[110px]" />
      <div className="absolute right-[-160px] top-[360px] h-[330px] w-[330px] rounded-full bg-violet-500/16 blur-[100px]" />
      <div className="absolute bottom-[-160px] left-[-160px] h-[330px] w-[330px] rounded-full bg-blue-500/12 blur-[100px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.12),transparent_35%),linear-gradient(to_bottom,#020617,#050816_35%,#020617)]" />
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-[#020617]/60 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black leading-none text-cyan-300">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-bold text-slate-500">{sub}</p>
    </div>
  );
}

function CustomerPreview() {
  return (
    <div className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-6">
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
        Preview cliente
      </p>

      <div className="mt-4 rounded-[26px] border border-cyan-300/15 bg-[#020617]/70 p-4">
        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-black">Mesa 12</p>
              <p className="text-xs font-bold text-slate-500">
                Menu digital aberto
              </p>
            </div>

            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">
              QR
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <ProductMock name="Burger" price="12,50€" />
            <ProductMock name="Limonada" price="3,00€" />
          </div>

          <div className="mt-4 rounded-2xl bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-4 py-3 text-center text-sm font-black text-black">
            Enviar pedido
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductMock({ name, price }: { name: string; price: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="mb-3 h-16 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20" />
      <p className="text-sm font-black">{name}</p>
      <p className="text-xs font-bold text-cyan-300">{price}</p>
    </div>
  );
}

function FlowCard() {
  const steps = [
    "Cliente lê o QR Code",
    "Abre o menu da mesa",
    "Adiciona produtos",
    "Restaurante recebe pedido",
  ];

  return (
    <div className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-6">
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
        Fluxo
      </p>

      <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
        Como vai funcionar
      </h2>

      <div className="mt-6 space-y-3">
        {steps.map((step, index) => (
          <div
            key={step}
            className="flex items-center gap-4 rounded-2xl border border-cyan-300/10 bg-[#020617]/60 p-4"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-black text-cyan-300">
              {index + 1}
            </div>

            <p className="text-sm font-bold text-slate-300">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableQrCard({
  number,
  capacity,
}: {
  number: number;
  capacity: number;
}) {
  return (
    <div className="rounded-[24px] border border-cyan-300/10 bg-[#020617]/60 p-4 transition hover:border-cyan-300/30 hover:bg-cyan-400/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xl font-black">Mesa {number}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {capacity} lugares
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-xl">
          ▦
        </div>
      </div>

      <button
        disabled
        className="mt-4 flex h-11 w-full cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-black text-slate-500"
      >
        Gerar QR em breve
      </button>
    </div>
  );
}

function BottomNav({ id }: { id: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-cyan-300/10 bg-[#020617]/90 px-4 py-3 backdrop-blur-2xl lg:hidden">
      <div className="grid grid-cols-5 text-center text-xs font-bold text-slate-400">
        <Link href={`/restaurants/${id}`}>
          <p className="text-xl">⌂</p>
          Dashboard
        </Link>
        <Link href={`/restaurants/${id}/day`}>
          <p className="text-xl">⚡</p>
          Hoje
        </Link>
        <Link href={`/restaurants/${id}/customers`}>
          <p className="text-xl">👥</p>
          Clientes
        </Link>
        <Link href={`/restaurants/${id}/tables`}>
          <p className="text-xl">▦</p>
          Sala
        </Link>
        <Link href={`/restaurants/${id}/ordering`} className="text-cyan-300">
          <p className="text-xl">📲</p>
          QR
        </Link>
      </div>
    </nav>
  );
}