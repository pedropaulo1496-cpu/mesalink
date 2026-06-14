"use client";

import Footer from "@/components/Footer";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

type Lang = "pt" | "en" | "es" | "fr" | "de";

type Copy = {
  nav: {
    platform: string;
    websites: string;
    comparison: string;
    pricing: string;
    login: string;
    start: string;
  };
  hero: {
    badge: string;
    title1: string;
    title2: string;
    text: string;
    primary: string;
    secondary: string;
    stat1: [string, string, string];
    stat2: [string, string, string];
    stat3: [string, string, string];
    proof1: string;
    proof2: string;
    proof3: string;
  };
  platform: {
    badge: string;
    title1: string;
    title2: string;
    text: string;
  };
  sections: {
    lessToolsBadge: string;
    lessToolsTitle1: string;
    lessToolsTitle2: string;
    lessToolsText: string;
    websitesBadge: string;
    websitesTitle1: string;
    websitesTitle2: string;
    websitesText: string;
    completeBadge: string;
    completeTitle: string;
    comparisonBadge: string;
    comparisonTitle: string;
    comparisonText: string;
    comparisonFinal: string;
    pricingBadge: string;
    pricingTitle: string;
    futureBadge: string;
    futureTitle1: string;
    futureTitle2: string;
    futureText: string;
    ctaTitle: string;
    ctaText: string;
    ctaButton: string;
  };
  bigCards: Array<{ title: string; text: string }>;
  templates: Array<{ name: string; text: string }>;
  features: Array<{ icon: string; title: string; text: string }>;
  comparison: Array<[string, string, string]>;
  prices: {
    popular: string;
    free: { title: string; price: string; text: string; items: string[]; cta: string };
    pro: { title: string; price: string; text: string; items: string[]; cta: string };
    website: { title: string; price: string; text: string; items: string[]; cta: string };
  };
  future: Array<{ title: string; text: string }>;
  flow: {
    center: string;
    subtitle: string;
    bottom: string;
    nodes: Array<{ icon: string; label: string; text: string }>;
  };
  phone: {
    title: string;
    status: string;
    reservations: string;
    people: string;
    occupancy: string;
    websiteActive: string;
    websiteLine: string;
    websiteText: string;
    platform: string;
    platformText: string;
    bookingConfirmed: string;
    pending: string;
  };
  sticky: { label: string; text: string; start: string };
};

