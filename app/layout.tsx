import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mesalink.pt"),
  title: {
    default: "MesaLink — Reservas e Crescimento para Restaurantes",
    template: "%s | MesaLink",
  },
  description:
    "Receba reservas diretas, ganhe novos clientes através da Rede de Parceiros e recupere oportunidades com IA. Reservas, mesas, website, QR, CRM e marketing para restaurantes.",
  applicationName: "MesaLink",
  authors: [{ name: "MesaLink", url: "https://www.mesalink.pt" }],
  creator: "MesaLink",
  publisher: "MesaLink",
  category: "Software para restaurantes",
  openGraph: {
    type: "website",
    locale: "pt_PT",
    siteName: "MesaLink",
    title: "MesaLink — Mais reservas. Menos clientes perdidos.",
    description:
      "Reservas diretas, novos clientes através de parceiros e recuperação automática de oportunidades, com toda a operação do restaurante ligada.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "MesaLink — software para restaurantes" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MesaLink — Mais reservas. Menos clientes perdidos.",
    description:
      "Reservas diretas, Rede de Parceiros, Revenue AI, website, CRM e marketing para fazer crescer restaurantes.",
    images: ["/opengraph-image"],
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MesaLink",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#C8A56A",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://www.mesalink.pt/#organization",
    name: "MesaLink",
    url: "https://www.mesalink.pt",
    logo: "https://www.mesalink.pt/icons/icon-512.png",
    description:
      "Plataforma de gestão e crescimento criada para restaurantes.",
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://www.mesalink.pt/#website",
    url: "https://www.mesalink.pt",
    name: "MesaLink",
    alternateName: "MesaLink Restaurant OS",
    publisher: { "@id": "https://www.mesalink.pt/#organization" },
    inLanguage: "pt-PT",
  };

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-x-hidden antialiased`}
    >
      <body className="min-h-full w-full overflow-x-hidden bg-[#070504]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, websiteSchema]).replace(/</g, "\\u003c"),
          }}
        />
        <NextIntlClientProvider>
          {children}
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
