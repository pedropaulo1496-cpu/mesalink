import Footer from "@/components/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#070504] text-[#fff7ea]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(240,195,106,0.18),transparent_30%),linear-gradient(to_bottom,#070504,#120d08)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between gap-3">
  <Link href="/" className="shrink-0 text-2xl font-black sm:text-3xl">
    Mesa<span className="text-[#f0c36a]">Link</span>
  </Link>

  <div className="hidden items-center gap-6 text-sm lg:flex">
    <Link href="#features" className="text-[#d6c7ad] hover:text-white">
      Funcionalidades
    </Link>
    <Link href="/pricing" className="text-[#d6c7ad] hover:text-white">
      Preços
    </Link>
    <Link href="/login" className="text-[#d6c7ad] hover:text-white">
      Entrar
    </Link>

    <Button asChild className="rounded-full bg-[#f0c36a] px-6 text-black hover:bg-[#ffd982]">
      <Link href="/register">Começar agora</Link>
    </Button>
  </div>

  <Button
    asChild
    className="shrink-0 rounded-full bg-[#f0c36a] px-4 text-sm text-black hover:bg-[#ffd982] lg:hidden"
  >
    <Link href="/login">Entrar</Link>
  </Button>
</nav>

          <div className="grid grid-cols-1 items-center gap-12 py-14 md:py-20 lg:min-h-[740px] lg:grid-cols-2 lg:gap-16 lg:py-0">
            <div>
              <div className="mb-5 inline-flex max-w-full rounded-full border border-[#f0c36a]/30 bg-[#f0c36a]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#f0c36a] sm:text-xs">
                Reservas online para restaurantes
              </div>

              <h1 className="mb-6 max-w-2xl text-[42px] font-black leading-[0.95] tracking-tight sm:text-5xl md:text-6xl xl:text-7xl">
                Transforme visitas no Google em{" "}
                <span className="text-[#f0c36a]">reservas confirmadas.</span>
              </h1>

              <p className="mb-7 max-w-xl text-base leading-relaxed text-[#d6c7ad] sm:text-lg">
                O link de reservas do seu restaurante no Google Maps, Instagram
                e website. Simples para os clientes. Poderoso para o restaurante.
              </p>

              <div className="mb-8 grid gap-2 text-sm text-[#d6c7ad] sm:flex sm:flex-wrap sm:gap-4">
                <span>✓ Sem telefonemas</span>
                <span>✓ Sem mensagens perdidas</span>
                <span>✓ Sem comissões</span>
              </div>

              <div className="grid gap-3 sm:flex sm:flex-wrap">
                <Button
                  asChild
                  size="lg"
                  className="h-14 rounded-full bg-[#f0c36a] px-7 text-base font-bold text-black shadow-2xl hover:bg-[#ffd982]"
                >
                  <Link href="/register">Começar teste gratuito</Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-14 rounded-full border-[#f0c36a]/40 bg-white/5 px-7 text-base text-white hover:bg-white/10"
                >
                  <Link href="/pricing">Ver preços</Link>
                </Button>
              </div>

              <p className="mt-5 text-sm text-[#a99a82]">
                A partir de <strong className="text-[#f0c36a]">17,50€ + IVA/mês</strong>.
                Sem cartão de crédito.
              </p>
            </div>

            <ProductMockup />
          </div>
        </div>
      </section>

      <section className="border-y border-[#f0c36a]/10 bg-[#0d0a07]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#f0c36a] sm:text-sm">
              Como funciona
            </p>

            <h2 className="text-3xl font-black sm:text-4xl md:text-5xl">
              Comece a receber reservas em minutos.
            </h2>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            <Step number="1" title="Adicione o link ao Google Maps" text="Coloque o link do MesaLink no perfil Google do restaurante, Instagram ou website." />
            <Step number="2" title="O cliente reserva online" text="Escolhe data, hora e número de pessoas sem telefonemas nem mensagens." />
            <Step number="3" title="Receba a reserva instantaneamente" text="Confirme, aprove ou organize tudo diretamente no painel MesaLink." />
          </div>
        </div>
      </section>

      <section id="features" className="bg-[#070504]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-[#f0c36a] sm:text-sm">
                Tudo o que precisa
              </p>

              <h2 className="text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
                Um sistema completo para receber mais reservas.
              </h2>
            </div>

            <p className="max-w-xl text-base leading-relaxed text-[#a99a82] sm:text-lg">
              O MesaLink foi criado para restaurantes que querem uma solução
              simples, rápida e sem comissões para organizar reservas online.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Feature title="Link para Google Maps" text="Coloque o link no perfil Google do restaurante e receba reservas 24h por dia." />
            <Feature title="QR Code de reservas" text="Partilhe o QR Code na montra, Instagram, menus ou cartões." />
            <Feature title="Serviço do dia" text="Veja almoço, jantar, pendentes, check-ins, no-shows e reservas finalizadas." />
            <Feature title="Aprovação manual" text="Defina quando grupos grandes ou pedidos especiais precisam da sua aprovação." />
            <Feature title="Mesas ou capacidade" text="Funciona com mesas fixas ou apenas com lotação total do restaurante." />
            <Feature title="Clientes e histórico" text="Guarde clientes automaticamente e acompanhe visitas e no-shows." />
          </div>

          <div className="mt-14 grid grid-cols-2 gap-8 border-t border-[#f0c36a]/10 pt-10 text-center md:mt-20 md:grid-cols-4 md:pt-12">
            <Stat value="24h" label="reservas online" />
            <Stat value="0%" label="comissões por reserva" />
            <Stat value="10 min" label="para configurar" />
            <Stat value="17,50€" label="+ IVA / mês" />
          </div>
        </div>
      </section>

      <section className="bg-[#f0c36a] text-black">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 text-center sm:px-6 md:flex-row md:px-8 md:py-16 md:text-left">
          <div>
            <h2 className="text-3xl font-black sm:text-4xl">
              Pronto para receber reservas pelo Google Maps?
            </h2>
            <p className="mt-3 text-black/70">
              Comece hoje. Sem comissões. Sem complicações.
            </p>
          </div>

          <Button asChild size="lg" className="h-14 w-full rounded-full bg-black px-8 text-white hover:bg-black/90 sm:w-auto">
            <Link href="/register">Começar agora</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="absolute -inset-4 rounded-[2rem] bg-[#f0c36a]/15 blur-3xl" />

      <div className="relative rounded-[1.5rem] border border-[#f0c36a]/20 bg-[#0e0a07] p-3 shadow-2xl md:rounded-[2rem] md:p-4">
        <div className="mb-3 flex items-center gap-2 px-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span className="ml-auto text-[10px] text-[#a99a82] sm:text-xs">
            MesaLink Dashboard
          </span>
        </div>

        <div className="overflow-hidden rounded-[1.25rem] border border-[#f0c36a]/15 bg-[#15100b] md:grid md:grid-cols-[160px_1fr]">
          <aside className="hidden border-r border-[#f0c36a]/10 p-5 md:block">
            <p className="mb-8 text-xl font-black">
              Mesa<span className="text-[#f0c36a]">Link</span>
            </p>

            {["Painel", "Reservas", "Calendário", "Clientes", "Mesas", "Serviço do dia"].map((item) => (
              <div
                key={item}
                className={`mb-2 rounded-xl px-3 py-2 text-sm ${
                  item === "Serviço do dia"
                    ? "bg-[#f0c36a]/15 text-[#f0c36a]"
                    : "text-[#a99a82]"
                }`}
              >
                {item}
              </div>
            ))}
          </aside>

          <div className="p-4 sm:p-5 md:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-[#a99a82] sm:text-sm">Sábado, 18 de Maio</p>
                <h3 className="text-xl font-black sm:text-2xl">Serviço de hoje</h3>
              </div>

              <span className="rounded-full bg-[#f0c36a]/15 px-3 py-1 text-xs font-bold text-[#f0c36a]">
                Jantar
              </span>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-4">
              <MockCard label="Reservas" value="18" />
              <MockCard label="Pessoas" value="64" />
              <MockCard label="Pendentes" value="3" danger />
            </div>

            <div className="rounded-2xl border border-[#f0c36a]/10 bg-black/20 p-3 sm:p-4">
              <p className="mb-4 font-bold">Próximas reservas</p>

              <Reservation time="20:00" name="João Silva" people="4 pessoas" status="Confirmada" />
              <Reservation time="20:30" name="Ana Costa" people="2 pessoas" status="Confirmada" />
              <Reservation time="21:00" name="Pedro Santos" people="6 pessoas" status="Pendente" danger />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="text-center">
      <div className="mb-4 text-5xl font-black text-[#f0c36a] md:text-7xl">
        {number}
      </div>

      <h3 className="mb-3 text-xl font-black md:text-2xl">
        {title}
      </h3>

      <p className="leading-relaxed text-[#a99a82]">
        {text}
      </p>
    </div>
  );
}