const copies: Record<Lang, Copy> = {
  pt: {
    nav: { platform: "Plataforma", websites: "Websites", comparison: "Comparação", pricing: "Preços", login: "Entrar", start: "Começar grátis" },
    hero: {
      badge: "O Sistema Operativo para Restaurantes",
      title1: "Tudo o que o seu restaurante precisa",
      title2: "numa única plataforma.",
      text: "Website, reservas, POS, QR Code Ordering, marketing e muito mais. Tudo ligado para o seu restaurante funcionar melhor.",
      primary: "Começar Gratuitamente →",
      secondary: "Ver Demonstração →",
      stat1: ["✓", "100", "reservas/mês grátis"],
      stat2: ["✓", "Sem", "cartão de crédito"],
      stat3: ["✓", "5 min", "configuração"],
      proof1: "Até 100 reservas/mês grátis",
      proof2: "Sem cartão de crédito",
      proof3: "Configuração em minutos",
    },
    platform: {
      badge: "Uma plataforma. Um login.",
      title1: "Tudo o que realmente importa",
      title2: "ligado ao MesaLink.",
      text: "QR Code Ordering, website, POS, gestão de reservas e marketing não deviam viver em ferramentas separadas. O MesaLink junta tudo numa plataforma feita para restaurantes.",
    },
    sections: {
      lessToolsBadge: "Menos ferramentas. Mais restaurante.",
      lessToolsTitle1: "Pare de gerir o restaurante",
      lessToolsTitle2: "em várias plataformas.",
      lessToolsText: "Hoje o MesaLink resolve website, reservas, mesas e clientes. Em breve, liga marketing, QR Ordering e POS na mesma operação.",
      websitesBadge: "Website Profissional",
      websitesTitle1: "O website que o seu",
      websitesTitle2: "restaurante merece.",
      websitesText: "Escolha um template, adicione imagens, menus em PDF, galeria, contactos, SEO e reservas integradas. Sem programar. Sem agência. Sem complicações.",
      completeBadge: "Plataforma completa",
      completeTitle: "Uma base para todas as fases do restaurante.",
      comparisonBadge: "Porque MesaLink?",
      comparisonTitle: "Porque usar várias plataformas?",
      comparisonText: "A solução tradicional obriga o restaurante a juntar ferramentas diferentes. O MesaLink foi pensado para juntar tudo no mesmo sistema.",
      comparisonFinal: "Uma plataforma. Um login. Tudo ligado.",
      pricingBadge: "Preços simples",
      pricingTitle: "Comece grátis. Cresça quando precisar.",
      futureBadge: "O futuro da restauração",
      futureTitle1: "Estamos a construir a plataforma completa para",
      futureTitle2: "restaurantes.",
      futureText: "Hoje, o MesaLink resolve website, reservas, mesas e clientes. Em breve, vai ligar marketing, IA, pedidos por QR Code e POS numa única operação.",
      ctaTitle: "Comece gratuitamente hoje.",
      ctaText: "Receba reservas online, organize o restaurante e prepare a sua operação para uma nova geração de ferramentas de restauração.",
      ctaButton: "Criar conta grátis →",
    },
    bigCards: [
      { title: "Atrair clientes", text: "Website profissional, SEO, Google Maps, redes sociais e marketing preparados para converter visitas em reservas." },
      { title: "Receber e servir", text: "Reservas online, gestão de mesas e QR Code Ordering para transformar procura em serviço real." },
      { title: "Operar e crescer", text: "Clientes, dados, marketing e POS integrados para gerir melhor o restaurante todos os dias." },
    ],
    templates: [
      { name: "Premium", text: "Para restaurantes modernos que querem uma presença forte." },
      { name: "Luxury", text: "Para conceitos premium, fine dining e experiências exclusivas." },
      { name: "Minimal", text: "Para restaurantes que querem uma imagem limpa e direta." },
      { name: "Social", text: "Para marcas jovens, visuais e muito ligadas às redes sociais." },
    ],
    features: [
      { icon: "🌐", title: "Website profissional", text: "Menus, galeria, contactos, SEO e reservas integradas." },
      { icon: "📅", title: "Gestão de reservas", text: "Reservas do website, Google Maps e redes sociais num só calendário." },
      { icon: "📲", title: "QR Code Ordering", text: "Brevemente: pedidos na mesa por QR Code, ligados ao sistema." },
      { icon: "💳", title: "POS integrado", text: "Brevemente: vendas, produtos, pedidos e relatórios no mesmo lugar." },
    ],
    comparison: [
      ["Website", "Ferramenta #1", "Incluído"],
      ["Gestão de Reservas", "Ferramenta #2", "Incluído"],
      ["QR Code Ordering", "Ferramenta #3", "Brevemente"],
      ["POS", "Ferramenta #4", "Brevemente"],
      ["Marketing", "Ferramenta #5", "Brevemente"],
      ["Dados e Relatórios", "Ferramenta #6", "Incluído"],
    ],
    prices: {
      popular: "Mais popular",
      free: { title: "Free", price: "0€", text: "Para começar a receber reservas online sem risco.", items: ["Até 100 reservas/mês", "Calendário", "Clientes", "Link para redes sociais e Google Maps"], cta: "Começar grátis" },
      pro: { title: "Pro", price: "10€", text: "Para restaurantes que querem gerir reservas sem limites.", items: ["Reservas ilimitadas", "Gestão de mesas", "Calendário", "Clientes"], cta: "Escolher Pro" },
      website: { title: "Website", price: "+10€", text: "Add-on para transformar a presença online do restaurante.", items: ["Website profissional", "Templates", "Menus PDF", "Galeria", "SEO", "Reservas integradas"], cta: "Adicionar website" },
    },
    future: [
      { title: "Assistente IA", text: "Ajuda para reviews, descrições, conteúdo, operação e decisões do dia a dia." },
      { title: "Ferramentas de Marketing", text: "Campanhas, mensagens, promoções e reativação de clientes." },
      { title: "QR Ordering", text: "O cliente pede na mesa por QR Code e o pedido entra diretamente no sistema." },
      { title: "POS Integrado", text: "O próximo passo para ligar reservas, pedidos, pagamentos e operação." },
    ],
    flow: {
      center: "MesaLink",
      subtitle: "TUDO LIGADO",
      bottom: "Dados e Relatórios",
      nodes: [
        { icon: "📲", label: "QR Code Ordering", text: "Pedidos na mesa" },
        { icon: "🌐", label: "Website", text: "Online 24/7" },
        { icon: "💳", label: "POS", text: "Vendas e operação" },
        { icon: "📅", label: "Gestão de Reservas", text: "Todos os canais" },
        { icon: "📣", label: "Marketing", text: "Atrair e fidelizar" },
      ],
    },
    phone: { title: "Restaurante", status: "ONLINE", reservations: "Reservas", people: "Pessoas", occupancy: "Ocup.", websiteActive: "Website ativo", websiteLine: "Premium · Reservas ON", websiteText: "Menus, galeria, SEO e Google Maps ligados.", platform: "Plataforma completa", platformText: "Website → Reserva → Cliente → Mesa", bookingConfirmed: "Confirmada", pending: "Pendente" },
    sticky: { label: "MesaLink OS", text: "Website → Reservas → Gestão", start: "Começar" },
  },
  en: {
    nav: { platform: "Platform", websites: "Websites", comparison: "Compare", pricing: "Pricing", login: "Login", start: "Start free" },
    hero: {
      badge: "The Restaurant Operating System",
      title1: "Everything your restaurant needs",
      title2: "in one platform.",
      text: "Website, reservations, POS, QR Code Ordering, marketing and much more. Everything connected so your restaurant runs better.",
      primary: "Start Free →",
      secondary: "View Demo →",
      stat1: ["✓", "100", "free reservations/mo"],
      stat2: ["✓", "No", "credit card"],
      stat3: ["✓", "5 min", "setup"],
      proof1: "Up to 100 reservations/month free",
      proof2: "No credit card required",
      proof3: "Set up in minutes",
    },
    platform: { badge: "One platform. One login.", title1: "Everything that really matters", title2: "connected to MesaLink.", text: "QR Code Ordering, website, POS, reservation management and marketing should not live in separate tools. MesaLink brings everything together in one platform built for restaurants." },
    sections: {
      lessToolsBadge: "Fewer tools. More restaurant.", lessToolsTitle1: "Stop running your restaurant", lessToolsTitle2: "across multiple platforms.", lessToolsText: "Today MesaLink covers websites, reservations, tables and customers. Soon it will connect marketing, QR Ordering and POS in the same operation.", websitesBadge: "Professional Website", websitesTitle1: "The website your", websitesTitle2: "restaurant deserves.", websitesText: "Choose a template, add images, PDF menus, gallery, contacts, SEO and integrated reservations. No code. No agency. No hassle.", completeBadge: "Complete platform", completeTitle: "A foundation for every stage of the restaurant.", comparisonBadge: "Why MesaLink?", comparisonTitle: "Why use multiple platforms?", comparisonText: "The traditional approach forces restaurants to combine different tools. MesaLink is designed to bring everything into one system.", comparisonFinal: "One platform. One login. Everything connected.", pricingBadge: "Simple pricing", pricingTitle: "Start free. Grow when you need to.", futureBadge: "The future of restaurants", futureTitle1: "We are building the complete platform for", futureTitle2: "restaurants.", futureText: "Today, MesaLink connects websites, reservations, tables and customers. Soon, it will connect marketing, AI, QR Code Ordering and POS in one operation.", ctaTitle: "Start free today.", ctaText: "Receive online reservations, organize your restaurant and prepare your operation for a new generation of restaurant tools.", ctaButton: "Create free account →" },
    bigCards: [{ title: "Attract customers", text: "Professional website, SEO, Google Maps, social media and marketing designed to turn visitors into reservations." }, { title: "Receive and serve", text: "Online reservations, table management and QR Code Ordering to turn demand into real service." }, { title: "Operate and grow", text: "Customers, data, marketing and POS connected to run the restaurant better every day." }],
    templates: [{ name: "Premium", text: "For modern restaurants that want a strong online presence." }, { name: "Luxury", text: "For premium concepts, fine dining and exclusive experiences." }, { name: "Minimal", text: "For restaurants that want a clean and direct image." }, { name: "Social", text: "For young, visual brands highly connected to social media." }],
    features: [{ icon: "🌐", title: "Professional website", text: "Menus, gallery, contacts, SEO and integrated reservations." }, { icon: "📅", title: "Reservation management", text: "Reservations from your website, Google Maps and social media in one calendar." }, { icon: "📲", title: "QR Code Ordering", text: "Soon: table ordering by QR Code, connected to the system." }, { icon: "💳", title: "Integrated POS", text: "Soon: sales, products, orders and reports in one place." }],
    comparison: [["Website", "Tool #1", "Included"], ["Reservation Management", "Tool #2", "Included"], ["QR Code Ordering", "Tool #3", "Soon"], ["POS", "Tool #4", "Soon"], ["Marketing", "Tool #5", "Soon"], ["Data & Reports", "Tool #6", "Included"]],
    prices: { popular: "Most popular", free: { title: "Free", price: "€0", text: "Start receiving online reservations with no risk.", items: ["Up to 100 reservations/month", "Calendar", "Customers", "Links for social media and Google Maps"], cta: "Start free" }, pro: { title: "Pro", price: "€10", text: "For restaurants that want unlimited reservation management.", items: ["Unlimited reservations", "Table management", "Calendar", "Customers"], cta: "Choose Pro" }, website: { title: "Website", price: "+€10", text: "Add-on to transform your restaurant's online presence.", items: ["Professional website", "Templates", "PDF menus", "Gallery", "SEO", "Integrated reservations"], cta: "Add website" } },
    future: [{ title: "AI Assistant", text: "Help with reviews, descriptions, content, operations and daily decisions." }, { title: "Marketing Tools", text: "Campaigns, messages, promotions and customer reactivation." }, { title: "QR Ordering", text: "Customers order at the table by QR Code and the order enters the system directly." }, { title: "Integrated POS", text: "The next step to connect reservations, orders, payments and operations." }],
    flow: { center: "MesaLink", subtitle: "CONNECTED", bottom: "Data & Reports", nodes: [{ icon: "📲", label: "QR Code Ordering", text: "Table orders" }, { icon: "🌐", label: "Website", text: "Online 24/7" }, { icon: "💳", label: "POS", text: "Sales & ops" }, { icon: "📅", label: "Reservation Management", text: "All channels" }, { icon: "📣", label: "Marketing", text: "Attract & retain" }] },
    phone: { title: "Restaurant", status: "ONLINE", reservations: "Bookings", people: "Guests", occupancy: "Occup.", websiteActive: "Website live", websiteLine: "Premium · Bookings ON", websiteText: "Menus, gallery, SEO and Google Maps connected.", platform: "Complete platform", platformText: "Website → Booking → Customer → Table", bookingConfirmed: "Confirmed", pending: "Pending" },
    sticky: { label: "MesaLink OS", text: "Website → Reservations → Management", start: "Start" },
  },
  es: {} as Copy,
  fr: {} as Copy,
  de: {} as Copy,
};

