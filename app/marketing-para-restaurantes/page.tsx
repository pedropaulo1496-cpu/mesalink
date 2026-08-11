import type { Metadata } from "next";
import { CakeSlice, ChartNoAxesCombined, Mail, MessageSquareMore, Star, UserRoundCheck } from "lucide-react";
import RestaurantSolutionPage, { type SolutionPageContent } from "@/components/seo/RestaurantSolutionPage";

export const metadata: Metadata = {
  title: "CRM e Marketing para Restaurantes: Fidelização e Reviews",
  description: "CRM e marketing para restaurantes com recuperação de clientes, aniversários, campanhas, fidelização VIP, Google Reviews e medição de resultados.",
  alternates: { canonical: "https://mesalink.pt/marketing-para-restaurantes" },
  openGraph: { url: "https://mesalink.pt/marketing-para-restaurantes", title: "CRM e Marketing para Restaurantes — MesaLink", description: "Transforme reservas e visitas em relações que fazem os clientes voltar." },
};

const content: SolutionPageContent = {
  path: "/marketing-para-restaurantes",
  eyebrow: "CRM, fidelização e reputação",
  title: "Marketing para restaurantes",
  accent: "baseado em clientes reais.",
  schemaName: "MesaLink CRM & Marketing",
  intro: "Use o histórico de reservas e visitas para comunicar com mais relevância, recuperar clientes inativos, reconhecer clientes fiéis e gerar mais reviews positivas.",
  painTitle: "Atrair um cliente custa demasiado para perder a relação depois da visita.",
  pains: [
    "Os contactos ficam espalhados e sem histórico útil.",
    "Campanhas iguais para todos geram pouca relevância.",
    "Clientes habituais deixam de voltar sem que a equipa perceba a tempo.",
    "Boas experiências nem sempre se transformam em reviews públicas.",
  ],
  featuresTitle: "Do histórico do cliente à próxima visita.",
  features: [
    { icon: UserRoundCheck, title: "CRM de restaurante", text: "Organize visitas, reservas, frequência e sinais de relacionamento num perfil único." },
    { icon: MessageSquareMore, title: "Recuperação de inativos", text: "Identifique clientes que deixaram de aparecer e crie uma razão relevante para regressarem." },
    { icon: CakeSlice, title: "Aniversários", text: "Prepare comunicações e ofertas para momentos em que o cliente tem maior intenção de celebrar." },
    { icon: Mail, title: "Campanhas segmentadas", text: "Escolha audiências com base na relação real em vez de enviar a mesma mensagem para todos." },
    { icon: Star, title: "Google Reviews", text: "Recolha feedback e encaminhe experiências positivas para reforçar a reputação online." },
    { icon: ChartNoAxesCombined, title: "Resultados e receita", text: "Acompanhe ações, conversões e receita estimada para perceber o que merece ser repetido." },
  ],
  outcomesTitle: "Mais valor por cliente conquistado.",
  outcomes: [
    { title: "Mais visitas recorrentes", text: "A relação continua depois da primeira reserva ou passagem pelo restaurante." },
    { title: "Comunicação relevante", text: "Segmentos e contexto substituem mensagens genéricas sem propósito." },
    { title: "Reputação mais forte", text: "O processo de feedback ajuda a transformar satisfação em prova pública." },
    { title: "Decisões mensuráveis", text: "O painel aproxima campanhas, conversões e impacto comercial." },
  ],
  faq: [
    { question: "De onde vêm os clientes no CRM?", answer: "Os perfis podem ser construídos a partir das reservas, visitas e interações registadas no MesaLink, respeitando as permissões de marketing aplicáveis." },
    { question: "Posso recuperar clientes que deixaram de visitar?", answer: "Sim. O MesaLink permite identificar inatividade e preparar ações específicas para incentivar uma nova visita." },
    { question: "Como funciona a gestão de Google Reviews?", answer: "O restaurante pode recolher feedback após a experiência e encaminhar clientes satisfeitos para o perfil Google configurado." },
    { question: "Consigo medir o resultado das campanhas?", answer: "O painel acompanha ações e conversões associadas para ajudar a estimar receita e perceber quais iniciativas funcionam melhor." },
  ],
  related: [
    { href: "/software-para-restaurantes", label: "Software para restaurantes" },
    { href: "/sistema-reservas-restaurantes", label: "Sistema de reservas" },
    { href: "/qr-ordering-restaurantes", label: "QR Ordering" },
    { href: "/website-para-restaurantes", label: "Website e SEO" },
  ],
};

export default function Page() { return <RestaurantSolutionPage content={content} />; }
