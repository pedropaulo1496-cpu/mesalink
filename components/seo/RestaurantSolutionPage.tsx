import type { LucideIcon } from "lucide-react";
import { ArrowRight, Check, CircleCheckBig } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";
import SiteHeader from "@/components/SiteHeader";

export type SolutionPageContent = {
  path: string;
  eyebrow: string;
  title: string;
  accent: string;
  intro: string;
  schemaName: string;
  painTitle: string;
  pains: string[];
  featuresTitle: string;
  features: Array<{ icon: LucideIcon; title: string; text: string }>;
  outcomesTitle: string;
  outcomes: Array<{ title: string; text: string }>;
  faq: Array<{ question: string; answer: string }>;
  related: Array<{ href: string; label: string }>;
};

export default function RestaurantSolutionPage({ content }: { content: SolutionPageContent }) {
  const canonicalUrl = `https://mesalink.pt${content.path}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: content.schemaName,
        url: canonicalUrl,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Restaurant Management Software",
        operatingSystem: "Web, Android",
        description: content.intro,
        publisher: { "@id": "https://mesalink.pt/#organization" },
        offers: { "@type": "Offer", price: "55", priceCurrency: "EUR", url: "https://mesalink.pt/pricing" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "MesaLink", item: "https://mesalink.pt" },
          { "@type": "ListItem", position: 2, name: "Software para restaurantes", item: "https://mesalink.pt/software-para-restaurantes" },
          { "@type": "ListItem", position: 3, name: content.schemaName, item: canonicalUrl },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: content.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#F4ECDF] text-[#17130F]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <SiteHeader />

      <section className="relative px-5 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_72%_22%,rgba(200,165,106,0.25),transparent_38%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <div>
            <nav aria-label="Breadcrumb" className="text-xs font-semibold text-[#7D6E5D]">
              <Link href="/" className="hover:text-[#17130F]">MesaLink</Link>
              <span className="mx-2">/</span>
              <Link href="/software-para-restaurantes" className="hover:text-[#17130F]">Software para restaurantes</Link>
            </nav>
            <p className="mt-7 text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">{content.eyebrow}</p>
            <h1 className="mt-5 text-[48px] font-semibold leading-[0.88] tracking-[-0.075em] sm:text-7xl lg:text-[78px]">
              {content.title}
              <span className="block text-[#C8A56A]">{content.accent}</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5C5348]">{content.intro}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#17130F] px-8 font-semibold text-white shadow-[0_24px_70px_rgba(80,55,30,0.22)] transition hover:bg-[#2A2118]">
                Experimentar 7 dias grátis <ArrowRight size={17} />
              </Link>
              <Link href="/contact" className="inline-flex h-14 items-center justify-center rounded-full border border-[#B9965E] bg-[#FFF9F0] px-8 font-semibold transition hover:bg-white">Pedir demonstração</Link>
            </div>
            <p className="mt-4 text-sm font-semibold text-[#7D6E5D]">Planos desde 55€/mês + IVA · sem comissão por reserva</p>
          </div>

          <div className="rounded-[40px] border border-[#D6BE94] bg-[#FFF9F0] p-4 shadow-[0_42px_130px_rgba(71,47,24,0.18)]">
            <div className="rounded-[31px] bg-[#17130F] p-7 text-white sm:p-9">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#D7B267]">O problema</p>
              <h2 className="mt-4 text-3xl font-semibold leading-[0.96] tracking-[-0.055em]">{content.painTitle}</h2>
              <div className="mt-7 space-y-3">
                {content.pains.map((pain) => (
                  <div key={pain} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-[#EADBC5]">
                    <CircleCheckBig size={18} className="mt-0.5 shrink-0 text-[#D7B267]" />{pain}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">Como funciona</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-6xl">{content.featuresTitle}</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {content.features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-[30px] border border-[#D8C5A5] bg-[#FFF9F0] p-6 shadow-[0_20px_65px_rgba(80,55,30,0.06)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#17130F] text-[#D7B267]"><Icon size={21} /></span>
                <h3 className="mt-5 text-xl font-black tracking-[-0.035em]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#6B6258]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl rounded-[40px] border border-[#D8C5A5] bg-white p-7 sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">Impacto no restaurante</p>
              <h2 className="mt-4 text-4xl font-semibold leading-[0.96] tracking-[-0.06em]">{content.outcomesTitle}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {content.outcomes.map((outcome) => (
                <article key={outcome.title} className="rounded-[24px] bg-[#FFF9F0] p-5">
                  <h3 className="flex items-center gap-2 font-black"><Check size={16} className="text-[#9B6F3B]" />{outcome.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6B6258]">{outcome.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">Perguntas frequentes</p>
          <h2 className="mt-4 text-center text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Respostas claras antes de começar.</h2>
          <div className="mt-9 grid gap-3">
            {content.faq.map((faq) => (
              <article key={faq.question} className="rounded-[25px] border border-[#D8C5A5] bg-[#FFF9F0] p-6">
                <h3 className="text-lg font-black">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6B6258]">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-8 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[30px] border border-[#D8C5A5] bg-[#FFF9F0] p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9B6F3B]">Explore outras soluções MesaLink</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {content.related.map((item) => <Link key={item.href} href={item.href} className="rounded-full border border-[#D8C5A5] bg-white px-4 py-2 text-sm font-semibold transition hover:border-[#9B6F3B]">{item.label}</Link>)}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 pt-10 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[42px] bg-[#17130F] p-8 text-center text-white sm:p-12">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#D7B267]">MesaLink Restaurant OS</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-6xl">Tudo o que o restaurante precisa. Um só sistema.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/68">Comece gratuitamente e veja a operação, os clientes e o crescimento a trabalhar em conjunto.</p>
          <Link href="/register" className="mt-7 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#D7B267] px-8 font-black text-[#17130F] transition hover:bg-[#E3C98F]">Começar agora <ArrowRight size={17} /></Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