copies.es = {
  ...copies.en,
  nav: { platform: "Plataforma", websites: "Websites", comparison: "Comparar", pricing: "Precios", login: "Entrar", start: "Empezar gratis" },
  hero: { ...copies.en.hero, badge: "El Sistema Operativo para Restaurantes", title1: "Todo lo que tu restaurante necesita", title2: "en una sola plataforma.", text: "Website, reservas, POS, QR Code Ordering, marketing y mucho más. Todo conectado para que tu restaurante funcione mejor.", primary: "Empezar Gratis →", secondary: "Ver Demo →", proof1: "Hasta 100 reservas/mes gratis", proof2: "Sin tarjeta de crédito", proof3: "Configuración en minutos" },
  platform: { badge: "Una plataforma. Un login.", title1: "Todo lo realmente importante", title2: "conectado a MesaLink.", text: "QR Code Ordering, website, POS, gestión de reservas y marketing no deberían vivir en herramientas separadas. MesaLink lo une todo en una plataforma creada para restaurantes." },
  sections: { ...copies.en.sections, lessToolsBadge: "Menos herramientas. Más restaurante.", lessToolsTitle1: "Deja de gestionar tu restaurante", lessToolsTitle2: "en varias plataformas.", lessToolsText: "Hoy MesaLink cubre website, reservas, mesas y clientes. Pronto conectará marketing, QR Ordering y POS en la misma operación.", websitesBadge: "Website Profesional", websitesTitle1: "El website que tu", websitesTitle2: "restaurante merece.", websitesText: "Elige una plantilla, añade imágenes, menús PDF, galería, contactos, SEO y reservas integradas. Sin código. Sin agencia. Sin complicaciones.", completeBadge: "Plataforma completa", completeTitle: "Una base para todas las fases del restaurante.", comparisonBadge: "¿Por qué MesaLink?", comparisonTitle: "¿Por qué usar varias plataformas?", comparisonText: "La solución tradicional obliga al restaurante a combinar herramientas diferentes. MesaLink está pensado para unir todo en un solo sistema.", comparisonFinal: "Una plataforma. Un login. Todo conectado.", pricingBadge: "Precios simples", pricingTitle: "Empieza gratis. Crece cuando lo necesites.", futureBadge: "El futuro de la restauración", futureTitle1: "Estamos construyendo la plataforma completa para", futureTitle2: "restaurantes.", futureText: "Hoy MesaLink conecta website, reservas, mesas y clientes. Pronto conectará marketing, IA, QR Code Ordering y POS en una sola operación.", ctaTitle: "Empieza gratis hoy.", ctaText: "Recibe reservas online, organiza tu restaurante y prepara tu operación para una nueva generación de herramientas de restauración.", ctaButton: "Crear cuenta gratis →" },
  bigCards: [{ title: "Atraer clientes", text: "Website profesional, SEO, Google Maps, redes sociales y marketing preparados para convertir visitas en reservas." }, { title: "Recibir y servir", text: "Reservas online, gestión de mesas y QR Code Ordering para transformar demanda en servicio real." }, { title: "Operar y crecer", text: "Clientes, datos, marketing y POS conectados para gestionar mejor el restaurante cada día." }],
  features: [{ icon: "🌐", title: "Website profesional", text: "Menús, galería, contactos, SEO y reservas integradas." }, { icon: "📅", title: "Gestión de reservas", text: "Reservas del website, Google Maps y redes sociales en un solo calendario." }, { icon: "📲", title: "QR Code Ordering", text: "Pronto: pedidos en mesa por QR Code, conectados al sistema." }, { icon: "💳", title: "POS integrado", text: "Pronto: ventas, productos, pedidos e informes en un solo lugar." }],
  comparison: [["Website", "Herramienta #1", "Incluido"], ["Gestión de Reservas", "Herramienta #2", "Incluido"], ["QR Code Ordering", "Herramienta #3", "Pronto"], ["POS", "Herramienta #4", "Pronto"], ["Marketing", "Herramienta #5", "Pronto"], ["Datos e Informes", "Herramienta #6", "Incluido"]],
  prices: { popular: "Más popular", free: { title: "Free", price: "0€", text: "Para empezar a recibir reservas online sin riesgo.", items: ["Hasta 100 reservas/mes", "Calendario", "Clientes", "Link para redes sociales y Google Maps"], cta: "Empezar gratis" }, pro: { title: "Pro", price: "10€", text: "Para restaurantes que quieren gestionar reservas sin límites.", items: ["Reservas ilimitadas", "Gestión de mesas", "Calendario", "Clientes"], cta: "Elegir Pro" }, website: { title: "Website", price: "+10€", text: "Add-on para transformar la presencia online del restaurante.", items: ["Website profesional", "Plantillas", "Menús PDF", "Galería", "SEO", "Reservas integradas"], cta: "Añadir website" } },
  future: [{ title: "Asistente IA", text: "Ayuda con reviews, descripciones, contenido, operación y decisiones diarias." }, { title: "Herramientas de Marketing", text: "Campañas, mensajes, promociones y reactivación de clientes." }, { title: "QR Ordering", text: "El cliente pide en la mesa por QR Code y el pedido entra directamente en el sistema." }, { title: "POS Integrado", text: "El siguiente paso para conectar reservas, pedidos, pagos y operación." }],
  flow: { center: "MesaLink", subtitle: "TODO CONECTADO", bottom: "Datos e Informes", nodes: [{ icon: "📲", label: "QR Code Ordering", text: "Pedidos en mesa" }, { icon: "🌐", label: "Website", text: "Online 24/7" }, { icon: "💳", label: "POS", text: "Ventas y operación" }, { icon: "📅", label: "Gestión de Reservas", text: "Todos los canales" }, { icon: "📣", label: "Marketing", text: "Atraer y fidelizar" }] },
  phone: { ...copies.pt.phone, title: "Restaurante", reservations: "Reservas", people: "Personas", websiteActive: "Website activo", websiteLine: "Premium · Reservas ON", websiteText: "Menús, galería, SEO y Google Maps conectados.", platform: "Plataforma completa", platformText: "Website → Reserva → Cliente → Mesa", bookingConfirmed: "Confirmada", pending: "Pendiente" },
  sticky: { label: "MesaLink OS", text: "Website → Reservas → Gestión", start: "Empezar" },
};