function MockCard({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className={danger ? "rounded-xl border border-red-400/30 bg-red-500/10 p-3 sm:rounded-2xl sm:p-4" : "rounded-xl border border-[#f0c36a]/10 bg-black/20 p-3 sm:rounded-2xl sm:p-4"}>
      <p className={danger ? "text-2xl font-black text-red-300 sm:text-3xl" : "text-2xl font-black sm:text-3xl"}>
        {value}
      </p>
      <p className="text-[11px] text-[#a99a82] sm:text-sm">{label}</p>
    </div>
  );
}

function Reservation({
  time,
  name,
  people,
  status,
  danger,
}: {
  time: string;
  name: string;
  people: string;
  status: string;
  danger?: boolean;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-[#15100b] p-3">
      <div className="flex min-w-0 gap-3 sm:gap-4">
        <p className="w-11 shrink-0 text-sm text-[#f0c36a] sm:w-12">{time}</p>
        <div className="min-w-0">
          <p className="truncate font-bold">{name}</p>
          <p className="text-xs text-[#a99a82]">{people}</p>
        </div>
      </div>

      <span className={danger ? "shrink-0 rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-bold text-red-300 sm:px-3 sm:text-xs" : "shrink-0 rounded-full bg-green-500/15 px-2 py-1 text-[10px] font-bold text-green-300 sm:px-3 sm:text-xs"}>
        {status}
      </span>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-[#f0c36a]/10 bg-[#15100b] p-6 transition hover:-translate-y-1 hover:border-[#f0c36a]/30 md:p-7">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0c36a]/15 text-[#f0c36a]">
        ✓
      </div>
      <h3 className="mb-3 text-lg font-black sm:text-xl">{title}</h3>
      <p className="leading-relaxed text-[#a99a82]">{text}</p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-black text-[#f0c36a] sm:text-4xl">{value}</p>
      <p className="mt-2 text-sm text-[#a99a82]">{label}</p>
    </div>
  );
}