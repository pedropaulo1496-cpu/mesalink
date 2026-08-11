import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, CircleAlert, Lightbulb, Scale } from "lucide-react";
import Footer from "@/components/Footer";
import SiteHeader from "@/components/SiteHeader";

const canonicalUrl = "https://mesalink.pt/guias/como-escolher-software-para-restaurantes";

export const metadata: Metadata = {
  title: "Como Escolher Software para Restaurantes: Guia 2026",
  description: "Guia prático para comparar software de restaurante: reservas, POS, QR, faturação, CRM, suporte, custos e integração. Saiba o que avaliar antes de escolher.",
  alternates: { canonical: canonicalUrl },
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title: "Como escolher software para restaurantes — Guia 2026",
    description: "Os critérios que realmente importam antes de escolher um sistema para o seu restaurante.",
    publishedTime: "2026-08-11T00:00:00+01:00",
  },
};

const criteria = [
  {
    title: "1. Comece pelos problemas da operação",
    text: "Antes de comparar listas de funcionalidades, identifique onde a equipa perde tempo ou informação: reservas espalhadas, erros nos pedidos, sala sem visibilidade, clientes que não regressam ou alterações de menu repetidas em vários sistemas. O melhor software é o que reduz os problemas que existem no seu restaurante — não o que apresenta a lista mais longa.",
  },
  {
    title: "2. Avalie se as áreas estão realmente integradas",
    text: "Ter reservas, menu QR e CRM no mesmo contrato não significa que os dados estejam ligados. Confirme se uma reserva cria ou atualiza o perfil do cliente, se a mesa acompanha o serviço, se uma visita pode originar um pedido de review e se o histórico ajuda a segmentar campanhas. A integração deve eliminar tarefas, não apenas juntar atalhos num painel.",
  },
  {
    title: "3. Calcule o custo total, não apenas a mensalidade",
    text: "Compare mensalidade, hardware obrigatório, instalação, formação, atualizações, suporte, SMS, integrações e comissões por reserva ou transação. Um preço base baixo pode crescer rapidamente quando o restaurante precisa de mesas adicionais, mais utilizadores ou funcionalidades essenciais.",
  },
  {
    title: "4. Teste o sistema durante um serviço real",
    text: "Uma demonstração mostra o percurso ideal; um turno revela a realidade. Teste o software no telemóvel e computador, simule alterações, receba uma reserva, abra uma mesa, envie um pedido e peça apoio. Observe quanto tempo demora a equipa a compreender as ações mais frequentes.",
  },
  {
    title: "5. Confirme faturação, pagamentos e requisitos fiscais",
    text: "Em Portugal, perceba claramente se a solução emite documentos fiscais, integra com software certificado ou se funciona apenas como sistema operacional. Confirme séries, IVA, SAF-T, ATCUD, suporte a NIF e o fluxo usado quando há devoluções ou correções. Esta distinção deve estar explícita antes da contratação.",
  },
  {
    title: "6. Proteja os dados e a continuidade do restaurante",
    text: "Pergunte como são feitos os acessos, backups e exportação de dados, quem pode consultar informação de clientes e o que acontece se a internet falhar. Verifique também permissões de marketing, RGPD e como pode recuperar os seus dados caso deixe o serviço.",
  },
  {
    title: "7. Escolha um parceiro capaz de acompanhar o crescimento",
    text: "O sistema deve funcionar hoje sem bloquear o próximo passo. Considere múltiplos restaurantes, novos canais, websites, marketing, relatórios, integrações e suporte. Uma boa plataforma evolui sem obrigar a reconstruir toda a operação sempre que o negócio muda.",
  },
];

const questions = [
  "Que tarefas manuais desaparecem quando o sistema entra em funcionamento?",
  "Reservas, mesas, pedidos e clientes partilham os mesmos dados?",
  "Qual é o custo mensal real com todos os extras necessários?",
  "Existe comissão por reserva, pedido ou pagamento?",
  "O cliente precisa de instalar alguma aplicação?",
  "Como funciona a faturação e a integração fiscal em Portugal?",
  "Consigo exportar menus, clientes e histórico se precisar?",
  "O suporte responde durante os horários críticos do restaurante?",
  "O website e o menu são compreensíveis por Google e pesquisas com IA?",
  "O sistema funciona bem no telemóvel da equipa?",
];