copies.fr = {
  ...copies.en,
  nav: { platform: "Plateforme", websites: "Sites web", comparison: "Comparer", pricing: "Tarifs", login: "Connexion", start: "Commencer gratuit" },
  hero: { ...copies.en.hero, badge: "Le Système d’Exploitation pour Restaurants", title1: "Tout ce dont votre restaurant a besoin", title2: "sur une seule plateforme.", text: "Site web, réservations, POS, QR Code Ordering, marketing et bien plus. Tout connecté pour mieux gérer votre restaurant.", primary: "Commencer Gratuitement →", secondary: "Voir la Démo →", proof1: "Jusqu’à 100 réservations/mois gratuites", proof2: "Sans carte bancaire", proof3: "Configuration en quelques minutes" },
  platform: { badge: "Une plateforme. Un accès.", title1: "Tout ce qui compte vraiment", title2: "connecté à MesaLink.", text: "QR Code Ordering, site web, POS, gestion des réservations et marketing ne devraient pas être séparés. MesaLink réunit tout dans une plateforme conçue pour les restaurants." },
  sections: { ...copies.en.sections, lessToolsBadge: "Moins d’outils. Plus de restaurant.", lessToolsTitle1: "Arrêtez de gérer votre restaurant", lessToolsTitle2: "sur plusieurs plateformes.", lessToolsText: "Aujourd’hui MesaLink couvre le site web, les réservations, les tables et les clients. Bientôt, marketing, QR Ordering et POS seront connectés dans la même opération.", websitesBadge: "Site Web Professionnel", websitesTitle1: "Le site web que votre", websitesTitle2: "restaurant mérite.", websitesText: "Choisissez un template, ajoutez images, menus PDF, galerie, contacts, SEO et réservations intégrées. Sans code. Sans agence. Sans complications.", completeBadge: "Plateforme complète", completeTitle: "Une base pour chaque étape du restaurant.", comparisonBadge: "Pourquoi MesaLink ?", comparisonTitle: "Pourquoi utiliser plusieurs plateformes ?", comparisonText: "La solution traditionnelle oblige les restaurants à combiner plusieurs outils. MesaLink rassemble tout dans un seul système.", comparisonFinal: "Une plateforme. Un accès. Tout connecté.", pricingBadge: "Tarifs simples", pricingTitle: "Commencez gratuitement. Évoluez quand vous en avez besoin.", futureBadge: "L’avenir de la restauration", futureTitle1: "Nous construisons la plateforme complète pour", futureTitle2: "restaurants.", futureText: "Aujourd’hui, MesaLink connecte sites web, réservations, tables et clients. Bientôt, il connectera marketing, IA, QR Code Ordering et POS dans une seule opération.", ctaTitle: "Commencez gratuitement aujourd’hui.", ctaText: "Recevez des réservations en ligne, organisez votre restaurant et préparez votre opération à une nouvelle génération d’outils de restauration.", ctaButton: "Créer un compte gratuit →" },
  bigCards: [{ title: "Attirer des clients", text: "Site web professionnel, SEO, Google Maps, réseaux sociaux et marketing conçus pour convertir les visites en réservations." }, { title: "Recevoir et servir", text: "Réservations en ligne, gestion des tables et QR Code Ordering pour transformer la demande en service réel." }, { title: "Opérer et grandir", text: "Clients, données, marketing et POS connectés pour mieux gérer le restaurant chaque jour." }],
  features: [{ icon: "🌐", title: "Site web professionnel", text: "Menus, galerie, contacts, SEO et réservations intégrées." }, { icon: "📅", title: "Gestion des réservations", text: "Réservations du site, Google Maps et réseaux sociaux dans un calendrier unique." }, { icon: "📲", title: "QR Code Ordering", text: "Bientôt : commandes à table par QR Code, connectées au système." }, { icon: "💳", title: "POS intégré", text: "Bientôt : ventes, produits, commandes et rapports au même endroit." }],
  comparison: [["Site web", "Outil #1", "Inclus"], ["Gestion des réservations", "Outil #2", "Inclus"], ["QR Code Ordering", "Outil #3", "Bientôt"], ["POS", "Outil #4", "Bientôt"], ["Marketing", "Outil #5", "Bientôt"], ["Données et Rapports", "Outil #6", "Inclus"]],
  prices: { popular: "Le plus populaire", free: { title: "Free", price: "0€", text: "Pour commencer à recevoir des réservations en ligne sans risque.", items: ["Jusqu’à 100 réservations/mois", "Calendrier", "Clients", "Lien pour réseaux sociaux et Google Maps"], cta: "Commencer gratuit" }, pro: { title: "Pro", price: "10€", text: "Pour les restaurants qui veulent gérer les réservations sans limites.", items: ["Réservations illimitées", "Gestion des tables", "Calendrier", "Clients"], cta: "Choisir Pro" }, website: { title: "Website", price: "+10€", text: "Add-on pour transformer la présence en ligne du restaurant.", items: ["Site web professionnel", "Templates", "Menus PDF", "Galerie", "SEO", "Réservations intégrées"], cta: "Ajouter le site" } },
  future: [{ title: "Assistant IA", text: "Aide pour avis, descriptions, contenu, opérations et décisions quotidiennes." }, { title: "Outils Marketing", text: "Campagnes, messages, promotions et réactivation des clients." }, { title: "QR Ordering", text: "Le client commande à table par QR Code et la commande entre directement dans le système." }, { title: "POS Intégré", text: "La prochaine étape pour connecter réservations, commandes, paiements et opérations." }],
  flow: { center: "MesaLink", subtitle: "TOUT CONNECTÉ", bottom: "Données et Rapports", nodes: [{ icon: "📲", label: "QR Code Ordering", text: "Commandes à table" }, { icon: "🌐", label: "Site Web", text: "En ligne 24/7" }, { icon: "💳", label: "POS", text: "Ventes et opérations" }, { icon: "📅", label: "Gestion des Réservations", text: "Tous les canaux" }, { icon: "📣", label: "Marketing", text: "Attirer et fidéliser" }] },
  phone: { ...copies.en.phone, title: "Restaurant", reservations: "Réservations", people: "Couverts", occupancy: "Occup.", websiteActive: "Site actif", websiteLine: "Premium · Réservations ON", websiteText: "Menus, galerie, SEO et Google Maps connectés.", platform: "Plateforme complète", platformText: "Site → Réservation → Client → Table", bookingConfirmed: "Confirmée", pending: "En attente" },
  sticky: { label: "MesaLink OS", text: "Site → Réservations → Gestion", start: "Commencer" },
};

