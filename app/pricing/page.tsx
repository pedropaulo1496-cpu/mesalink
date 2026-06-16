import Footer from "@/components/Footer";
import Link from "next/link";
import CheckoutButton from "@/components/CheckoutButton";

const plans = [
  {
    name: "Free",
    badge: "Start here",
    price: "0€",
    suffix: "/ mês",
    description: "Para restaurantes que querem começar a receber reservas online sem risco.",
    features: [
      "Até 100 reservas por mês",
      "Página pública de reservas",
      "Link para Google Maps",
      "Link para redes sociais",
      "Calendário de reservas",
      "Gestão de clientes",
      "Sem cartão de crédito",
    ],
    cta: "Começar grátis →",
    href: "/register",
    highlighted: false,
    checkout: false,
  },
  {
    name: "Pro",
    badge: "Mais popular",
    price: "10€",
    suffix: "+ IVA / mês",
    description: "Para restaurantes que recebem reservas regularmente e querem controlo total.",
    features: [
      "Reservas ilimitadas",
      "Gestão de mesas",
      "Calendário mensal",
      "Serviço do dia",
      "Clientes e histórico",
      "Horários de funcionamento",
      "Aprovação manual",
      "Sem comissão por reserva",
    ],
    cta: "Escolher Pro →",
    href: "/register",
    highlighted: true,
    checkout: true,
  },
  {
    name: "Website",
    badge: "Add-on",
    price: "+10€",
    suffix: "+ IVA / mês",
    description: "Adicione um website profissional ao MesaLink, já integrado com reservas.",
    features: [
      "Website profissional",
      "Templates Premium, Luxury, Minimal e Social",
      "Menus em PDF",
      "Galeria de imagens",
      "SEO básico",
      "Contactos e horários",
      "Google Maps",
      "Reservas integradas",
    ],
    cta: "Adicionar Website →",
    href: "/register",
    highlighted: false,
    checkout: false,
  },
  {
    name: "QR Ordering",
    badge: "Add-on",
    price: "+15€",
    suffix: "+ IVA / mês",
    description:
      "Menu digital por QR, pedidos por mesa, chamar empregado e pedir conta.",
    features: [
      "Menu digital por QR",
      "Pedidos por mesa",
      "Chamar empregado",
      "Pedir conta",
      "Alertas em tempo real",
      "QR Codes personalizados",
      "Templates de QR",
      "Ativar/desativar funcionalidades",
    ],
    cta: "Adicionar QR Ordering →",
    href: "/register",
    highlighted: false,
    checkout: false,
  },
];

const comparison = [
  ["Website", "Ferramenta #1", "✓"],
  ["Reservas", "Ferramenta #2", "✓"],
  ["Gestão de Mesas", "Ferramenta #3", "✓"],
  ["Clientes", "Ferramenta #4", "✓"],
  ["Marketing", "Ferramenta #5", "Em breve"],
  ["QR Ordering", "Ferramenta #6", "✓"],
  ["POS", "Ferramenta #7", "Em breve"],
];

const roadmap = [
  {
    title: "Assistente IA",
    text: "Ajuda para reviews, descrições, campanhas, SEO e operação diária.",
  },
  {
    title: "Ferramentas de Marketing",
    text: "Campanhas, automações e comunicação para trazer clientes de volta.",
  },
  {
    title: "Inteligência Artificial",
    text: "Automatização de tarefas, sugestões operacionais e insights para ajudar a gerir melhor o restaurante.",
  },
  {
    title: "POS Integrado",
    text: "O próximo passo para ligar reservas, pedidos, pagamentos e gestão.",
  },
];

const faqs = [
  {
    question: "Existe plano grátis?",
    answer: "Sim. O plano Free permite receber até 100 reservas por mês sem cartão de crédito.",
  },
  {
    question: "Há comissões por reserva?",
    answer: "Não. O MesaLink não cobra comissão por reserva.",
  },
  {
    question: "O website está incluído no Pro?",
    answer: "Não. O Website é um add-on de 10€/mês para restaurantes que querem presença online profissional.",
  },
  {
    question: "Quanto custa o QR Ordering?",
    answer: "O QR Ordering está disponível como add-on por 15€/mês por restaurante.",
  },
  {
    question: "Posso cancelar?",
    answer: "Sim. Pode cancelar quando quiser.",
  },
];

