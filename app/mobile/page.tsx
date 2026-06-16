"use client";

import Footer from "@/components/Footer";
import Link from "next/link";
import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";

type Lang = "pt" | "en" | "es" | "fr" | "de";

const languages: { code: Lang; label: string; flag: string }[] = [
  { code: "pt", label: "PT", flag: "🇵🇹" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "es", label: "ES", flag: "🇪🇸" },
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "de", label: "DE", flag: "🇩🇪" },
];

const copy = {
  pt: {
    login: "Entrar",
    start: "Começar grátis",
    demo: "Ver demo",
    badge: "Sistema Operativo para Restaurantes",
    heroTitleA: "Tudo o que o seu restaurante precisa",
    heroTitleB: "numa única app.",
    heroText:
      "Website, reservas, QR Ordering, gestão de mesas e clientes numa única plataforma. Tudo ligado para o seu restaurante funcionar melhor.",
    proof1: "Até 100 reservas/mês grátis",
    proof2: "Sem cartão de crédito",
    proof3: "Configuração em minutos",
    phoneKicker: "MesaLink OS",
    phoneTitle: "Dashboard",
    reservations: "Reservas",
    people: "Pessoas",
    occupancy: "Ocup.",
    revenue: "Receita",
    nextBooking: "Próxima reserva",
    confirmed: "Confirmada",
    websiteBadge: "Website profissional",
    websiteTitleA: "O website que o seu",
    websiteTitleB: "restaurante merece.",
    websiteText:
      "Escolha um template, adicione imagens, menus em PDF, galeria, contactos, SEO e reservas integradas. Sem programar. Sem agência.",
    premium: "Premium",
    luxury: "Luxury",
    minimal: "Minimal",
    social: "Social",
    premiumText: "Para restaurantes modernos com presença forte.",
    luxuryText: "Para conceitos premium, fine dining e experiências exclusivas.",
    minimalText: "Para restaurantes que querem uma imagem limpa e direta.",
    socialText: "Para marcas jovens, visuais e ligadas às redes sociais.",
    book: "Reservar",
    networkBadge: "Tudo ligado",
    networkTitleA: "Uma plataforma.",
    networkTitleB: "Todo o restaurante.",
    networkText:
      "O MesaLink liga website, reservas, QR Ordering, clientes e dados numa única plataforma.",
    modules: [
      ["🌐", "Website", "Online 24/7"],
      ["📅", "Gestão de Reservas", "Todos os canais"],
      ["📲", "QR Ordering", "Menu, pedidos e conta"],
      ["📣", "Marketing", "Atrair e fidelizar"],
      ["💳", "POS", "Vendas e operação"],
      ["📊", "Dados e Relatórios", "Tudo num só lugar"],
    ],
    today: "Disponível hoje",
    soon: "A caminho",
    todayItems: ["Reservas online", "Gestão de mesas", "Clientes", "Website profissional", "QR Ordering"],
    soonItems: ["Marketing", "POS integrado", "IA para restaurantes"],
    pricingBadge: "Preços simples",
    pricingTitle: "Comece grátis. Cresça quando precisar.",
    free: "Free",
    pro: "Pro",
    website: "Website",
    perMonth: "/mês",
    freeDesc: "Até 100 reservas por mês.",
    proDesc: "Reservas ilimitadas e gestão de mesas.",
    websiteDesc: "Website profissional com reservas integradas.",
    qrOrdering: "QR Ordering",
    qrBadge: "QR Ordering",
    qrTitleA: "Os clientes pedem.",
    qrTitleB: "O restaurante controla.",
    qrText: "Menu digital por QR, pedidos por mesa, chamar empregado e pedir conta. Tudo integrado no MesaLink.",
    qrItems: ["Menu digital por QR", "Pedidos por mesa", "Chamar empregado", "Pedir conta", "Alertas em tempo real", "QR Codes personalizados", "Templates de QR"],
    qrPriceText: "Menu digital, pedidos por mesa, chamar empregado e pedir conta.",
    qrPriceBadge: "Disponível por apenas +15€/mês",
    ctaTitle: "Comece gratuitamente hoje.",
    ctaText:
      "Receba reservas online e prepare o seu restaurante para uma plataforma completa de restauração.",
  },
  en: {
    login: "Log in",
    start: "Start for free",
    demo: "View demo",
    badge: "The Restaurant Operating System",
    heroTitleA: "Everything your restaurant needs",
    heroTitleB: "in one app.",
    heroText:
      "Website, reservations, QR Ordering, table management and customers in one platform. Everything connected so your restaurant runs better.",
    proof1: "Up to 100 reservations/month free",
    proof2: "No credit card required",
    proof3: "Set up in minutes",
    phoneKicker: "MesaLink OS",
    phoneTitle: "Dashboard",
    reservations: "Reservations",
    people: "People",
    occupancy: "Occup.",
    revenue: "Revenue",
    nextBooking: "Next booking",
    confirmed: "Confirmed",
    websiteBadge: "Professional website",
    websiteTitleA: "The website your",
    websiteTitleB: "restaurant deserves.",
    websiteText:
      "Choose a template, add images, PDF menus, gallery, contacts, SEO and integrated reservations. No code. No agency.",
    premium: "Premium",
    luxury: "Luxury",
    minimal: "Minimal",
    social: "Social",
    premiumText: "For modern restaurants with a strong presence.",
    luxuryText: "For premium concepts, fine dining and exclusive experiences.",
    minimalText: "For restaurants that want a clean and direct image.",
    socialText: "For young, visual and social-first brands.",
    book: "Book",
    networkBadge: "All connected",
    networkTitleA: "One platform.",
    networkTitleB: "The whole restaurant.",
    networkText:
      "MesaLink connects websites, reservations, QR Ordering, customers and data in one platform.",
    modules: [
      ["🌐", "Website", "Online 24/7"],
      ["📅", "Reservation Management", "All channels"],
      ["📲", "QR Ordering", "Menu, orders and bill"],
      ["📣", "Marketing", "Attract and retain"],
      ["💳", "POS", "Sales and operations"],
      ["📊", "Data & Reports", "All in one place"],
    ],
    today: "Available today",
    soon: "Coming soon",
    todayItems: ["Online reservations", "Table management", "Customers", "Professional website", "QR Ordering"],
    soonItems: ["Marketing", "Integrated POS", "AI for restaurants"],
    pricingBadge: "Simple pricing",
    pricingTitle: "Start free. Upgrade when you need.",
    free: "Free",
    pro: "Pro",
    website: "Website",
    perMonth: "/month",
    freeDesc: "Up to 100 reservations per month.",
    proDesc: "Unlimited reservations and table management.",
    websiteDesc: "Professional website with integrated reservations.",
    qrOrdering: "QR Ordering",
    qrBadge: "QR Ordering",
    qrTitleA: "Customers order.",
    qrTitleB: "The restaurant controls.",
    qrText: "Digital QR menu, table orders, call waiter and request the bill. Everything integrated into MesaLink.",
    qrItems: ["Digital QR menu", "Table orders", "Call waiter", "Request the bill", "Real-time alerts", "Custom QR Codes", "QR templates"],
    qrPriceText: "Digital menu, table orders, call waiter and request the bill.",
    qrPriceBadge: "Available for only +€15/month",
    ctaTitle: "Start for free today.",
    ctaText:
      "Receive online reservations and prepare your restaurant for a complete restaurant platform.",
  },
  es: {
    login: "Entrar",
    start: "Empezar gratis",
    demo: "Ver demo",
    badge: "El Sistema Operativo para Restaurantes",
    heroTitleA: "Todo lo que tu restaurante necesita",
    heroTitleB: "en una sola app.",
    heroText:
      "Web, reservas, QR Ordering, gestión de mesas y clientes en una sola plataforma. Todo conectado para que tu restaurante funcione mejor.",
    proof1: "Hasta 100 reservas/mes gratis",
    proof2: "Sin tarjeta de crédito",
    proof3: "Configuración en minutos",
    phoneKicker: "MesaLink OS",
    phoneTitle: "Dashboard",
    reservations: "Reservas",
    people: "Personas",
    occupancy: "Ocup.",
    revenue: "Ingresos",
    nextBooking: "Próxima reserva",
    confirmed: "Confirmada",
    websiteBadge: "Web profesional",
    websiteTitleA: "La web que tu",
    websiteTitleB: "restaurante merece.",
    websiteText:
      "Elige una plantilla, añade imágenes, menús PDF, galería, contactos, SEO y reservas integradas. Sin código. Sin agencia.",
    premium: "Premium",
    luxury: "Luxury",
    minimal: "Minimal",
    social: "Social",
    premiumText: "Para restaurantes modernos con una presencia fuerte.",
    luxuryText: "Para conceptos premium, fine dining y experiencias exclusivas.",
    minimalText: "Para restaurantes que quieren una imagen limpia y directa.",
    socialText: "Para marcas jóvenes, visuales y conectadas a redes sociales.",
    book: "Reservar",
    networkBadge: "Todo conectado",
    networkTitleA: "Una plataforma.",
    networkTitleB: "Todo el restaurante.",
    networkText:
      "MesaLink conecta web, reservas, QR Ordering, clientes y datos en una sola plataforma.",
    modules: [
      ["🌐", "Web", "Online 24/7"],
      ["📅", "Gestión de Reservas", "Todos los canales"],
      ["📲", "QR Ordering", "Menú, pedidos y cuenta"],
      ["📣", "Marketing", "Atraer y fidelizar"],
      ["💳", "POS", "Ventas y operación"],
      ["📊", "Datos e Informes", "Todo en un lugar"],
    ],
    today: "Disponible hoy",
    soon: "Próximamente",
    todayItems: ["Reservas online", "Gestión de mesas", "Clientes", "Web profesional", "QR Ordering"],
    soonItems: ["Marketing", "POS integrado", "IA para restaurantes"],
    pricingBadge: "Precios simples",
    pricingTitle: "Empieza gratis. Crece cuando lo necesites.",
    free: "Free",
    pro: "Pro",
    website: "Website",
    perMonth: "/mes",
    freeDesc: "Hasta 100 reservas por mes.",
    proDesc: "Reservas ilimitadas y gestión de mesas.",
    websiteDesc: "Web profesional con reservas integradas.",
    qrOrdering: "QR Ordering",
    qrBadge: "QR Ordering",
    qrTitleA: "Los clientes piden.",
    qrTitleB: "El restaurante controla.",
    qrText: "Menú digital por QR, pedidos por mesa, llamar al camarero y pedir la cuenta. Todo integrado en MesaLink.",
    qrItems: ["Menú digital por QR", "Pedidos por mesa", "Llamar al camarero", "Pedir la cuenta", "Alertas en tiempo real", "QR Codes personalizados", "Plantillas de QR"],
    qrPriceText: "Menú digital, pedidos por mesa, llamar al camarero y pedir la cuenta.",
    qrPriceBadge: "Disponible por solo +15€/mes",
    ctaTitle: "Empieza gratis hoy.",
    ctaText:
      "Recibe reservas online y prepara tu restaurante para una plataforma completa de restauración.",
  },
  fr: {
    login: "Connexion",
    start: "Commencer gratuitement",
    demo: "Voir la démo",
    badge: "Le Système d’Exploitation pour Restaurants",
    heroTitleA: "Tout ce dont votre restaurant a besoin",
    heroTitleB: "dans une seule app.",
    heroText:
      "Site web, réservations, QR Ordering, gestion des tables et clients dans une seule plateforme. Tout connecté pour mieux gérer votre restaurant.",
    proof1: "Jusqu’à 100 réservations/mois gratuites",
    proof2: "Aucune carte bancaire requise",
    proof3: "Configuration en quelques minutes",
    phoneKicker: "MesaLink OS",
    phoneTitle: "Dashboard",
    reservations: "Réservations",
    people: "Personnes",
    occupancy: "Occup.",
    revenue: "Revenus",
    nextBooking: "Prochaine réservation",
    confirmed: "Confirmée",
    websiteBadge: "Site web professionnel",
    websiteTitleA: "Le site web que votre",
    websiteTitleB: "restaurant mérite.",
    websiteText:
      "Choisissez un modèle, ajoutez images, menus PDF, galerie, contacts, SEO et réservations intégrées. Sans code. Sans agence.",
    premium: "Premium",
    luxury: "Luxury",
    minimal: "Minimal",
    social: "Social",
    premiumText: "Pour les restaurants modernes avec une forte présence.",
    luxuryText: "Pour les concepts premium, fine dining et expériences exclusives.",
    minimalText: "Pour les restaurants qui veulent une image claire et directe.",
    socialText: "Pour les marques jeunes, visuelles et sociales.",
    book: "Réserver",
    networkBadge: "Tout connecté",
    networkTitleA: "Une plateforme.",
    networkTitleB: "Tout le restaurant.",
    networkText:
      "MesaLink connecte site web, réservations, QR Ordering, clients et données dans une seule plateforme.",
    modules: [
      ["🌐", "Site web", "Online 24/7"],
      ["📅", "Gestion des Réservations", "Tous les canaux"],
      ["📲", "QR Ordering", "Menu, commandes et addition"],
      ["📣", "Marketing", "Attirer et fidéliser"],
      ["💳", "POS", "Ventes et opérations"],
      ["📊", "Données & Rapports", "Tout au même endroit"],
    ],
    today: "Disponible aujourd’hui",
    soon: "Bientôt",
    todayItems: ["Réservations en ligne", "Gestion des tables", "Clients", "Site web professionnel", "QR Ordering"],
    soonItems: ["Marketing", "POS intégré", "IA pour restaurants"],
    pricingBadge: "Prix simples",
    pricingTitle: "Commencez gratuitement. Évoluez quand vous voulez.",
    free: "Free",
    pro: "Pro",
    website: "Website",
    perMonth: "/mois",
    freeDesc: "Jusqu’à 100 réservations par mois.",
    proDesc: "Réservations illimitées et gestion des tables.",
    websiteDesc: "Site web professionnel avec réservations intégrées.",
    qrOrdering: "QR Ordering",
    qrBadge: "QR Ordering",
    qrTitleA: "Les clients commandent.",
    qrTitleB: "Le restaurant contrôle.",
    qrText: "Menu digital par QR, commandes à table, appel serveur et demande d’addition. Tout intégré dans MesaLink.",
    qrItems: ["Menu digital par QR", "Commandes à table", "Appeler le serveur", "Demander l’addition", "Alertes en temps réel", "QR Codes personnalisés", "Templates QR"],
    qrPriceText: "Menu digital, commandes à table, appel serveur et demande d’addition.",
    qrPriceBadge: "Disponible pour seulement +15€/mois",
    ctaTitle: "Commencez gratuitement aujourd’hui.",
    ctaText:
      "Recevez des réservations en ligne et préparez votre restaurant à une plateforme complète.",
  },
  de: {
    login: "Einloggen",
    start: "Kostenlos starten",
    demo: "Demo ansehen",
    badge: "Das Betriebssystem für Restaurants",
    heroTitleA: "Alles, was Ihr Restaurant braucht",
    heroTitleB: "in einer einzigen App.",
    heroText:
      "Website, Reservierungen, QR Ordering, Tischverwaltung und Kunden in einer Plattform. Alles verbunden, damit Ihr Restaurant besser läuft.",
    proof1: "Bis zu 100 Reservierungen/Monat kostenlos",
    proof2: "Keine Kreditkarte erforderlich",
    proof3: "Einrichtung in wenigen Minuten",
    phoneKicker: "MesaLink OS",
    phoneTitle: "Dashboard",
    reservations: "Reservierungen",
    people: "Gäste",
    occupancy: "Auslast.",
    revenue: "Umsatz",
    nextBooking: "Nächste Reservierung",
    confirmed: "Bestätigt",
    websiteBadge: "Professionelle Website",
    websiteTitleA: "Die Website, die Ihr",
    websiteTitleB: "Restaurant verdient.",
    websiteText:
      "Wählen Sie eine Vorlage, fügen Sie Bilder, PDF-Menüs, Galerie, Kontakte, SEO und integrierte Reservierungen hinzu. Kein Code. Keine Agentur.",
    premium: "Premium",
    luxury: "Luxury",
    minimal: "Minimal",
    social: "Social",
    premiumText: "Für moderne Restaurants mit starker Präsenz.",
    luxuryText: "Für Premium-Konzepte, Fine Dining und exklusive Erlebnisse.",
    minimalText: "Für Restaurants mit einem klaren, direkten Auftritt.",
    socialText: "Für junge, visuelle und social-first Marken.",
    book: "Reservieren",
    networkBadge: "Alles verbunden",
    networkTitleA: "Eine Plattform.",
    networkTitleB: "Das ganze Restaurant.",
    networkText:
      "MesaLink verbindet Website, Reservierungen, QR Ordering, Kunden und Daten in einer Plattform.",
    modules: [
      ["🌐", "Website", "Online 24/7"],
      ["📅", "Reservierungsverwaltung", "Alle Kanäle"],
      ["📲", "QR Ordering", "Menü, Bestellungen und Rechnung"],
      ["📣", "Marketing", "Gewinnen & binden"],
      ["💳", "POS", "Verkauf & Betrieb"],
      ["📊", "Daten & Berichte", "Alles an einem Ort"],
    ],
    today: "Heute verfügbar",
    soon: "Demnächst",
    todayItems: ["Online-Reservierungen", "Tischverwaltung", "Kunden", "Professionelle Website", "QR Ordering"],
    soonItems: ["Marketing", "Integrierter POS", "KI für Restaurants"],
    pricingBadge: "Einfache Preise",
    pricingTitle: "Kostenlos starten. Wachsen, wenn Sie bereit sind.",
    free: "Free",
    pro: "Pro",
    website: "Website",
    perMonth: "/Monat",
    freeDesc: "Bis zu 100 Reservierungen pro Monat.",
    proDesc: "Unbegrenzte Reservierungen und Tischverwaltung.",
    websiteDesc: "Professionelle Website mit integrierten Reservierungen.",
    qrOrdering: "QR Ordering",
    qrBadge: "QR Ordering",
    qrTitleA: "Gäste bestellen.",
    qrTitleB: "Das Restaurant kontrolliert.",
    qrText: "Digitales QR-Menü, Tischbestellungen, Kellner rufen und Rechnung anfordern. Alles in MesaLink integriert.",
    qrItems: ["Digitales QR-Menü", "Tischbestellungen", "Kellner rufen", "Rechnung anfordern", "Echtzeit-Benachrichtigungen", "Individuelle QR Codes", "QR Templates"],
    qrPriceText: "Digitales Menü, Tischbestellungen, Kellner rufen und Rechnung anfordern.",
    qrPriceBadge: "Verfügbar für nur +15€/Monat",
    ctaTitle: "Starten Sie heute kostenlos.",
    ctaText:
      "Erhalten Sie Online-Reservierungen und bereiten Sie Ihr Restaurant auf eine vollständige Plattform vor.",
  },
} as const;