copies.de = {
  ...copies.en,
  nav: { platform: "Plattform", websites: "Websites", comparison: "Vergleich", pricing: "Preise", login: "Login", start: "Kostenlos starten" },
  hero: { ...copies.en.hero, badge: "Das Betriebssystem für Restaurants", title1: "Alles, was Ihr Restaurant braucht", title2: "auf einer Plattform.", text: "Website, Reservierungen, POS, QR Code Ordering, Marketing und vieles mehr. Alles verbunden, damit Ihr Restaurant besser läuft.", primary: "Kostenlos starten →", secondary: "Demo ansehen →", proof1: "Bis zu 100 Reservierungen/Monat kostenlos", proof2: "Keine Kreditkarte erforderlich", proof3: "Einrichtung in wenigen Minuten" },
  platform: { badge: "Eine Plattform. Ein Login.", title1: "Alles, was wirklich zählt", title2: "mit MesaLink verbunden.", text: "QR Code Ordering, Website, POS, Reservierungsmanagement und Marketing sollten nicht in getrennten Tools leben. MesaLink verbindet alles in einer Plattform für Restaurants." },
  sections: { ...copies.en.sections, lessToolsBadge: "Weniger Tools. Mehr Restaurant.", lessToolsTitle1: "Verwalten Sie Ihr Restaurant nicht mehr", lessToolsTitle2: "über mehrere Plattformen.", lessToolsText: "Heute deckt MesaLink Website, Reservierungen, Tische und Gäste ab. Bald werden Marketing, QR Ordering und POS im selben System verbunden.", websitesBadge: "Professionelle Website", websitesTitle1: "Die Website, die Ihr", websitesTitle2: "Restaurant verdient.", websitesText: "Wählen Sie ein Template, fügen Sie Bilder, PDF-Menüs, Galerie, Kontakte, SEO und integrierte Reservierungen hinzu. Kein Code. Keine Agentur. Kein Aufwand.", completeBadge: "Komplette Plattform", completeTitle: "Eine Basis für jede Phase des Restaurants.", comparisonBadge: "Warum MesaLink?", comparisonTitle: "Warum mehrere Plattformen nutzen?", comparisonText: "Die traditionelle Lösung zwingt Restaurants, verschiedene Tools zu kombinieren. MesaLink wurde entwickelt, um alles in einem System zu verbinden.", comparisonFinal: "Eine Plattform. Ein Login. Alles verbunden.", pricingBadge: "Einfache Preise", pricingTitle: "Kostenlos starten. Wachsen, wenn Sie bereit sind.", futureBadge: "Die Zukunft der Gastronomie", futureTitle1: "Wir bauen die komplette Plattform für", futureTitle2: "Restaurants.", futureText: "Heute verbindet MesaLink Websites, Reservierungen, Tische und Gäste. Bald verbindet es Marketing, KI, QR Code Ordering und POS in einem Betriebssystem.", ctaTitle: "Starten Sie heute kostenlos.", ctaText: "Erhalten Sie Online-Reservierungen, organisieren Sie Ihr Restaurant und bereiten Sie Ihren Betrieb auf eine neue Generation von Restaurant-Tools vor.", ctaButton: "Kostenloses Konto erstellen →" },
  bigCards: [{ title: "Gäste gewinnen", text: "Professionelle Website, SEO, Google Maps, Social Media und Marketing, um Besucher in Reservierungen zu verwandeln." }, { title: "Empfangen und bedienen", text: "Online-Reservierungen, Tischverwaltung und QR Code Ordering, um Nachfrage in echten Service zu verwandeln." }, { title: "Betreiben und wachsen", text: "Gäste, Daten, Marketing und POS verbunden, um das Restaurant täglich besser zu führen." }],
  features: [{ icon: "🌐", title: "Professionelle Website", text: "Menüs, Galerie, Kontakte, SEO und integrierte Reservierungen." }, { icon: "📅", title: "Reservierungsmanagement", text: "Reservierungen von Website, Google Maps und Social Media in einem Kalender." }, { icon: "📲", title: "QR Code Ordering", text: "Bald: Bestellungen am Tisch per QR Code, direkt mit dem System verbunden." }, { icon: "💳", title: "Integriertes POS", text: "Bald: Verkäufe, Produkte, Bestellungen und Berichte an einem Ort." }],
  comparison: [["Website", "Tool #1", "Inklusive"], ["Reservierungsmanagement", "Tool #2", "Inklusive"], ["QR Code Ordering", "Tool #3", "Bald"], ["POS", "Tool #4", "Bald"], ["Marketing", "Tool #5", "Bald"], ["Daten & Berichte", "Tool #6", "Inklusive"]],
  prices: { popular: "Beliebteste", free: { title: "Free", price: "0€", text: "Starten Sie risikofrei mit Online-Reservierungen.", items: ["Bis zu 100 Reservierungen/Monat", "Kalender", "Gäste", "Link für Social Media und Google Maps"], cta: "Kostenlos starten" }, pro: { title: "Pro", price: "10€", text: "Für Restaurants, die Reservierungen ohne Limit verwalten wollen.", items: ["Unbegrenzte Reservierungen", "Tischverwaltung", "Kalender", "Gäste"], cta: "Pro wählen" }, website: { title: "Website", price: "+10€", text: "Add-on für eine professionelle Online-Präsenz Ihres Restaurants.", items: ["Professionelle Website", "Templates", "PDF-Menüs", "Galerie", "SEO", "Integrierte Reservierungen"], cta: "Website hinzufügen" } },
  future: [{ title: "KI-Assistent", text: "Hilfe bei Bewertungen, Beschreibungen, Inhalten, Betrieb und täglichen Entscheidungen." }, { title: "Marketing-Tools", text: "Kampagnen, Nachrichten, Angebote und Reaktivierung von Gästen." }, { title: "QR Ordering", text: "Gäste bestellen am Tisch per QR Code und die Bestellung kommt direkt ins System." }, { title: "Integriertes POS", text: "Der nächste Schritt, um Reservierungen, Bestellungen, Zahlungen und Betrieb zu verbinden." }],
  flow: { center: "MesaLink", subtitle: "ALLES VERBUNDEN", bottom: "Daten & Berichte", nodes: [{ icon: "📲", label: "QR Code Ordering", text: "Tischbestellungen" }, { icon: "🌐", label: "Website", text: "Online 24/7" }, { icon: "💳", label: "POS", text: "Verkauf & Betrieb" }, { icon: "📅", label: "Reservierungsmanagement", text: "Alle Kanäle" }, { icon: "📣", label: "Marketing", text: "Gewinnen & binden" }] },
  phone: { ...copies.en.phone, title: "Restaurant", reservations: "Reservierungen", people: "Gäste", occupancy: "Ausl.", websiteActive: "Website live", websiteLine: "Premium · Reservierungen ON", websiteText: "Menüs, Galerie, SEO und Google Maps verbunden.", platform: "Komplette Plattform", platformText: "Website → Reservierung → Gast → Tisch", bookingConfirmed: "Bestätigt", pending: "Offen" },
  sticky: { label: "MesaLink OS", text: "Website → Reservierungen → Management", start: "Starten" },
};

