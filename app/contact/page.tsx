"use client";

import Footer from "@/components/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type Lang = "pt" | "en" | "es" | "fr" | "de";

const translations = {
  pt: {
    back: "← Voltar",
    badge: "Fale connosco",
    title: "Vamos ligar o seu restaurante ao futuro.",
    text: "Tem dúvidas sobre o MesaLink, implementação, preços ou quer ver como a plataforma pode funcionar no seu restaurante? Envie-nos uma mensagem.",
    email: "Email",
    reply: "Respondemos o mais rapidamente possível.",
    name: "Nome",
    mail: "Email",
    restaurant: "Restaurante",
    message: "Mensagem",
    send: "Enviar mensagem",
    note: "O formulário será ligado ao email no próximo passo.",
    cardTitle: "O Sistema Operativo para Restaurantes",
    cardText:
      "Website profissional, reservas online, gestão de mesas, clientes e ferramentas futuras como IA, marketing, QR Ordering e POS.",
  },
  en: {
    back: "← Back",
    badge: "Contact us",
    title: "Let’s connect your restaurant to the future.",
    text: "Have questions about MesaLink, implementation, pricing or want to see how the platform can work for your restaurant? Send us a message.",
    email: "Email",
    reply: "We reply as quickly as possible.",
    name: "Name",
    mail: "Email",
    restaurant: "Restaurant",
    message: "Message",
    send: "Send message",
    note: "The form will be connected to email in the next step.",
    cardTitle: "The Operating System for Restaurants",
    cardText:
      "Professional website, online reservations, table management, customers and future tools like AI, marketing, QR Ordering and POS.",
  },
  es: {
    back: "← Volver",
    badge: "Contáctanos",
    title: "Conectemos tu restaurante al futuro.",
    text: "¿Tienes dudas sobre MesaLink, implementación, precios o quieres ver cómo puede funcionar en tu restaurante? Envíanos un mensaje.",
    email: "Email",
    reply: "Respondemos lo antes posible.",
    name: "Nombre",
    mail: "Email",
    restaurant: "Restaurante",
    message: "Mensaje",
    send: "Enviar mensaje",
    note: "El formulario se conectará al email en el próximo paso.",
    cardTitle: "El Sistema Operativo para Restaurantes",
    cardText:
      "Website profesional, reservas online, gestión de mesas, clientes y futuras herramientas como IA, marketing, QR Ordering y POS.",
  },
  fr: {
    back: "← Retour",
    badge: "Contactez-nous",
    title: "Connectons votre restaurant au futur.",
    text: "Vous avez des questions sur MesaLink, l’implémentation, les prix ou souhaitez voir comment la plateforme peut fonctionner pour votre restaurant ? Envoyez-nous un message.",
    email: "Email",
    reply: "Nous répondons le plus rapidement possible.",
    name: "Nom",
    mail: "Email",
    restaurant: "Restaurant",
    message: "Message",
    send: "Envoyer le message",
    note: "Le formulaire sera connecté à l’email à l’étape suivante.",
    cardTitle: "Le Système d’Exploitation pour Restaurants",
    cardText:
      "Site professionnel, réservations en ligne, gestion des tables, clients et futurs outils comme IA, marketing, QR Ordering et POS.",
  },
  de: {
    back: "← Zurück",
    badge: "Kontakt",
    title: "Verbinden wir Ihr Restaurant mit der Zukunft.",
    text: "Haben Sie Fragen zu MesaLink, Implementierung, Preisen oder möchten sehen, wie die Plattform für Ihr Restaurant funktionieren kann? Schreiben Sie uns.",
    email: "Email",
    reply: "Wir antworten so schnell wie möglich.",
    name: "Name",
    mail: "Email",
    restaurant: "Restaurant",
    message: "Nachricht",
    send: "Nachricht senden",
    note: "Das Formular wird im nächsten Schritt mit Email verbunden.",
    cardTitle: "Das Betriebssystem für Restaurants",
    cardText:
      "Professionelle Website, Online-Reservierungen, Tischverwaltung, Kunden und zukünftige Tools wie KI, Marketing, QR Ordering und POS.",
  },
};

export default function ContactPage() {
  const [lang, setLang] = useState<Lang>("pt");
  const t = translations[lang];

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <section className="mx-auto max-w-6xl px-5 py-8 sm:py-14">
        <nav className="mb-10 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-[#6B6258] hover:text-[#16120E]"
          >
            {t.back}
          </Link>

          <div className="flex rounded-full border border-[#E1D0B8] bg-white p-1 shadow-[0_14px_40px_rgba(80,55,30,0.05)]">
            {(["pt", "en", "es", "fr", "de"] as Lang[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLang(item)}
                className={
                  lang === item
                    ? "rounded-full bg-[#16120E] px-3 py-1 text-xs font-semibold uppercase text-white"
                    : "px-3 py-1 text-xs font-semibold uppercase text-[#6B6258] hover:text-[#16120E]"
                }
              >
                {item}
              </button>
            ))}
          </div>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <Badge>{t.badge}</Badge>

            <h1 className="mt-5 text-[46px] font-semibold leading-[0.9] tracking-[-0.065em] sm:text-6xl">
              {t.title}
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#6B6258]">
              {t.text}
            </p>

            <div className="mt-8 rounded-[32px] border border-[#E1D0B8] bg-white p-6 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9B6F3B]">
                {t.email}
              </p>

              <p className="mt-3 break-all text-2xl font-semibold text-[#16120E]">
                info@mesalink.pt
              </p>

              <p className="mt-3 text-sm text-[#6B6258]">{t.reply}</p>
            </div>

            <div className="mt-5 rounded-[32px] border border-[#E1D0B8] bg-[#FFF9F0] p-6">
              <h2 className="text-xl font-semibold text-[#16120E]">
                {t.cardTitle}
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-[#6B6258]">
                {t.cardText}
              </p>
            </div>
          </div>

          <form className="rounded-[32px] border border-[#E1D0B8] bg-white p-6 shadow-[0_22px_70px_rgba(80,55,30,0.055)] sm:p-8">
            <div className="space-y-4">
              <Input placeholder={t.name} />
              <Input placeholder={t.mail} type="email" />
              <Input placeholder={t.restaurant} />

              <textarea
                placeholder={t.message}
                rows={5}
                className="w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 py-4 text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
              />
            </div>

            <Button
              type="submit"
              className="mt-6 h-14 w-full rounded-full bg-[#16120E] text-base font-semibold text-white hover:bg-[#2A2118]"
            >
              {t.send}
            </Button>

            <p className="mt-4 text-center text-xs text-[#9B8F82]">{t.note}</p>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Input({
  placeholder,
  type = "text",
}: {
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className="h-14 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
    />
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-[#E1D0B8] bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#9B6F3B]">
      {children}
    </span>
  );
}