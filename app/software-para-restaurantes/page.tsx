import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Check,
  Globe2,
  Megaphone,
  QrCode,
  Sparkles,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import Footer from "@/components/Footer";
import SiteHeader from "@/components/SiteHeader";

const canonicalUrl = "https://www.mesalink.pt/software-para-restaurantes";

export const metadata: Metadata = {
  title: "Software para Restaurantes: Reservas, POS, QR e Marketing",
  description:
    "Software de gestão para restaurantes com reservas sem comissões, POS, QR Ordering, mapa de mesas, website, CRM, marketing e reviews. Teste o MesaLink grátis.",
  alternates: { canonical: canonicalUrl },
  openGraph: {
    url: canonicalUrl,
    title: "Software para Restaurantes — MesaLink",
    description:
      "Uma plataforma para gerir reservas, sala, pedidos, clientes, website, marketing e crescimento do restaurante.",
  },
};

const capabilities = [
  {
    href: "/sistema-reservas-restaurantes",
    icon: CalendarCheck,
    title: "Reservas online sem comissões",
    text: "Receba reservas diretas pelo website, Google, Instagram ou link próprio e organize tudo num calendário central.",
  },
  {
    href: "/software-para-restaurantes",
    icon: UtensilsCrossed,
    title: "POS e operação de sala",
    text: "Acompanhe mesas, pedidos, pagamentos e serviço num sistema criado para a realidade diária da restauração.",
  },
  {
    href: "/qr-ordering-restaurantes",
    icon: QrCode,
    title: "Menu digital e QR Ordering",
    text: "Os clientes consultam o menu, fazem pedidos, chamam o empregado e pedem a conta diretamente da mesa.",
  },
  {
    href: "/website-para-restaurantes",
    icon: Globe2,
    title: "Website para restaurantes",
    text: "Publique um website rápido com menu, reservas, domínio próprio e conteúdo preparado para Google e pesquisas por IA.",
  },
  {
    href: "/marketing-para-restaurantes",
    icon: Users,
    title: "CRM de clientes",
    text: "Transforme reservas e visitas em perfis úteis para conhecer clientes habituais, preferências e risco de abandono.",
  },
  {
    href: "/marketing-para-restaurantes",
    icon: Megaphone,
    title: "Marketing e fidelização",
    text: "Recupere clientes inativos, automatize aniversários, promova dias fracos e acompanhe resultados das campanhas.",
  },
];

const faqs = [
  {
    question: "O que é um software de gestão para restaurantes?",
    answer:
      "É uma plataforma que centraliza tarefas como reservas, gestão de mesas, pedidos, pagamentos, clientes, website e marketing. O MesaLink liga estas áreas para evitar sistemas separados e trabalho manual repetido.",
  },
  {
    question: "O MesaLink cobra comissão pelas reservas?",
    answer:
      "Não. As reservas recebidas diretamente através das páginas e links MesaLink não têm comissão por cliente ou por reserva.",
  },
  {
    question: "É possível receber pedidos através de QR Code?",
    answer:
      "Sim. O QR Ordering permite consultar o menu, pedir da mesa, chamar o empregado e solicitar a conta. A equipa acompanha os pedidos no painel do restaurante.",
  },
  {
    question: "O MesaLink ajuda o restaurante a aparecer no Google?",
    answer:
      "O Website Builder, os dados do negócio, o menu estruturado, as reviews e o módulo AI Visibility ajudam a criar uma presença digital que os motores de pesquisa conseguem compreender. O posicionamento final depende também da concorrência, reputação e autoridade externa.",
  },
  {
    question: "Posso experimentar antes de escolher um plano?",
    answer:
      "Sim. O MesaLink disponibiliza um período de teste gratuito de 7 dias para explorar as funcionalidades antes da subscrição.",
  },
];