const languageLabels: Record<Lang, string> = {
  pt: "PT",
  en: "EN",
  es: "ES",
  fr: "FR",
  de: "DE",
};

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("pt");
  const t = copies[lang];
  const { scrollYProgress } = useScroll();

  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -70]);
  const phoneRotate = useTransform(scrollYProgress, [0, 0.25], [-4, 4]);
  const priceCards = useMemo(() => [t.prices.free, t.prices.pro, t.prices.website], [t]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 px-5 pb-16 pt-5 lg:px-8 lg:pb-24">
        <nav className="mx-auto mb-12 flex max-w-7xl items-center justify-between gap-4 lg:mb-16">
          <Link href="/" className="shrink-0 text-2xl font-black">
            Mesa
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Link
            </span>
          </Link>

          <div className="hidden items-center gap-7 text-sm lg:flex">
            <Link href="#platform" className="font-bold text-slate-400 hover:text-white">{t.nav.platform}</Link>
            <Link href="#websites" className="font-bold text-slate-400 hover:text-white">{t.nav.websites}</Link>
            <Link href="#comparison" className="font-bold text-slate-400 hover:text-white">{t.nav.comparison}</Link>
            <Link href="#pricing" className="font-bold text-slate-400 hover:text-white">{t.nav.pricing}</Link>
            <Link href="/login" className="font-bold text-slate-400 hover:text-white">{t.nav.login}</Link>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher lang={lang} setLang={setLang} />
            <Link
              href="/register"
              className="hidden rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-6 py-3 font-black text-black shadow-[0_0_45px_rgba(96,165,250,0.35)] hover:opacity-90 sm:inline-flex"
            >
              {t.nav.start}
            </Link>
            <Link href="/login" className="rounded-full border border-cyan-300/30 bg-white/5 px-4 py-2 text-sm font-black text-cyan-200 backdrop-blur lg:hidden">
              {t.nav.login}
            </Link>
          </div>
        </nav>

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:min-h-[720px] lg:grid-cols-[1.02fr_0.98fr]">
          <motion.div style={{ y: heroY }}>
            <Badge>{t.hero.badge}</Badge>

            <h1 className="mt-5 text-[48px] font-black leading-[0.9] tracking-[-0.065em] sm:text-7xl lg:text-[84px]">
              {t.hero.title1}{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-400 bg-clip-text text-transparent">
                {t.hero.title2}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-slate-300 lg:text-lg">
              {t.hero.text}
            </p>

            <div className="mt-7 grid gap-3 sm:max-w-xl sm:grid-cols-2">
              <Button asChild className="h-14 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-base font-black text-black shadow-[0_0_70px_rgba(96,165,250,0.6)] hover:opacity-90">
                <Link href="/register">{t.hero.primary}</Link>
              </Button>
              <Button asChild variant="outline" className="h-14 rounded-full border-cyan-300/30 bg-white/5 text-base font-black text-white backdrop-blur hover:bg-white/10">
                <Link href="#platform">{t.hero.secondary}</Link>
              </Button>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <HeroStat icon={t.hero.stat1[0]} value={t.hero.stat1[1]} label={t.hero.stat1[2]} />
              <HeroStat icon={t.hero.stat2[0]} value={t.hero.stat2[1]} label={t.hero.stat2[2]} />
              <HeroStat icon={t.hero.stat3[0]} value={t.hero.stat3[1]} label={t.hero.stat3[2]} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-slate-400">
              <span>✓ {t.hero.proof1}</span>
              <span>✓ {t.hero.proof2}</span>
              <span>✓ {t.hero.proof3}</span>
            </div>
          </motion.div>

          <motion.div style={{ rotate: phoneRotate }} className="lg:mt-8">
            <FlowNetwork t={t} hero />
          </motion.div>
        </div>
      </section>

      <StickyBar t={t} />

      <section id="platform" className="relative z-10 px-5 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Badge>{t.platform.badge}</Badge>
            <h2 className="mt-5 text-[40px] font-black leading-[0.92] tracking-[-0.05em] sm:text-6xl">
              {t.platform.title1}{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                {t.platform.title2}
              </span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400 lg:text-lg">{t.platform.text}</p>
          </div>
          <FlowNetwork t={t} />
        </div>
      </section>

      <section className="relative z-10 px-5 py-14 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <Badge>{t.sections.lessToolsBadge}</Badge>
          <div className="mt-5 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <h2 className="text-[40px] font-black leading-[0.92] tracking-[-0.05em] sm:text-6xl">
                {t.sections.lessToolsTitle1}{" "}
                <span className="text-cyan-300">{t.sections.lessToolsTitle2}</span>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400">{t.sections.lessToolsText}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
              {t.bigCards.map((card, index) => (
                <BigCard key={card.title} number={`0${index + 1}`} title={card.title} text={card.text} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="websites" className="relative z-10 px-5 py-14 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[36px] border border-cyan-300/20 bg-[#06111f] p-6 shadow-[0_0_100px_rgba(34,211,238,0.22)] lg:p-10">
            <div className="absolute -right-16 top-10 h-52 w-52 rounded-full bg-cyan-500/25 blur-[70px]" />
            <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-violet-500/25 blur-[70px]" />
            <div className="relative">
              <Badge purple>{t.sections.websitesBadge}</Badge>
              <div className="mt-5 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
                <div>
                  <h2 className="text-[40px] font-black leading-[0.92] tracking-[-0.05em] sm:text-6xl">
                    {t.sections.websitesTitle1}{" "}
                    <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                      {t.sections.websitesTitle2}
                    </span>
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300">{t.sections.websitesText}</p>
                </div>
                <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                  <p>✓ PDF menus</p><p>✓ Gallery</p><p>✓ SEO</p><p>✓ Contacts</p><p>✓ Google Maps</p><p>✓ Integrated reservations</p>
                </div>
              </div>
              <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {t.templates.map((template) => <TemplateCard key={template.name} {...template} />)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 py-14 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <Badge>{t.sections.completeBadge}</Badge>
          <h2 className="mt-5 max-w-4xl text-[40px] font-black leading-[0.92] tracking-[-0.05em] sm:text-6xl">{t.sections.completeTitle}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {t.features.map((feature) => <Feature key={feature.title} {...feature} />)}
          </div>
        </div>
      </section>

      <section id="comparison" className="relative z-10 px-5 py-14 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <Badge>{t.sections.comparisonBadge}</Badge>
          <h2 className="mt-5 max-w-4xl text-[40px] font-black leading-[0.92] tracking-[-0.05em] sm:text-6xl">{t.sections.comparisonTitle}</h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400">{t.sections.comparisonText}</p>
          <div className="mt-10 overflow-hidden rounded-[32px] border border-cyan-300/10 bg-[#06111f] shadow-[0_0_70px_rgba(34,211,238,0.08)]">
            <div className="grid grid-cols-3 bg-white/[0.04] p-5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              <div>Need</div><div>Traditional</div><div>MesaLink</div>
            </div>
            {t.comparison.map(([need, traditional, mesalink]) => (
              <div key={need} className="grid grid-cols-3 border-t border-white/10 p-5 text-sm sm:text-base">
                <div className="font-black text-white">{need}</div><div className="text-slate-400">{traditional}</div><div className="font-black text-cyan-300">{mesalink}</div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xl font-black text-cyan-200">{t.sections.comparisonFinal}</p>
        </div>
      </section>

      <section id="pricing" className="relative z-10 px-5 py-14 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <Badge>{t.sections.pricingBadge}</Badge>
          <h2 className="mt-5 max-w-4xl text-[40px] font-black leading-[0.92] tracking-[-0.05em] sm:text-6xl">{t.sections.pricingTitle}</h2>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {priceCards.map((card, index) => (
              <PriceCard key={card.title} {...card} highlighted={index === 1} popular={t.prices.popular} href="/register" />
            ))}
          </div>
        </div>
      </section>

      <section id="future" className="relative z-10 px-5 py-14 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[36px] border border-cyan-300/20 bg-[#06111f] p-6 shadow-[0_0_100px_rgba(34,211,238,0.16)] lg:p-10">
            <div className="absolute -right-16 top-10 h-52 w-52 rounded-full bg-cyan-500/25 blur-[70px]" />
            <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-violet-500/25 blur-[70px]" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div>
                <Badge purple>{t.sections.futureBadge}</Badge>
                <h2 className="mt-5 text-[40px] font-black leading-[0.92] tracking-[-0.05em] sm:text-6xl">
                  {t.sections.futureTitle1}{" "}
                  <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">{t.sections.futureTitle2}</span>
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300">{t.sections.futureText}</p>
              </div>
              <div className="grid gap-3">
                {t.future.map((item) => <AiItem key={item.title} {...item} />)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-16 lg:px-8 lg:pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[36px] border border-cyan-300/20 bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500 p-7 text-black shadow-[0_0_100px_rgba(96,165,250,0.55)] lg:p-10">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/40 blur-3xl" />
            <h2 className="relative max-w-4xl text-[42px] font-black leading-[0.88] tracking-[-0.06em] sm:text-6xl">{t.sections.ctaTitle}</h2>
            <p className="relative mt-5 max-w-2xl text-base leading-relaxed text-black/70">{t.sections.ctaText}</p>
            <Button asChild className="relative mt-7 h-14 rounded-full bg-black px-8 text-base font-black text-white hover:bg-black/90">
              <Link href="/register">{t.sections.ctaButton}</Link>
            </Button>
            <div className="relative mt-6 grid gap-4 text-sm text-black/70 sm:grid-cols-2 lg:max-w-md">
              <p>💳 {t.hero.proof2}</p><p>📅 {t.hero.proof1}</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function LanguageSwitcher({ lang, setLang }: { lang: Lang; setLang: (lang: Lang) => void }) {
  return (
    <div className="hidden rounded-full border border-cyan-300/20 bg-white/5 p-1 backdrop-blur md:flex">
      {(Object.keys(languageLabels) as Lang[]).map((code) => (
        <button key={code} type="button" onClick={() => setLang(code)} className={lang === code ? "rounded-full bg-cyan-300 px-3 py-2 text-xs font-black text-black" : "rounded-full px-3 py-2 text-xs font-black text-slate-400 hover:text-white"}>
          {languageLabels[code]}
        </button>
      ))}
    </div>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <motion.div animate={{ scale: [1, 1.18, 1], y: [0, 42, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute left-1/2 top-[-140px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[110px] lg:h-[620px] lg:w-[620px]" />
      <motion.div animate={{ x: [0, -35, 0], y: [0, 50, 0] }} transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }} className="absolute right-[-140px] top-[420px] h-[320px] w-[320px] rounded-full bg-violet-500/20 blur-[100px] lg:h-[440px] lg:w-[440px]" />
      <motion.div animate={{ x: [0, 22, 0], opacity: [0.12, 0.3, 0.12] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[-120px] left-[-120px] h-[320px] w-[320px] rounded-full bg-blue-500/20 blur-[100px]" />
      <motion.div animate={{ opacity: [0.12, 0.28, 0.12] }} transition={{ duration: 4, repeat: Infinity }} className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.08)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.16),transparent_35%),linear-gradient(to_bottom,#020617,#050816_35%,#020617)]" />
    </div>
  );
}

function StickyBar({ t }: { t: Copy }) {
  return (
    <section className="sticky top-0 z-30 border-y border-cyan-300/10 bg-[#020617]/80 px-5 py-4 backdrop-blur-2xl lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">{t.sticky.label}</p><p className="text-sm font-bold text-white">{t.sticky.text}</p></div>
        <Link href="/register" className="rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-4 py-2 text-sm font-black text-black">{t.sticky.start}</Link>
      </div>
    </section>
  );
}

function Badge({ children, purple }: { children: ReactNode; purple?: boolean }) {
  return <span className={purple ? "relative inline-flex rounded-full border border-violet-300/30 bg-violet-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-violet-200" : "relative inline-flex rounded-full border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-200"}>{children}</span>;
}

function FlowNetwork({ t, hero }: { t: Copy; hero?: boolean }) {
  const [qr, website, pos, reservations, marketing] = t.flow.nodes;
  return (
    <div className={hero ? "relative mx-auto h-[560px] w-full max-w-[560px] overflow-hidden rounded-[40px] border border-cyan-300/10 bg-white/[0.035] p-4 backdrop-blur-2xl lg:h-[650px] lg:max-w-[640px]" : "relative mx-auto mt-10 h-[560px] w-full max-w-sm overflow-hidden rounded-[40px] border border-cyan-300/10 bg-white/[0.035] p-4 backdrop-blur-2xl lg:h-[620px] lg:max-w-[560px]"}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(34,211,238,0.22),transparent_32%)]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 420 560" fill="none">
        <path d="M210 260 C210 190 210 145 210 95" stroke="rgba(34,211,238,.45)" strokeWidth="2" />
        <path d="M170 282 C95 282 80 210 70 160" stroke="rgba(139,92,246,.35)" strokeWidth="2" />
        <path d="M250 282 C325 282 340 210 350 160" stroke="rgba(34,211,238,.35)" strokeWidth="2" />
        <path d="M165 330 C100 330 80 400 70 455" stroke="rgba(34,197,94,.35)" strokeWidth="2" />
        <path d="M255 330 C320 330 340 400 350 455" stroke="rgba(251,191,36,.35)" strokeWidth="2" />
        <path d="M210 370 C210 420 210 460 210 500" stroke="rgba(96,165,250,.38)" strokeWidth="2" />
      </svg>

      <FlowSource top={hero ? 58 : 48} left={hero ? 36 : 18} icon={reservations.icon} label={reservations.label} text={reservations.text} />
      <FlowSource top={hero ? 30 : 36} left="50%" center icon={website.icon} label={website.label} text={website.text} large />
      <FlowSource top={hero ? 58 : 48} right={hero ? 36 : 18} icon={qr.icon} label={qr.label} text={qr.text} />
      <FlowSource bottom={hero ? 110 : 82} left={hero ? 36 : 18} icon={marketing.icon} label={marketing.label} text={marketing.text} />
      <FlowSource bottom={hero ? 110 : 82} right={hero ? 36 : 18} icon={pos.icon} label={pos.label} text={pos.text} />

      <motion.div animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 40px rgba(34,211,238,.25)", "0 0 90px rgba(167,139,250,.55)", "0 0 40px rgba(34,211,238,.25)"] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} className="absolute left-1/2 top-[245px] z-10 flex h-36 w-36 -translate-x-1/2 flex-col items-center justify-center rounded-[40px] border border-cyan-300/30 bg-[#06111f]/95 text-center lg:top-[270px] lg:h-44 lg:w-44">
        <span className="text-4xl">〽️</span>
        <span className="mt-2 bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-xl font-black text-transparent lg:text-2xl">{t.flow.center}</span>
        <motion.span animate={{ opacity: [0.45, 1, 0.45] }} transition={{ duration: 1.4, repeat: Infinity }} className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{t.flow.subtitle}</motion.span>
      </motion.div>

      <motion.div animate={{ y: [0, -5, 0], opacity: [0.88, 1, 0.88] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 rounded-full border border-cyan-400/20 bg-cyan-500/15 px-5 py-3 text-sm font-black text-cyan-200 shadow-[0_0_35px_rgba(34,211,238,0.18)]">
        📊 {t.flow.bottom}
      </motion.div>

      <FlowParticle delay={0} fromX={210} fromY={90} />
      <FlowParticle delay={0.8} fromX={70} fromY={160} />
      <FlowParticle delay={1.6} fromX={350} fromY={160} />
      <FlowParticle delay={2.4} fromX={70} fromY={455} />
      <FlowParticle delay={3.2} fromX={350} fromY={455} />
    </div>
  );
}

function FlowSource({ top, bottom, left, right, center, icon, label, text, large }: { top?: number; bottom?: number; left?: number | string; right?: number; center?: boolean; icon: string; label: string; text: string; large?: boolean }) {
  return (
    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} style={{ top, bottom, left, right }} className={(center ? "absolute z-10 -translate-x-1/2 " : "absolute z-10 ") + (large ? "min-w-[150px] rounded-[28px] border border-white/10 bg-[#020617]/90 px-5 py-5 text-center backdrop-blur" : "max-w-[150px] rounded-[24px] border border-white/10 bg-[#020617]/90 px-4 py-4 backdrop-blur")}>
      <p className="text-3xl">{icon}</p>
      <p className="mt-2 text-sm font-black leading-tight">{label}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{text}</p>
    </motion.div>
  );
}

function FlowParticle({ delay, fromX, fromY }: { delay: number; fromX: number; fromY: number }) {
  return <motion.div initial={{ x: fromX, y: fromY, opacity: 0 }} animate={{ x: 210, y: 330, opacity: [0, 1, 1, 0] }} transition={{ duration: 2.8, repeat: Infinity, delay, ease: "easeInOut" }} className="absolute z-20 h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_22px_rgba(34,211,238,1)]" />;
}

function HeroStat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return <motion.div whileInView={{ y: [12, 0], opacity: [0, 1] }} viewport={{ once: true }} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur"><p className="text-lg">{icon}</p><p className="mt-1 text-sm font-black text-cyan-300">{value}</p><p className="text-[10px] text-slate-400">{label}</p></motion.div>;
}

function BigCard({ number, title, text }: { number: string; title: string; text: string }) {
  return <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} viewport={{ once: true, margin: "-80px" }} className="relative overflow-hidden rounded-[30px] border border-cyan-300/20 bg-[#06111f] p-6 shadow-[0_0_45px_rgba(34,211,238,0.08)]"><div className="absolute right-5 top-4 text-6xl font-black text-cyan-300/10">{number}</div><p className="mb-3 text-xs font-black text-cyan-300">{number}</p><h3 className="mb-3 text-2xl font-black">{title}</h3><p className="text-sm leading-relaxed text-slate-400">{text}</p></motion.div>;
}

function AiItem({ title, text }: { title: string; text: string }) {
  return <motion.div initial={{ opacity: 0, x: -22 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }} viewport={{ once: true }} className="rounded-2xl border border-cyan-300/10 bg-white/[0.04] p-4"><h3 className="text-base font-black text-white">{title}</h3><p className="mt-1 text-sm text-slate-400">{text}</p></motion.div>;
}

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45 }} viewport={{ once: true }} className="rounded-[30px] border border-cyan-300/10 bg-[#06111f] p-6"><p className="text-3xl">{icon}</p><h3 className="mt-4 text-2xl font-black">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p></motion.div>;
}

function TemplateCard({ name, text }: { name: string; text: string }) {
  return <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} viewport={{ once: true }} className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-3"><div className="h-52 rounded-[22px] bg-gradient-to-br from-slate-950 via-slate-800 to-cyan-900 p-4"><div className="mb-4 h-20 rounded-2xl bg-white/10" /><div className="mb-2 h-3 w-3/4 rounded-full bg-white/30" /><div className="mb-5 h-3 w-1/2 rounded-full bg-white/20" /><div className="inline-flex rounded-full bg-cyan-300 px-4 py-2 text-xs font-black text-black">Book</div></div><div className="p-3"><h3 className="text-xl font-black">{name}</h3><p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p></div></motion.div>;
}

function PriceCard({ title, price, text, items, cta, href, highlighted, popular }: { title: string; price: string; text: string; items: string[]; cta: string; href: string; highlighted?: boolean; popular: string }) {
  return <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} viewport={{ once: true }} className={highlighted ? "relative overflow-hidden rounded-[32px] border border-cyan-300/30 bg-gradient-to-b from-cyan-300/20 to-white/[0.04] p-7 shadow-[0_0_80px_rgba(34,211,238,0.22)]" : "relative overflow-hidden rounded-[32px] border border-cyan-300/10 bg-[#06111f] p-7"}>{highlighted && <span className="mb-5 inline-flex rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-black">{popular}</span>}<h3 className="text-2xl font-black">{title}</h3><p className="mt-4 text-5xl font-black text-cyan-300">{price}</p><p className="mt-4 text-sm leading-relaxed text-slate-400">{text}</p><ul className="mt-6 space-y-3 text-sm text-slate-300">{items.map((item) => <li key={item}>✓ {item}</li>)}</ul><Link href={href} className={highlighted ? "mt-7 inline-flex w-full justify-center rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-black hover:opacity-90" : "mt-7 inline-flex w-full justify-center rounded-full border border-cyan-300/20 bg-white/5 px-5 py-3 text-sm font-black text-white hover:bg-white/10"}>{cta}</Link></motion.div>;
}
