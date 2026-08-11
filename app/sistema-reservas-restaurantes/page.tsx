import type { Metadata } from "next";
import { BellRing, CalendarDays, Clock3, MailCheck, TableProperties, Users } from "lucide-react";
import RestaurantSolutionPage, { type SolutionPageContent } from "@/components/seo/RestaurantSolutionPage";

export const metadata: Metadata = {
  title: "Sistema de Reservas para Restaurantes sem Comissões",
  description: "Sistema de reservas para restaurantes com calendário, mapa de mesas, confirmações, clientes e reservas online 24/7 sem comissão. Experimente o MesaLink.",
  alternates: { canonical: "https://mesalink.pt/sistema-reservas-restaurantes" },
  openGraph: { url: "https://mesalink.pt/sistema-reservas-restaurantes", title: "Sistema de Reservas para Restaurantes — MesaLink", description: "Reservas diretas, mesas, confirmações e clientes num único sistema, sem comissão por reserva." },
};

const content: SolutionPageContent = {
  path: "/sistema-reservas-restaurantes",
  eyebrow: "Reservas online para restaurantes",
  title: "Sistema de reservas",
  accent: "sem comissões.",
  schemaName: "MesaLink Reservas",
  intro: "Receba reservas online 24 horas por dia, organize turnos e mesas e mantenha a equipa sincronizada. O MesaLink centraliza reservas diretas sem cobrar por cada cliente.",
  painTitle: "Telefonemas, mensagens e agendas separadas criam erros evitáveis.",
  pains: [
    "Reservas chegam por canais diferentes e ficam difíceis de confirmar.",
    "A capacidade real da sala nem sempre acompanha a agenda.",
    "A equipa perde tempo a responder às mesmas perguntas por telefone.",
    "Os dados dos clientes desaparecem depois da visita.",
  ],
  featuresTitle: "Reservas diretas ligadas à sala e ao histórico do cliente.",
  features: [
    { icon: CalendarDays, title: "Calendário central", text: "Consulte reservas do dia, semana e próximos serviços num painel acessível à equipa." },
    { icon: TableProperties, title: "Mapa de mesas", text: "Associe reservas a mesas, acompanhe ocupação e adapte a sala ao serviço real." },
    { icon: Clock3, title: "Horários e capacidade", text: "Defina dias de abertura, turnos e limites para receber pedidos de reserva de forma controlada." },
    { icon: MailCheck, title: "Confirmações automáticas", text: "O cliente recebe a informação da reserva sem obrigar a equipa a escrever cada mensagem." },
    { icon: Users, title: "Perfil de cliente", text: "Cada reserva contribui para um histórico útil de visitas, preferências e relacionamento." },
    { icon: BellRing, title: "Operação em tempo real", text: "A equipa acompanha novas reservas e alterações no mesmo local onde gere o serviço." },
  ],
  outcomesTitle: "Mais controlo antes de abrir a porta.",
  outcomes: [
    { title: "Menos trabalho manual", text: "O cliente reserva sozinho e recebe a informação essencial automaticamente." },
    { title: "Sem comissão", text: "As reservas diretas MesaLink não geram uma taxa por pessoa ou por marcação." },
    { title: "Sala mais organizada", text: "Reservas e mesas partilham o mesmo contexto operacional." },
    { title: "Clientes que não se perdem", text: "O histórico alimenta CRM, reviews e campanhas de regresso." },
  ],
  faq: [
    { question: "Quanto custa cada reserva no MesaLink?", answer: "O MesaLink não cobra comissão por reserva direta. O restaurante paga o plano da plataforma, sem uma taxa variável por cliente reservado." },
    { question: "Posso receber reservas pelo meu website e Instagram?", answer: "Sim. Pode divulgar o link de reserva no website, Google, Instagram, redes sociais, campanhas e outros canais próprios." },
    { question: "O sistema permite gerir mesas?", answer: "Sim. O MesaLink inclui mapa de mesas e ferramentas para acompanhar a sala e associar reservas ao serviço." },
    { question: "As reservas ficam ligadas ao CRM?", answer: "Sim. Os dados autorizados de reserva ajudam a construir o histórico do cliente e podem suportar ações de fidelização e marketing." },
  ],
  related: [
    { href: "/software-para-restaurantes", label: "Software para restaurantes" },
    { href: "/qr-ordering-restaurantes", label: "QR Ordering" },
    { href: "/website-para-restaurantes", label: "Website e SEO" },
    { href: "/marketing-para-restaurantes", label: "CRM e marketing" },
  ],
};

export default function Page() { return <RestaurantSolutionPage content={content} />; }