export default function SoftwareParaRestaurantesPage() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MesaLink",
    url: canonicalUrl,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Restaurant Management Software",
    operatingSystem: "Web, Android",
    description:
      "Software de gestão para restaurantes com reservas, POS, QR Ordering, mapa de mesas, website, CRM, marketing e reviews.",
    publisher: { "@id": "https://www.mesalink.pt/#organization" },
    offers: [
      { "@type": "Offer", name: "MesaLink Essentials", price: "55", priceCurrency: "EUR", url: "https://www.mesalink.pt/pricing" },
      { "@type": "Offer", name: "MesaLink Growth", price: "75", priceCurrency: "EUR", url: "https://www.mesalink.pt/pricing" },
    ],
    featureList: capabilities.map((item) => item.title),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "MesaLink", item: "https://www.mesalink.pt" },
      { "@type": "ListItem", position: 2, name: "Software para restaurantes", item: canonicalUrl },
    ],
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#F4ECDF] text-[#17130F]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([softwareSchema, breadcrumbSchema]).replace(/</g, "\\u003c"),
        }}
      />
      <SiteHeader />

      <section className="relative px-5 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="absolute inset-x-0 top-0 -z-0 h-[540px] bg-[radial-gradient(circle_at_72%_20%,rgba(200,165,106,0.26),transparent_38%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full border border-[#D8C5A5] bg-[#FFF9F0] px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#9B6F3B]">
              Software de gestão para restauração
            </span>
            <h1 className="mt-6 text-[50px] font-semibold leading-[0.88] tracking-[-0.075em] sm:text-7xl lg:text-[82px]">
              Software para restaurantes.
              <span className="block text-[#C8A56A]">Tudo ligado.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5C5348] lg:text-xl">
              O MesaLink reúne reservas, POS, QR Ordering, mapa de mesas, website, CRM, reviews e marketing numa plataforma criada para gerir e fazer crescer restaurantes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#17130F] px-8 font-semibold text-white shadow-[0_24px_70px_rgba(80,55,30,0.22)] transition hover:bg-[#2A2118]">
                Experimentar grátis <ArrowRight size={17} />
              </Link>
              <Link href="/contact" className="inline-flex h-14 items-center justify-center rounded-full border border-[#B9965E] bg-[#FFF9F0] px-8 font-semibold transition hover:bg-white">
                Pedir demonstração
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-[#5C5348]">
              <span className="flex items-center gap-2"><Check size={15} className="text-[#9B6F3B]" /> 7 dias grátis</span>
              <span className="flex items-center gap-2"><Check size={15} className="text-[#9B6F3B]" /> 0€ por reserva</span>
              <span className="flex items-center gap-2"><Check size={15} className="text-[#9B6F3B]" /> Planos desde 55€/mês + IVA</span>
              <span className="flex items-center gap-2"><Check size={15} className="text-[#9B6F3B]" /> Funciona no telemóvel</span>
            </div>
          </div>

          <div className="rounded-[42px] border border-[#D6BE94] bg-[#FFF9F0] p-4 shadow-[0_42px_130px_rgba(71,47,24,0.2)]">
            <div className="rounded-[33px] bg-[#17130F] p-7 text-white sm:p-9">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#D7B267]">Restaurant OS</p>
              <h2 className="mt-4 text-4xl font-semibold leading-[0.94] tracking-[-0.06em]">Da reserva à próxima visita.</h2>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {["Reservas", "Sala & POS", "QR Ordering", "Website & SEO", "CRM", "Marketing"].map((label, index) => (
                  <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm font-semibold">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#D7B267] text-xs font-black text-[#17130F]">{index + 1}</span>
                    {label}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-[#D7B267]/30 bg-[#D7B267]/10 p-4 text-sm leading-6 text-[#EADBC5]">
                Um único perfil de cliente liga reservas, pedidos, visitas, reviews e campanhas.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">Plataforma completa</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-6xl">As ferramentas essenciais para gerir um restaurante.</h2>
            <p className="mt-5 text-lg leading-8 text-[#5C5348]">Em vez de alternar entre aplicações isoladas, a informação acompanha o cliente e a operação dentro do MesaLink.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {capabilities.map(({ href, icon: Icon, title, text }) => (
              <Link href={href} key={title} className="group rounded-[30px] border border-[#D8C5A5] bg-[#FFF9F0] p-6 shadow-[0_20px_65px_rgba(80,55,30,0.06)] transition hover:-translate-y-1 hover:shadow-[0_26px_75px_rgba(80,55,30,0.11)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#17130F] text-[#D7B267]"><Icon size={21} /></span>
                <h3 className="mt-5 text-xl font-black tracking-[-0.035em]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#6B6258]">{text}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-black text-[#9B6F3B]">Saber mais <ArrowRight size={15} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[38px] bg-[#17130F] p-7 text-white sm:p-9">
            <Sparkles className="text-[#D7B267]" />
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.06em]">Mais do que software de reservas.</h2>
            <p className="mt-5 text-base leading-7 text-white/68">O MesaLink liga aquisição, operação e fidelização. Cada reserva pode melhorar o serviço de hoje e alimentar o crescimento de amanhã.</p>
            <ul className="mt-7 space-y-4 text-sm text-[#EADBC5]">
              <li className="flex gap-3"><BarChart3 size={18} className="shrink-0 text-[#D7B267]" /> Dados operacionais e comerciais no mesmo painel.</li>
              <li className="flex gap-3"><Users size={18} className="shrink-0 text-[#D7B267]" /> Histórico de cliente construído a partir de visitas reais.</li>
              <li className="flex gap-3"><Globe2 size={18} className="shrink-0 text-[#D7B267]" /> Presença digital preparada para Google e pesquisa com IA.</li>
            </ul>
          </div>
          <div className="rounded-[38px] border border-[#D8C5A5] bg-white p-7 sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">Para quem é</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em]">Criado para diferentes modelos de restauração.</h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {["Restaurantes independentes", "Grupos de restauração", "Cafés e pastelarias", "Bares e espaços com mesas", "Fine dining", "Restaurantes com takeaway"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#FFF9F0] p-4 text-sm font-semibold"><Check size={16} className="text-[#9B6F3B]" />{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <Link href="/guias/como-escolher-software-para-restaurantes" className="mb-12 flex flex-col justify-between gap-5 rounded-[30px] border border-[#D8C5A5] bg-white p-6 shadow-[0_20px_65px_rgba(80,55,30,0.06)] transition hover:-translate-y-0.5 sm:flex-row sm:items-center sm:p-8">
            <div><p className="text-xs font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Guia prático 2026</p><h2 className="mt-3 text-2xl font-black tracking-[-0.04em]">Como escolher software para restaurantes</h2><p className="mt-2 text-sm leading-6 text-[#6B6258]">7 critérios e 10 perguntas para comparar sistemas antes de contratar.</p></div>
            <span className="inline-flex shrink-0 items-center gap-2 font-black text-[#9B6F3B]">Ler o guia <ArrowRight size={17} /></span>
          </Link>
          <p className="text-center text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">Perguntas frequentes</p>
          <h2 className="mt-4 text-center text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Software para restaurantes, sem complicações.</h2>
          <div className="mt-9 grid gap-3">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-[25px] border border-[#D8C5A5] bg-[#FFF9F0] p-6">
                <h3 className="text-lg font-black">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6B6258]">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 pt-10 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[42px] bg-[#17130F] p-8 text-center text-white shadow-[0_35px_120px_rgba(34,26,19,0.22)] sm:p-12">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#D7B267]">Comece sem compromisso</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-6xl">Veja o MesaLink a trabalhar no seu restaurante.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/68">Experimente durante 7 dias e descubra como reservas, operação e crescimento funcionam quando estão ligados.</p>
          <Link href="/register" className="mt-7 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#D7B267] px-8 font-black text-[#17130F] transition hover:bg-[#E3C98F]">Começar teste gratuito <ArrowRight size={17} /></Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
