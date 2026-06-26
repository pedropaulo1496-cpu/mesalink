import Footer from "@/components/Footer";
import Link from "next/link";

const plans = [
  {
    name: "Essentials",
    badge: "7 dias grátis",
    price: "55€",
    yearlyPrice: "605€",
    saving: "55€",
    description:
      "Para restaurantes que querem centralizar reservas, website, QR Ordering, CRM, reviews e operação num único sistema.",
    features: [
      "Mais reservas diretas",
      "Website premium incluído",
      "QR Ordering incluído",
      "CRM de clientes",
      "Google Reviews",
      "Mapa de mesas",
      "Relatórios essenciais",
      "Sem comissões por reserva",
    ],
    href: "/register",
    highlighted: false,
  },
  {
    name: "Growth",
    badge: "Mais recomendado",
    price: "75€",
    yearlyPrice: "825€",
    saving: "75€",
    description:
      "Para restaurantes que querem recuperar clientes, promover dias fracos e aumentar visitas recorrentes com Marketing.",
    features: [
      "Tudo do Essentials",
      "Marketing MesaLink incluído",
      "Recuperar clientes inativos",
      "Campanhas para dias fracos",
      "Clientes em risco",
      "Aniversários automáticos",
      "Fidelização VIP",
      "Mais visitas recorrentes",
    ],
    href: "/register",
    highlighted: true,
  },
];

const comparison = [
  ["Website + SEO", "Fornecedor separado", "Incluído"],
  ["Reservas", "Sistema isolado", "Incluído"],
  ["QR Ordering", "Add-on separado", "Incluído"],
  ["CRM", "Folhas ou ferramenta externa", "Incluído"],
  ["Marketing", "Campanhas manuais", "Growth"],
  ["Reviews", "Sem processo claro", "Incluído"],
  ["Faturação fiscal", "Software certificado externo", "Moloni"],
];

