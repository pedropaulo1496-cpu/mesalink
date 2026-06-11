import Footer from "@/components/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <>
      <div className="block lg:hidden">
        <MobileHome />
      </div>

      <div className="hidden lg:block">
        <HomeDesktop />
      </div>
    </>
  );
}

function MobileHome() {
  return (
    <main className="min-h-screen bg-[#070504] px-5 py-5 text-[#fff7ea]">
      <nav className="mb-10 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black">
          Mesa<span className="text-[#f0c36a]">Link</span>
        </Link>

        <Link
          href="/login"
          className="rounded-full bg-[#f0c36a] px-4 py-2 text-sm font-bold text-black"
        >
          Entrar
        </Link>
      </nav>

      <section className="rounded-[28px] border border-[#f0c36a]/20 bg-[#120d08] p-6">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-[#f0c36a]">
          Reservas online
        </p>

        <h1 className="mb-5 text-4xl font-black leading-tight">
          Receba reservas pelo{" "}
          <span className="text-[#f0c36a]">Google Maps.</span>
        </h1>

        <p className="mb-7 text-base leading-relaxed text-[#d6c7ad]">
          O MesaLink dá ao seu restaurante um link simples para receber reservas
          online, sem chamadas, sem mensagens perdidas e sem comissões.
        </p>

        <div className="grid gap-3">
          <Button
            asChild
            className="h-14 rounded-full bg-[#f0c36a] text-base font-bold text-black hover:bg-[#ffd982]"
          >
            <Link href="/register">Começar teste gratuito</Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-14 rounded-full border-[#f0c36a]/40 bg-white/5 text-base text-white hover:bg-white/10"
          >
            <Link href="/pricing">Ver preços</Link>
          </Button>
        </div>

        <p className="mt-5 text-sm text-[#a99a82]">
          Desde <strong className="text-[#f0c36a]">17,50€ + IVA/mês</strong>
        </p>
      </section>

      <section className="mt-8 grid gap-3">
        <MobileStat value="24h" label="Reservas online" />
        <MobileStat value="0%" label="Comissões por reserva" />
        <MobileStat value="10 min" label="Para configurar" />
      </section>

      <section className="mt-12">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#f0c36a]">
          Como funciona
        </p>

        <h2 className="mb-6 text-3xl font-black">Comece em minutos.</h2>

        <div className="grid gap-4">
          <MobileCard
            title="1. Adicione o link"
            text="Coloque no Google Maps, Instagram ou website."
          />
          <MobileCard
            title="2. Cliente reserva"
            text="Escolhe data, hora e número de pessoas online."
          />
          <MobileCard
            title="3. Gere no painel"
            text="Veja reservas, clientes e serviço do dia."
          />
        </div>
      </section>

      <section className="mt-12">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#f0c36a]">
          Funcionalidades
        </p>

        <h2 className="mb-6 text-3xl font-black">Tudo para gerir reservas.</h2>

        <div className="grid gap-4">
          <MobileCard
            title="Link para Google Maps"
            text="Receba reservas diretamente do perfil Google do restaurante."
          />
          <MobileCard
            title="QR Code"
            text="Partilhe em menus, montra, cartões e Instagram."
          />
          <MobileCard
            title="Serviço do dia"
            text="Veja almoço, jantar, pendentes, check-ins e no-shows."
          />
          <MobileCard
            title="Clientes"
            text="Guarde histórico, visitas e contactos automaticamente."
          />
        </div>
      </section>

      <section className="mt-12 rounded-[28px] bg-[#f0c36a] p-6 text-black">
        <h2 className="mb-3 text-3xl font-black">Pronto para começar?</h2>

        <p className="mb-6 text-black/70">
          Sem comissões. Sem complicações.
        </p>

        <Button
          asChild
          className="h-14 w-full rounded-full bg-black text-white hover:bg-black/90"
        >
          <Link href="/register">Começar agora</Link>
        </Button>
      </section>
    </main>
  );
}

function HomeDesktop() {
  return (
    <main className="min-h-screen bg-[#070504] text-[#fff7ea]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(240,195,106,0.22),transparent_32%),linear-gradient(to_bottom,#070504,#120d08)]" />

        <div className="relative mx-auto max-w-7xl px-8 py-8">
          <nav className="flex items-center justify-between">
            <Link href="/" className="text-3xl font-black">
              Mesa<span className="text-[#f0c36a]">Link</span>
            </Link>

            <div className="flex items-center gap-6 text-sm">
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
          </nav>

          <div className="grid min-h-[760px] grid-cols-1 items-center gap-16 md:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex rounded-full border border-[#f0c36a]/30 bg-[#f0c36a]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#f0c36a]">
                Reservas online para restaurantes
              </div>

              <h1 className="mb-7 max-w-2xl text-6xl font-black leading-[0.92] tracking-tight md:text-7xl">
                Transforme visitas no Google em{" "}
                <span className="text-[#f0c36a]">reservas confirmadas.</span>
              </h1>

              <p className="mb-8 max-w-xl text-lg leading-relaxed text-[#d6c7ad]">
                O link de reservas do seu restaurante no Google Maps, Instagram
                e website. Simples para os clientes. Poderoso para o restaurante.
              </p>

              <div className="mb-9 flex flex-wrap gap-4 text-sm text-[#d6c7ad]">
                <span>✓ Sem telefonemas</span>
                <span>✓ Sem mensagens perdidas</span>
                <span>✓ Sem comissões</span>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="h-14 rounded-full bg-[#f0c36a] px-8 text-base font-bold text-black shadow-2xl hover:bg-[#ffd982]"
                >
                  <Link href="/register">Começar teste gratuito</Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-14 rounded-full border-[#f0c36a]/40 bg-white/5 px-8 text-base text-white hover:bg-white/10"
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
        <div className="mx-auto max-w-6xl px-8 py-24">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-[#f0c36a]">
              Como funciona
            </p>

            <h2 className="text-5xl font-black">
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
        <div className="mx-auto max-w-7xl px-8 py-24">
          <div className="mb-14 grid grid-cols-1 gap-10 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-widest text-[#f0c36a]">
                Tudo o que precisa
              </p>

              <h2 className="text-5xl font-black leading-tight">
                Um sistema completo para receber mais reservas.
              </h2>
            </div>

            <p className="max-w-xl text-lg leading-relaxed text-[#a99a82]">
              O MesaLink foi criado para restaurantes que querem uma solução
              simples, rápida e sem comissões para organizar reservas online.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Feature title="Link para Google Maps" text="Coloque o link no perfil Google do restaurante e receba reservas 24h por dia." />
            <Feature title="QR Code de reservas" text="Partilhe o QR Code na montra, Instagram, menus ou cartões." />
            <Feature title="Serviço do dia" text="Veja almoço, jantar, pendentes, check-ins, no-shows e reservas finalizadas." />
            <Feature title="Aprovação manual" text="Defina quando grupos grandes ou pedidos especiais precisam da sua aprovação." />
            <Feature title="Mesas ou capacidade" text="Funciona com mesas fixas ou apenas com lotação total do restaurante." />
            <Feature title="Clientes e histórico" text="Guarde clientes automaticamente e acompanhe visitas e no-shows." />
          </div>

          <div className="mt-20 grid grid-cols-2 gap-8 border-t border-[#f0c36a]/10 pt-12 text-center md:grid-cols-4">
            <Stat value="24h" label="reservas online" />
            <Stat value="0%" label="comissões por reserva" />
            <Stat value="10 min" label="para configurar" />
            <Stat value="17,50€" label="+ IVA / mês" />
          </div>
        </div>
      </section>

      <section className="bg-[#f0c36a] text-black">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-8 py-16 text-center md:flex-row md:text-left">
          <div>
            <h2 className="text-4xl font-black">
              Pronto para receber reservas pelo Google Maps?
            </h2>
            <p className="mt-3 text-black/70">
              Comece hoje. Sem comissões. Sem complicações.
            </p>
          </div>

          <Button asChild size="lg" className="h-14 rounded-full bg-black px-8 text-white hover:bg-black/90">
            <Link href="/register">Começar agora</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function MobileStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#f0c36a]/10 bg-[#15100b] p-5">
      <p className="text-3xl font-black text-[#f0c36a]">{value}</p>
      <p className="mt-1 text-sm text-[#a99a82]">{label}</p>
    </div>
  );
}

function MobileCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[#f0c36a]/10 bg-[#15100b] p-5">
      <h3 className="mb-2 text-lg font-black">{title}</h3>
      <p className="text-sm leading-relaxed text-[#a99a82]">{text}</p>
    </div>
  );
}

function ProductMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-8 rounded-[3rem] bg-[#f0c36a]/20 blur-3xl" />

      <div className="relative rotate-1 rounded-[2rem] border border-[#f0c36a]/20 bg-[#0e0a07] p-4 shadow-2xl">
        <div className="mb-4 flex items-center gap-2 px-2">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="h-3 w-3 rounded-full bg-green-400" />
          <span className="ml-auto text-xs text-[#a99a82]">MesaLink Dashboard</span>
        </div>

        <div className="grid grid-cols-[170px_1fr] overflow-hidden rounded-[1.5rem] border border-[#f0c36a]/15 bg-[#15100b]">
          <aside className="border-r border-[#f0c36a]/10 p-5">
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

          <div className="p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-sm text-[#a99a82]">Sábado, 18 de Maio</p>
                <h3 className="text-2xl font-black">Serviço de hoje</h3>
              </div>

              <span className="rounded-full bg-[#f0c36a]/15 px-3 py-1 text-sm font-bold text-[#f0c36a]">
                Jantar
              </span>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-4">
              <MockCard label="Reservas" value="18" />
              <MockCard label="Pessoas" value="64" />
              <MockCard label="Pendentes" value="3" danger />
            </div>

            <div className="rounded-2xl border border-[#f0c36a]/10 bg-black/20 p-4">
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
      <div className="mb-6 text-7xl font-black text-[#f0c36a]">
        {number}
      </div>

      <h3 className="mb-4 text-2xl font-black">
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
    <div className={danger ? "rounded-2xl border border-red-400/30 bg-red-500/10 p-4" : "rounded-2xl border border-[#f0c36a]/10 bg-black/20 p-4"}>
      <p className={danger ? "text-3xl font-black text-red-300" : "text-3xl font-black"}>
        {value}
      </p>
      <p className="text-sm text-[#a99a82]">{label}</p>
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
    <div className="mb-3 flex items-center justify-between rounded-xl bg-[#15100b] p-3">
      <div className="flex gap-4">
        <p className="w-12 text-sm text-[#f0c36a]">{time}</p>
        <div>
          <p className="font-bold">{name}</p>
          <p className="text-xs text-[#a99a82]">{people}</p>
        </div>
      </div>

      <span className={danger ? "rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300" : "rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-300"}>
        {status}
      </span>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-[#f0c36a]/10 bg-[#15100b] p-7 transition hover:-translate-y-1 hover:border-[#f0c36a]/30">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0c36a]/15 text-[#f0c36a]">
        ✓
      </div>
      <h3 className="mb-3 text-xl font-black">{title}</h3>
      <p className="leading-relaxed text-[#a99a82]">{text}</p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-4xl font-black text-[#f0c36a]">{value}</p>
      <p className="mt-2 text-sm text-[#a99a82]">{label}</p>
    </div>
  );
}