export default function PricingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 px-5 pb-16 pt-5 lg:px-8">
        <nav className="mx-auto mb-14 flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-2xl font-black">
            Mesa
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Link
            </span>
          </Link>

          <Link
            href="/login"
            className="rounded-full border border-cyan-300/25 bg-white/5 px-5 py-2 text-sm font-black text-cyan-200 backdrop-blur hover:bg-white/10"
          >
            Entrar
          </Link>
        </nav>

        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-4xl text-center">
            <Badge>Restaurant Operating System</Badge>

            <h1 className="mt-5 text-[44px] font-black leading-[0.9] tracking-[-0.07em] sm:text-6xl lg:text-7xl">
              Tudo o que o seu restaurante precisa. {" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-400 bg-clip-text text-transparent">
                Num único lugar.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-slate-300">
              Website profissional, reservas online, QR Ordering, gestão de mesas
              e clientes numa única plataforma. Comece grátis e adicione apenas o que precisa.
            </p>

            <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-3">
              <HeroStat value="0€" label="para começar" />
              <HeroStat value="0%" label="comissões" />
              <HeroStat value="10min" label="setup" />
            </div>
          </div>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </section>

          <section className="mt-12 overflow-hidden rounded-[36px] border border-cyan-300/15 bg-white/[0.04] backdrop-blur-2xl">
            <div className="p-6 sm:p-8">
              <Badge>Porque MesaLink?</Badge>

              <h2 className="mt-5 text-3xl font-black tracking-[-0.05em] sm:text-5xl">
                Menos ferramentas. Mais restaurante.
              </h2>

              <p className="mt-4 max-w-2xl text-slate-400">
                Em vez de pagar e gerir várias plataformas separadas, o MesaLink
                junta reservas, website, QR Ordering, clientes e gestão num único sistema.
              </p>
            </div>

            <div className="grid grid-cols-3 border-y border-white/10 bg-white/[0.04] p-4 text-xs font-black uppercase tracking-[0.16em] text-slate-400 sm:text-sm">
              <div>Necessidade</div>
              <div>Tradicional</div>
              <div>MesaLink</div>
            </div>

            {comparison.map(([need, traditional, mesalink]) => (
              <div
                key={need}
                className="grid grid-cols-3 border-b border-white/10 p-4 text-sm last:border-b-0 sm:p-5 sm:text-base"
              >
                <div className="font-black text-white">{need}</div>
                <div className="text-slate-400">{traditional}</div>
                <div className="font-black text-cyan-300">{mesalink}</div>
              </div>
            ))}
          </section>

          <section className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {roadmap.map((item) => (
              <RoadmapCard key={item.title} title={item.title} text={item.text} />
            ))}
          </section>

          <section className="mt-12 rounded-[36px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl sm:p-8">
            <Badge>FAQ</Badge>

            <h2 className="mt-5 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
              Perguntas rápidas.
            </h2>

            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {faqs.map((faq) => (
                <FAQ key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </section>

          <section className="mt-12 overflow-hidden rounded-[36px] border border-cyan-300/20 bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500 p-7 text-black shadow-[0_0_100px_rgba(96,165,250,0.45)] sm:p-9">
            <h2 className="text-[38px] font-black leading-[0.9] tracking-[-0.06em] sm:text-5xl">
              Comece gratuitamente hoje.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-black/70">
              Até 100 reservas por mês grátis. Sem cartão de crédito. Quando o
              restaurante crescer, adicione Pro, Website, QR Ordering e as próximas
              ferramentas do ecossistema MesaLink.
            </p>

            <Link
              href="/register"
              className="mt-7 inline-flex h-14 items-center justify-center rounded-full bg-black px-8 text-base font-black text-white hover:bg-black/90"
            >
              Criar conta grátis →
            </Link>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function PlanCard({
  plan,
}: {
  plan: {
    name: string;
    badge: string;
    price: string;
    suffix: string;
    description: string;
    features: string[];
    cta: string;
    href: string;
    highlighted: boolean;
    checkout: boolean;
  };
}) {
  return (
    <div
      className={
        plan.highlighted
          ? "relative overflow-hidden rounded-[36px] border border-cyan-300/35 bg-[#06111f] p-6 shadow-[0_0_100px_rgba(34,211,238,0.22)] sm:p-8"
          : "relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl sm:p-8"
      }
    >
      {plan.highlighted && (
        <div className="absolute -right-16 top-8 h-48 w-48 rounded-full bg-cyan-500/20 blur-[70px]" />
      )}

      <div className="relative">
        <span
          className={
            plan.highlighted
              ? "inline-flex rounded-full border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-200"
              : "inline-flex rounded-full border border-violet-300/25 bg-violet-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-violet-200"
          }
        >
          {plan.badge}
        </span>

        <h2 className="mt-5 text-3xl font-black tracking-[-0.05em]">
          {plan.name}
        </h2>

        <div className="mt-5 flex items-end gap-2">
          <span className="text-6xl font-black tracking-[-0.08em] text-cyan-300">
            {plan.price}
          </span>
          <span className="pb-2 text-sm font-bold text-slate-400">
            {plan.suffix}
          </span>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-slate-300">
          {plan.description}
        </p>

        <div className="mt-7 grid gap-3">
          {plan.features.map((feature) => (
            <div key={feature} className="flex gap-3 text-sm text-slate-300">
              <span className="text-cyan-300">✓</span>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div className="mt-8">
          {plan.checkout ? (
            <CheckoutButton />
          ) : (
            <Link
              href={plan.href}
              className="flex h-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-base font-black text-black shadow-[0_0_60px_rgba(96,165,250,0.35)] hover:opacity-90"
            >
              {plan.cta}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute left-1/2 top-[-180px] h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="absolute right-[-180px] top-[360px] h-[380px] w-[380px] rounded-full bg-violet-500/20 blur-[110px]" />
      <div className="absolute bottom-[-160px] left-[-140px] h-[360px] w-[360px] rounded-full bg-blue-500/20 blur-[100px]" />

      <div className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.07)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.18),transparent_35%),linear-gradient(to_bottom,#020617,#050816_40%,#020617)]" />
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-200">
      {children}
    </span>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center backdrop-blur">
      <p className="text-2xl font-black text-cyan-300">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function RoadmapCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-violet-300/15 bg-white/[0.04] p-6 backdrop-blur-2xl">
      <span className="inline-flex rounded-full border border-violet-300/25 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-violet-200">
        Em breve
      </span>

      <h3 className="mt-4 text-2xl font-black tracking-[-0.04em]">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

function FAQ({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <h3 className="font-black text-white">{question}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{answer}</p>
    </div>
  );
}