const faqs = [
  {
    question: "Existe período grátis?",
    answer:
      "Sim. Pode experimentar todas as funcionalidades durante 7 dias antes de escolher o plano.",
  },
  {
    question: "O pagamento anual tem desconto?",
    answer:
      "Sim. No pagamento anual recebe 1 mês grátis: Essentials fica 605€/ano e Growth fica 825€/ano, sem IVA.",
  },
  {
    question: "Qual é a diferença do Growth?",
    answer:
      "O Growth adiciona Marketing para recuperar clientes, promover dias fracos e aumentar visitas recorrentes.",
  },
  {
    question: "Há comissões por reserva?",
    answer: "Não. A MesaLink não cobra comissão por reserva.",
  },
  {
    question: "E a faturação/POS fiscal?",
    answer:
      "A faturação fiscal é tratada externamente pelo Moloni ou outro software certificado. Esse custo não é cobrado pela MesaLink.",
  },
  {
    question: "Posso cancelar?",
    answer: "Sim. Pode cancelar quando quiser.",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F4ECDF] text-[#17130F]">
      <header className="border-b border-[#DECDB4] bg-[#F4ECDF]/86 px-5 py-5 backdrop-blur-xl lg:px-8">
        <nav className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-2xl font-semibold tracking-[-0.045em]">
            <span className="text-[#C8A56A]">Mesa</span>
            <span className="text-[#17130F]">Link</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-[#D8C5A5] bg-[#FFF9F0] px-5 py-2.5 text-sm font-semibold text-[#5C5348] transition hover:bg-white hover:text-[#17130F]"
            >
              Entrar
            </Link>

            <Link
              href="/register"
              className="hidden rounded-full bg-[#17130F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2A2118] sm:inline-flex"
            >
              Começar
            </Link>
          </div>
        </nav>
      </header>

      <section className="px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <Badge>Growth. Visibility. Control.</Badge>

            <h1 className="mt-6 text-[46px] font-semibold leading-[0.9] tracking-[-0.075em] sm:text-6xl lg:text-7xl">
              Escolha a plataforma certa para
              <span className="block text-[#C8A56A]">
                fazer crescer o restaurante.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#5C5348]">
              Atraia mais clientes, aumente a receita e simplifique a operação
              com reservas, website, QR Ordering, CRM e Marketing integrados.
            </p>

            <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              <HeroStat value="7 dias" label="trial completo" />
              <HeroStat value="1 mês" label="grátis no anual" />
              <HeroStat value="0€" label="comissões" />
            </div>
          </div>

          <section className="mt-12 grid gap-5 lg:grid-cols-2">
            {plans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </section>

          <section className="mt-12 overflow-hidden rounded-[38px] border border-[#D8C5A5] bg-[#FFF9F0] shadow-[0_30px_110px_rgba(80,55,30,0.10)]">
            <div className="p-6 sm:p-8">
              <Badge>Porque MesaLink?</Badge>

              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.055em] sm:text-5xl">
                Menos sistemas separados. Mais crescimento.
              </h2>

              <p className="mt-4 max-w-2xl text-[#6B6258]">
                A MesaLink junta descoberta, reservas, QR Ordering, CRM,
                Marketing e reviews para aumentar receita, visibilidade e
                controlo.
              </p>
            </div>

            <div className="grid grid-cols-3 border-y border-[#E5D6C1] bg-white/50 p-4 text-xs font-black uppercase tracking-[0.16em] text-[#9B6F3B] sm:text-sm">
              <div>Necessidade</div>
              <div>Tradicional</div>
              <div>MesaLink</div>
            </div>

            {comparison.map(([need, traditional, mesalink]) => (
              <div
                key={need}
                className="grid grid-cols-3 border-b border-[#E5D6C1] p-4 text-sm last:border-b-0 sm:p-5 sm:text-base"
              >
                <div className="font-semibold text-[#17130F]">{need}</div>
                <div className="text-[#6B6258]">{traditional}</div>
                <div className="font-semibold text-[#9B6F3B]">{mesalink}</div>
              </div>
            ))}
          </section>

          <section className="mt-12 rounded-[38px] border border-[#D8C5A5] bg-white p-6 shadow-[0_22px_70px_rgba(80,55,30,0.055)] sm:p-8">
            <Badge>FAQ</Badge>

            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
              Perguntas rápidas.
            </h2>

            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {faqs.map((faq) => (
                <FAQ key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </section>

          <section className="mt-12 overflow-hidden rounded-[40px] bg-[#17130F] p-7 text-white shadow-[0_35px_120px_rgba(34,26,19,0.22)] sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#D8C5A5]">
              Comece hoje
            </p>

            <h2 className="mt-4 text-[40px] font-semibold leading-[0.92] tracking-[-0.065em] sm:text-5xl">
              Teste tudo durante 7 dias.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/68">
              Experimente todas as funcionalidades antes de escolher plano. No
              pagamento anual, recebe 1 mês grátis.
            </p>

            <Link
              href="/register"
              className="mt-7 inline-flex h-14 items-center justify-center rounded-full bg-[#D8C5A5] px-8 text-base font-semibold text-[#17130F] transition hover:bg-[#E8D6B8]"
            >
              Começar teste gratuito →
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
    yearlyPrice: string;
    saving: string;
    description: string;
    features: string[];
    href: string;
    highlighted: boolean;
  };
}) {
  return (
    <div
      className={`relative flex min-h-[650px] flex-col overflow-hidden rounded-[38px] border p-8 shadow-[0_24px_80px_rgba(80,55,30,0.08)] ${
        plan.highlighted
          ? "border-[#2C2117] bg-[#17130F] text-white"
          : "border-[#D8C5A5] bg-white text-[#16120E]"
      }`}
    >
      {plan.highlighted && (
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#C8A56A]/16 blur-[80px]" />
      )}

      <div className="relative flex h-full flex-col">
        <div className="flex min-h-[94px] items-start justify-between gap-4">
          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.28em] ${
                plan.highlighted ? "text-[#D8C5A5]" : "text-[#9B6F3B]"
              }`}
            >
              MesaLink
            </p>

            <h2 className="mt-3 text-5xl font-semibold tracking-[-0.07em]">
              {plan.name}
            </h2>
          </div>

          <span
            className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${
              plan.highlighted
                ? "border-[#D8C5A5]/30 bg-[#F4E9D5] text-[#17130F]"
                : "border-[#D8C5A5] bg-[#FFF9F0] text-[#9B6F3B]"
            }`}
          >
            {plan.badge}
          </span>
        </div>

        <p
          className={`mt-5 min-h-[72px] text-sm leading-7 ${
            plan.highlighted ? "text-white/68" : "text-[#6B6258]"
          }`}
        >
          {plan.description}
        </p>

        <div className="mt-6 flex items-end gap-2">
          <span className="text-7xl font-semibold tracking-[-0.08em]">
            {plan.price}
          </span>
          <span
            className={`mb-3 text-sm ${
              plan.highlighted ? "text-white/62" : "text-[#6B6258]"
            }`}
          >
            /mês
          </span>
        </div>

        <div
          className={`mt-5 rounded-[24px] px-5 py-4 text-sm ${
            plan.highlighted
              ? "border border-white/10 bg-white/[0.07] text-white/76"
              : "border border-[#D8C5A5] bg-[#FFF9F0] text-[#6B6258]"
          }`}
        >
          <p
            className={
              plan.highlighted
                ? "font-semibold text-[#D8C5A5]"
                : "font-semibold text-[#9B6F3B]"
            }
          >
            Pagamento anual
          </p>

          <p className="mt-1 text-xs">
            <span
              className={
                plan.highlighted ? "font-black text-white" : "font-black text-[#16120E]"
              }
            >
              {plan.yearlyPrice}/ano
            </span>{" "}
            · 1 mês grátis · poupa {plan.saving}
          </p>
        </div>

        <ul className="mt-7 grid gap-3 sm:grid-cols-2">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className={`flex gap-2 text-sm leading-6 ${
                plan.highlighted ? "text-white/84" : "text-[#4F463B]"
              }`}
            >
              <span className={plan.highlighted ? "text-[#D8C5A5]" : "text-[#9B6F3B]"}>
                ✓
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto grid gap-2 pt-8 sm:grid-cols-2">
          <Link
            href={plan.href}
            className={`flex h-14 w-full items-center justify-center rounded-full px-5 text-sm font-semibold transition ${
              plan.highlighted
                ? "bg-[#D8C5A5] text-[#17130F] hover:bg-[#E8D6B8]"
                : "bg-[#17130F] text-white hover:bg-[#2A2118]"
            }`}
          >
            Começar mensal →
          </Link>

          <Link
            href={`${plan.href}?billing=yearly&plan=${plan.name.toLowerCase()}`}
            className={`flex h-14 w-full items-center justify-center rounded-full border px-5 text-sm font-semibold transition ${
              plan.highlighted
                ? "border-[#D8C5A5]/45 bg-white/[0.06] text-[#D8C5A5] hover:bg-white/[0.10]"
                : "border-[#D8C5A5] bg-[#FFF9F0] text-[#9B6F3B] hover:bg-white"
            }`}
          >
            Começar anual →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-[#D8C5A5] bg-[#FFF9F0] px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#9B6F3B]">
      {children}
    </span>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#D8C5A5] bg-[#FFF9F0] p-4 text-center">
      <p className="text-2xl font-semibold tracking-[-0.055em] text-[#17130F]">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9B6F3B]">
        {label}
      </p>
    </div>
  );
}

function FAQ({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-2xl border border-[#E5D6C1] bg-[#FFF9F0] p-5">
      <h3 className="font-semibold text-[#17130F]">{question}</h3>
      <p className="mt-2 text-sm leading-6 text-[#6B6258]">{answer}</p>
    </div>
  );
}
