import type { Metadata } from "next";
import { CalendarCheck, FileText, Gauge, Globe2, Search, Sparkles } from "lucide-react";
import RestaurantSolutionPage, { type SolutionPageContent } from "@/components/seo/RestaurantSolutionPage";

export const metadata: Metadata = {
  title: "Website para Restaurantes com Reservas, Menu e SEO",
  description: "Crie um website para restaurante rápido e mobile-first com menu, reservas online, domínio próprio, SEO e preparação para pesquisas por IA.",
  alternates: { canonical: "https://www.mesalink.pt/website-para-restaurantes" },
  openGraph: { url: "https://www.mesalink.pt/website-para-restaurantes", title: "Website e SEO para Restaurantes — MesaLink", description: "Website ligado ao menu, reservas, reviews e dados reais do restaurante." },
};

const content: SolutionPageContent = {
  path: "/website-para-restaurantes",
  eyebrow: "Website Builder, SEO e AI Visibility",
  title: "Website para restaurantes",
  accent: "feito para converter.",
  schemaName: "MesaLink Website Builder",
  intro: "Publique uma presença digital própria com menu, reservas, história, localização e identidade do restaurante. Tudo atualizado a partir dos dados que já gere no MesaLink.",
  painTitle: "Uma página bonita não chega se os clientes não a encontram ou não conseguem reservar.",
  pains: [
    "Menus em PDF têm pouca estrutura para pesquisa e são difíceis de usar no telemóvel.",
    "Informação desatualizada reduz confiança e cria dúvidas antes da visita.",
    "Sites separados obrigam a repetir alterações de menu, horários e conteúdo.",
    "Sem contexto claro, Google e motores de IA compreendem pior o restaurante.",
  ],
  featuresTitle: "Uma fonte oficial que clientes e motores de pesquisa compreendem.",
  features: [
    { icon: Globe2, title: "Website mobile-first", text: "Uma experiência rápida e clara para quem pesquisa e decide no telemóvel." },
    { icon: CalendarCheck, title: "Reservas integradas", text: "O visitante passa da descoberta à reserva direta sem sair da experiência do restaurante." },
    { icon: FileText, title: "Menu e conteúdo", text: "Apresente cozinha, especialidades, pratos, história, galeria e informações práticas." },
    { icon: Search, title: "SEO técnico", text: "Títulos, descrições e estrutura ajudam os motores de pesquisa a interpretar cada página." },
    { icon: Sparkles, title: "AI Visibility", text: "O diagnóstico GEO identifica oportunidades para melhorar a compreensão por sistemas de pesquisa com IA." },
    { icon: Gauge, title: "Atualização central", text: "O conteúdo essencial parte do mesmo sistema onde o restaurante gere a sua operação." },
  ],
  outcomesTitle: "Transformar pesquisa em reserva direta.",
  outcomes: [
    { title: "Mais controlo da marca", text: "O restaurante tem uma fonte oficial em vez de depender apenas de diretórios externos." },
    { title: "Informação consistente", text: "Menu, contactos e proposta ficam mais fáceis de manter atualizados." },
    { title: "Melhor compreensão", text: "Conteúdo descritivo e estruturado cria contexto sobre cozinha, localização e especialidades." },
    { title: "Reserva sem desvio", text: "O visitante encontra uma chamada direta para reservar, sem comissão por marcação." },
  ],
  faq: [
    { question: "Preciso de saber programar para criar o website?", answer: "Não. O Website Builder foi pensado para o restaurante editar conteúdo, imagens, menu e informações sem trabalhar com código." },
    { question: "Posso usar um domínio próprio?", answer: "O MesaLink suporta a configuração de domínio próprio para reforçar a identidade e a autoridade da presença oficial do restaurante." },
    { question: "O website inclui reservas online?", answer: "Sim. O fluxo de reserva pode ser ligado diretamente ao website e aos restantes canais do restaurante." },
    { question: "O que significa AI Visibility ou GEO?", answer: "É a otimização da presença digital para que sistemas de pesquisa com IA consigam compreender e considerar o restaurante em respostas relevantes. O MesaLink analisa conteúdo, menu, reviews, dados do negócio e outros sinais." },
  ],
  related: [
    { href: "/software-para-restaurantes", label: "Software para restaurantes" },
    { href: "/sistema-reservas-restaurantes", label: "Sistema de reservas" },
    { href: "/qr-ordering-restaurantes", label: "QR Ordering" },
    { href: "/marketing-para-restaurantes", label: "CRM e marketing" },
  ],
};

export default function Page() { return <RestaurantSolutionPage content={content} />; }