export default function MobilePage() {
  const [lang, setLang] = useState<Lang>("pt");
  const t = copy[lang];

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -34]);
  const phoneRotate = useTransform(scrollYProgress, [0, 0.25], [-2, 2]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 px-4 pb-12 pt-4 sm:px-5">
        <nav className="mx-auto mb-10 flex max-w-md items-center justify-between">
          <Link href="/" className="text-2xl font-black">
            Mesa
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Link
            </span>
          </Link>

          <Link
            href="/login"
            className="rounded-full border border-cyan-300/30 bg-white/5 px-4 py-2 text-sm font-black text-cyan-200 backdrop-blur"
          >
            {t.login}
          </Link>
        </nav>

        <motion.div style={{ y: heroY }} className="mx-auto max-w-md">
          <Badge>{t.badge}</Badge>

          <h1 className="mt-5 text-[44px] font-black leading-[0.9] tracking-[-0.06em] min-[390px]:text-[50px]">
            {t.heroTitleA}{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-400 bg-clip-text text-transparent">
              {t.heroTitleB}
            </span>
          </h1>

          <p className="mt-5 text-[16px] leading-relaxed text-slate-300">
            {t.heroText}
          </p>

          <div className="mt-6 grid gap-3">
            <Button
              asChild
              className="h-14 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-base font-black text-black shadow-[0_0_70px_rgba(96,165,250,0.45)] hover:opacity-90"
            >
              <Link href="/register">{t.start} →</Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-14 rounded-full border-cyan-300/30 bg-white/5 text-base font-black text-white backdrop-blur hover:bg-white/10"
            >
              <Link href="#websites">{t.demo} →</Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-2 text-sm text-slate-300">
            <Proof>{t.proof1}</Proof>
            <Proof>{t.proof2}</Proof>
            <Proof>{t.proof3}</Proof>
          </div>

          <LanguageSelector lang={lang} setLang={setLang} />
        </motion.div>

        <motion.div style={{ rotate: phoneRotate }} className="mx-auto mt-10 max-w-[330px]">
          <PhoneHero t={t} />
        </motion.div>
      </section>

      <StickyBar t={t} />

      <section id="websites" className="relative z-10 px-4 py-14 sm:px-5">
        <div className="mx-auto max-w-md">
          <Badge>{t.websiteBadge}</Badge>

          <h2 className="mt-5 text-[39px] font-black leading-[0.92] tracking-[-0.055em]">
            {t.websiteTitleA}{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
              {t.websiteTitleB}
            </span>
          </h2>

          <p className="mt-5 text-base leading-relaxed text-slate-400">
            {t.websiteText}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-300">
            <Proof>PDF menus</Proof>
            <Proof>SEO</Proof>
            <Proof>Google Maps</Proof>
            <Proof>Gallery</Proof>
            <Proof>Contacts</Proof>
            <Proof>Reservations</Proof>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-md snap-x gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TemplateCard
            name={t.premium}
            text={t.premiumText}
            cta={t.book}
            variant="premium"
          />
          <TemplateCard
            name={t.luxury}
            text={t.luxuryText}
            cta={t.book}
            variant="luxury"
          />
          <TemplateCard
            name={t.minimal}
            text={t.minimalText}
            cta={t.book}
            variant="minimal"
          />
          <TemplateCard
            name={t.social}
            text={t.socialText}
            cta={t.book}
            variant="social"
          />
        </div>
      </section>

      <section id="qr-ordering" className="relative z-10 px-4 py-14 sm:px-5">
        <div className="mx-auto max-w-md">
          <Badge>{t.qrBadge}</Badge>

          <h2 className="mt-5 text-[39px] font-black leading-[0.92] tracking-[-0.055em]">
            {t.qrTitleA}
            <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
              {t.qrTitleB}
            </span>
          </h2>

          <p className="mt-5 text-base leading-relaxed text-slate-400">
            {t.qrText}
          </p>

          <div className="mt-6 grid gap-3">
            {t.qrItems.map((item) => (
              <Proof key={item}>{item}</Proof>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-[28px] border border-cyan-300/20 bg-[#06111f]/90 p-5 shadow-[0_0_80px_rgba(34,211,238,0.14)] backdrop-blur">
            <div className="grid gap-3">
              <QrEvent icon="📲" text="Mesa 12 · Pedido recebido" />
              <QrEvent icon="🔔" text="Mesa 7 · Chamou empregado" />
              <QrEvent icon="💳" text="Mesa 4 · Pediu conta" />
            </div>

            <div className="mt-5 rounded-[24px] border border-cyan-300/20 bg-cyan-400/10 p-4">
              <p className="font-black text-cyan-300">{t.qrPriceBadge}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-14 sm:px-5">
        <div className="mx-auto max-w-md">
          <Badge>{t.networkBadge}</Badge>

          <h2 className="mt-5 text-[39px] font-black leading-[0.92] tracking-[-0.055em]">
            {t.networkTitleA}{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
              {t.networkTitleB}
            </span>
          </h2>

          <p className="mt-5 text-base leading-relaxed text-slate-400">
            {t.networkText}
          </p>

          <ModuleGrid modules={t.modules} />
        </div>
      </section>

      <section className="relative z-10 px-4 py-14 sm:px-5">
        <div className="mx-auto max-w-md rounded-[32px] border border-cyan-300/15 bg-[#06111f]/85 p-5 shadow-[0_0_80px_rgba(34,211,238,0.14)] backdrop-blur">
          <div className="grid gap-4">
            <Roadmap title={t.today} items={t.todayItems} />
            <Roadmap title={t.soon} items={t.soonItems} upcoming />
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-14 sm:px-5">
        <div className="mx-auto max-w-md">
          <Badge>{t.pricingBadge}</Badge>

          <h2 className="mt-5 text-[39px] font-black leading-[0.92] tracking-[-0.055em]">
            {t.pricingTitle}
          </h2>

          <div className="mt-8 grid gap-4">
            <PriceCard title={t.free} price="0€" suffix={t.perMonth} text={t.freeDesc} />
            <PriceCard title={t.pro} price="10€" suffix={t.perMonth} text={t.proDesc} highlight />
            <PriceCard title={t.website} price="+10€" suffix={t.perMonth} text={t.websiteDesc} />
            <PriceCard title={t.qrOrdering} price="+15€" suffix={t.perMonth} text={t.qrPriceText} />
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 pb-16 pt-8 sm:px-5">
        <div className="mx-auto max-w-md overflow-hidden rounded-[32px] border border-cyan-300/20 bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500 p-6 text-black shadow-[0_0_100px_rgba(96,165,250,0.45)]">
          <h2 className="text-[38px] font-black leading-[0.9] tracking-[-0.06em]">
            {t.ctaTitle}
          </h2>

          <p className="mt-5 text-base leading-relaxed text-black/70">
            {t.ctaText}
          </p>

          <Button
            asChild
            className="mt-7 h-14 w-full rounded-full bg-black text-base font-black text-white hover:bg-black/90"
          >
            <Link href="/register">{t.start} →</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function LanguageSelector({
  lang,
  setLang,
}: {
  lang: Lang;
  setLang: (lang: Lang) => void;
}) {
  return (
    <div className="mt-6 rounded-3xl border border-cyan-300/15 bg-white/[0.035] p-2 backdrop-blur">
      <div className="grid grid-cols-5 gap-1">
        {languages.map((language) => (
          <button
            key={language.code}
            type="button"
            onClick={() => setLang(language.code)}
            className={
              lang === language.code
                ? "rounded-2xl bg-cyan-300 px-2 py-2 text-xs font-black text-black"
                : "rounded-2xl px-2 py-2 text-xs font-black text-slate-300 hover:bg-white/10"
            }
          >
            <span className="mr-1">{language.flag}</span>
            {language.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <motion.div
        animate={{ scale: [1, 1.16, 1], y: [0, 42, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-[-160px] h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[110px]"
      />

      <motion.div
        animate={{ x: [0, -35, 0], y: [0, 50, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[-190px] top-[520px] h-[320px] w-[320px] rounded-full bg-violet-500/20 blur-[100px]"
      />

      <motion.div
        animate={{ opacity: [0.09, 0.22, 0.09] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.06)_1px,transparent_1px)] bg-[size:38px_38px]"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.16),transparent_35%),linear-gradient(to_bottom,#020617,#050816_35%,#020617)]" />
    </div>
  );
}

function StickyBar({ t }: { t: (typeof copy)[Lang] }) {
  return (
    <section className="sticky top-0 z-30 border-y border-cyan-300/10 bg-[#020617]/82 px-4 py-3 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
            MesaLink
          </p>
          <p className="text-sm font-bold text-white">
            Website · Reservas · QR
          </p>
        </div>

        <Link
          href="/register"
          className="rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-4 py-2 text-sm font-black text-black"
        >
          {t.start}
        </Link>
      </div>
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-flex rounded-full border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
      {children}
    </span>
  );
}

function Proof({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-start gap-2 leading-snug">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-cyan-300 text-[10px] text-cyan-300">
        ✓
      </span>
      <span>{children}</span>
    </span>
  );
}

function PhoneHero({ t }: { t: (typeof copy)[Lang] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 45, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.85, delay: 0.15 }}
      className="relative"
    >
      <div className="absolute inset-0 translate-y-10 rounded-[48px] bg-cyan-500/25 blur-[80px]" />
      <div className="absolute inset-0 translate-y-16 rounded-[48px] bg-violet-500/20 blur-[100px]" />

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative rounded-[42px] border border-cyan-300/35 bg-gradient-to-b from-[#0b1b2c] via-[#071426] to-[#020617] p-3 shadow-2xl"
      >
        <div className="mx-auto mb-3 h-1.5 w-20 rounded-full bg-cyan-300/50" />

        <div className="rounded-[32px] border border-white/10 bg-black/45 p-4 backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">{t.phoneKicker}</p>
              <h3 className="text-2xl font-black">{t.phoneTitle}</h3>
            </div>

            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-black text-cyan-300">
              LIVE
            </span>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <Dash value="32" label={t.reservations} />
            <Dash value="128" label={t.people} />
            <Dash value="87%" label={t.occupancy} />
            <Dash value="€2.450" label={t.revenue} />
          </div>

          <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 shadow-[0_0_35px_rgba(34,211,238,0.18)]">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
              {t.nextBooking}
            </p>
            <p className="text-2xl font-black text-cyan-200">
              20:00 <span className="text-white">· 4 pax</span>
            </p>
            <p className="mt-1 text-sm text-slate-300">{t.confirmed}</p>
          </div>

          <Reservation time="20:00" name="João Silva" status={t.confirmed} />
          <Reservation time="20:30" name="Ana Costa" status={t.confirmed} />
          <Reservation time="21:00" name="Pedro Santos" status={t.confirmed} />
        </div>
      </motion.div>
    </motion.div>
  );
}

function TemplateCard({
  name,
  text,
  cta,
  variant,
}: {
  name: string;
  text: string;
  cta: string;
  variant: "premium" | "luxury" | "minimal" | "social";
}) {
  const styles = {
    premium: "from-amber-950 via-neutral-950 to-black",
    luxury: "from-neutral-950 via-stone-900 to-amber-950",
    minimal: "from-slate-100 via-white to-cyan-50 text-black",
    social: "from-fuchsia-950 via-violet-950 to-cyan-950",
  };

  return (
    <article className="min-w-[82%] snap-center rounded-[30px] border border-cyan-300/15 bg-white/[0.045] p-4 backdrop-blur">
      <div className={`overflow-hidden rounded-[24px] bg-gradient-to-br ${styles[variant]} p-5`}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">
            {name}
          </p>
          <div className="space-y-1">
            <span className="block h-0.5 w-4 bg-current opacity-70" />
            <span className="block h-0.5 w-4 bg-current opacity-70" />
          </div>
        </div>

        <div className="mt-12">
          <h3 className="max-w-[12rem] text-3xl font-black leading-[0.95]">
            {variant === "premium" && "Modern dining, made simple."}
            {variant === "luxury" && "Fine dining, unforgettable nights."}
            {variant === "minimal" && "Clean menu. Easy booking."}
            {variant === "social" && "Made for social restaurants."}
          </h3>

          <button className="mt-5 rounded-full bg-cyan-300 px-5 py-2 text-sm font-black text-black">
            {cta}
          </button>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-2">
          <div className="h-16 rounded-2xl bg-white/20" />
          <div className="h-16 rounded-2xl bg-white/20" />
          <div className="h-16 rounded-2xl bg-white/20" />
        </div>
      </div>

      <h3 className="mt-5 text-2xl font-black">{name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
    </article>
  );
}

function ModuleGrid({
  modules,
}: {
  modules: readonly (readonly [string, string, string])[];
}) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3">
      {modules.map(([icon, title, text]) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          viewport={{ once: true, margin: "-60px" }}
          className="rounded-[26px] border border-cyan-300/12 bg-white/[0.045] p-4 backdrop-blur"
        >
          <p className="text-3xl">{icon}</p>
          <h3 className="mt-4 text-base font-black">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{text}</p>
        </motion.div>
      ))}
    </div>
  );
}

function Roadmap({
  title,
  items,
  upcoming,
}: {
  title: string;
  items: readonly string[];
  upcoming?: boolean;
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
      <h3 className="text-xl font-black">{title}</h3>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <p key={item} className="flex items-center gap-2 text-sm text-slate-300">
            <span>{upcoming ? "🚀" : "✓"}</span>
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function QrEvent({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.045] p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-400/10 text-xl">
        {icon}
      </span>
      <p className="text-sm font-bold text-slate-200">{text}</p>
    </div>
  );
}

function PriceCard({
  title,
  price,
  suffix,
  text,
  highlight,
}: {
  title: string;
  price: string;
  suffix: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-[30px] border border-cyan-300/30 bg-gradient-to-br from-cyan-400/15 to-violet-500/15 p-6 shadow-[0_0_60px_rgba(96,165,250,0.2)]"
          : "rounded-[30px] border border-white/10 bg-white/[0.04] p-6"
      }
    >
      <h3 className="text-2xl font-black">{title}</h3>
      <p className="mt-4 text-5xl font-black">
        {price}
        <span className="ml-1 text-sm text-slate-400">{suffix}</span>
      </p>
      <p className="mt-4 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

function Dash({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] text-cyan-300">{label}</p>
    </div>
  );
}

function Reservation({
  time,
  name,
  status,
}: {
  time: string;
  name: string;
  status: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.04] p-3">
      <div>
        <p className="text-sm font-black text-cyan-300">{time}</p>
        <p className="text-sm font-bold">{name}</p>
      </div>

      <span className="rounded-full bg-green-500/15 px-2 py-1 text-[10px] font-black text-green-300">
        {status}
      </span>
    </div>
  );
}