export default function GuidePage() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Como escolher software para restaurantes: guia prático 2026",
        description: "Critérios para comparar sistemas de gestão para restaurantes em Portugal.",
        datePublished: "2026-08-11",
        dateModified: "2026-08-11",
        inLanguage: "pt-PT",
        mainEntityOfPage: canonicalUrl,
        author: { "@id": "https://mesalink.pt/#organization" },
        publisher: { "@id": "https://mesalink.pt/#organization" },
        image: "https://mesalink.pt/icons/icon-512.png",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "MesaLink", item: "https://mesalink.pt" },
          { "@type": "ListItem", position: 2, name: "Software para restaurantes", item: "https://mesalink.pt/software-para-restaurantes" },
          { "@type": "ListItem", position: 3, name: "Como escolher software para restaurantes", item: canonicalUrl },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#F4ECDF] text-[#17130F]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }} />
      <SiteHeader />

      <article>
        <header className="px-5 pb-16 pt-16 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="mx-auto max-w-5xl">
            <nav aria-label="Breadcrumb" className="text-xs font-semibold text-[#7D6E5D]">
              <Link href="/">MesaLink</Link><span className="mx-2">/</span><Link href="/software-para-restaurantes">Software para restaurantes</Link><span className="mx-2">/</span><span>Guia</span>
            </nav>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">Guia prático · Atualizado em agosto de 2026</p>
            <h1 className="mt-5 text-5xl font-semibold leading-[0.9] tracking-[-0.07em] sm:text-7xl lg:text-[84px]">Como escolher software para restaurantes.</h1>
            <p className="mt-7 max-w-3xl text-xl leading-9 text-[#5C5348]">Um sistema acompanha centenas de decisões por dia. Este guia ajuda a comparar opções com critérios operacionais, comerciais e técnicos — antes de comprometer a equipa com a escolha errada.</p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-[#6B6258]">
              <span className="rounded-full border border-[#D8C5A5] bg-[#FFF9F0] px-4 py-2">Leitura: 8 minutos</span>
              <span className="rounded-full border border-[#D8C5A5] bg-[#FFF9F0] px-4 py-2">Para restaurantes em Portugal</span>
              <span className="rounded-full border border-[#D8C5A5] bg-[#FFF9F0] px-4 py-2">Sem jargão técnico</span>
            </div>
          </div>
        </header>

        <section className="px-5 pb-12 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
            <Summary icon={Scale} title="Compare o custo total" text="Inclua comissões, hardware, suporte e extras." />
            <Summary icon={Check} title="Teste num serviço real" text="Valide os fluxos que a equipa repete todos os dias." />
            <Summary icon={Lightbulb} title="Procure integração" text="Os dados devem atravessar reservas, sala e CRM." />
          </div>
        </section>

        <section className="px-5 py-12 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-4xl font-semibold tracking-[-0.06em]">Os 7 critérios de decisão</h2>
            <div className="mt-8 space-y-5">
              {criteria.map((criterion) => (
                <section key={criterion.title} className="rounded-[28px] border border-[#D8C5A5] bg-[#FFF9F0] p-6 sm:p-8">
                  <h3 className="text-2xl font-black tracking-[-0.04em]">{criterion.title}</h3>
                  <p className="mt-4 text-base leading-8 text-[#5C5348]">{criterion.text}</p>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-16 lg:px-8">
          <div className="mx-auto max-w-5xl rounded-[38px] bg-[#17130F] p-7 text-white sm:p-10">
            <div className="flex items-center gap-3 text-[#D7B267]"><CircleAlert /><p className="text-xs font-black uppercase tracking-[0.25em]">Checklist antes de assinar</p></div>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.06em]">10 perguntas para fazer numa demonstração</h2>
            <ol className="mt-8 grid gap-3 md:grid-cols-2">
              {questions.map((question, index) => (
                <li key={question} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-[#EADBC5]"><span className="font-black text-[#D7B267]">{index + 1}.</span>{question}</li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-5 py-16 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-4xl font-semibold tracking-[-0.06em]">Sistema especializado ou várias ferramentas?</h2>
            <p className="mt-5 text-base leading-8 text-[#5C5348]">Ferramentas especializadas podem ser adequadas quando o restaurante tem uma necessidade muito específica e processos maduros para integrar dados. Uma plataforma única tende a ser mais simples quando reservas, sala, pedidos, clientes, website e marketing precisam de trabalhar em conjunto. A decisão deve considerar a capacidade real da equipa para manter integrações e resolver falhas entre fornecedores.</p>
            <p className="mt-5 text-base leading-8 text-[#5C5348]">O MesaLink segue a abordagem integrada: <Link href="/sistema-reservas-restaurantes" className="font-black text-[#9B6F3B] underline underline-offset-4">reservas</Link>, <Link href="/qr-ordering-restaurantes" className="font-black text-[#9B6F3B] underline underline-offset-4">QR Ordering</Link>, <Link href="/website-para-restaurantes" className="font-black text-[#9B6F3B] underline underline-offset-4">website e visibilidade</Link> e <Link href="/marketing-para-restaurantes" className="font-black text-[#9B6F3B] underline underline-offset-4">CRM e marketing</Link> partilham o mesmo contexto.</p>
          </div>
        </section>
      </article>

      <section className="px-5 pb-20 pt-8 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[40px] bg-[#17130F] p-8 text-center text-white sm:p-12">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#D7B267]">Compare com o seu restaurante</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Teste os fluxos MesaLink durante 7 dias.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/68">Sem comissão por reserva. Planos desde 55€/mês + IVA.</p>
          <Link href="/register" className="mt-7 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#D7B267] px-8 font-black text-[#17130F]">Experimentar grátis <ArrowRight size={17} /></Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Summary({ icon: Icon, title, text }: { icon: typeof Scale; title: string; text: string }) {
  return <div className="rounded-[26px] border border-[#D8C5A5] bg-[#FFF9F0] p-5"><Icon size={21} className="text-[#9B6F3B]" /><h2 className="mt-4 font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-[#6B6258]">{text}</p></div>;
}
