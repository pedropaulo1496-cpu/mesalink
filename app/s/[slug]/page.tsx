import { prisma } from "@/lib/prisma";
import { hasTrialExpired } from "@/lib/subscription";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicWebsite } from "./PublicWebsite";
import { getFaqItems } from "./utils";
import { publicReservationUrl } from "@/lib/public-links";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });

  if (!restaurant) return { title: "MesaLink", description: "Reservas online para restaurantes." };

  const title = restaurant.websiteSeoTitle || restaurant.websiteHeadline || restaurant.name;
  const description = restaurant.websiteSeoDescription || restaurant.websiteDescription || `${restaurant.name} - Reservas online.`;
  const canonical = restaurant.customDomainVerified && restaurant.customDomain
    ? `https://${restaurant.customDomain.replace(/^https?:\/\//, "").replace(/\/$/, "")}`
    : `https://www.mesalink.pt/s/${restaurant.slug}`;

  return {
    title,
    description,
    keywords: restaurant.websiteSpecialties,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website", images: restaurant.websiteHeroImage ? [{ url: restaurant.websiteHeroImage }] : [] },
    twitter: { card: "summary_large_image", title, description, images: restaurant.websiteHeroImage ? [restaurant.websiteHeroImage] : [] },
  };
}

export default async function PublicRestaurantWebsitePage({ params }: PageProps) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      user: { include: { subscription: true } },
      websiteMenus: { orderBy: { sortOrder: "asc" } },
      orderingCategories: {
        where: { activeInPOS: true },
        orderBy: { position: "asc" },
        include: {
          products: {
            where: { active: true, activeOnWebsite: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!restaurant) notFound();

  const subscription = restaurant.user?.subscription;
  const trialActive = subscription?.status === "TRIAL" && !hasTrialExpired(subscription.trialEndsAt);
  const activePlan = String(subscription?.plan || "").toUpperCase();
  const websiteActive = subscription?.status === "ACTIVE" && ["ESSENTIALS", "GROWTH"].includes(activePlan);

  if (!restaurant.websiteEnabled || (!trialActive && !websiteActive)) notFound();

  const canonical = restaurant.customDomainVerified && restaurant.customDomain
    ? `https://${restaurant.customDomain.replace(/^https?:\/\//, "").replace(/\/$/, "")}`
    : `https://www.mesalink.pt/s/${restaurant.slug}`;
  const reserveUrl = publicReservationUrl(restaurant.slug);
  const menuSections = restaurant.orderingCategories
    .filter((category) => category.products.length > 0)
    .map((category) => ({
      "@type": "MenuSection",
      name: category.name,
      hasMenuItem: category.products.map((product) => ({
        "@type": "MenuItem",
        name: product.name,
        ...(product.description ? { description: product.description } : {}),
        offers: {
          "@type": "Offer",
          price: Number(product.price).toFixed(2),
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
        },
      })),
    }));
  const faqItems = getFaqItems(restaurant);
  const restaurantSchema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${canonical}#restaurant`,
    name: restaurant.name,
    url: canonical,
    ...(restaurant.websiteDescription ? { description: restaurant.websiteDescription } : {}),
    ...(restaurant.websiteHeroImage ? { image: [restaurant.websiteHeroImage] } : {}),
    ...(restaurant.websiteLogoImage ? { logo: restaurant.websiteLogoImage } : {}),
    ...(restaurant.phone ? { telephone: restaurant.phone } : {}),
    ...(restaurant.email ? { email: restaurant.email } : {}),
    ...(restaurant.address ? { address: { "@type": "PostalAddress", streetAddress: restaurant.address } } : {}),
    ...(restaurant.websiteCuisine ? { servesCuisine: restaurant.websiteCuisine.split(",").map((item) => item.trim()).filter(Boolean) } : {}),
    ...(restaurant.websiteSpecialties.length ? { keywords: restaurant.websiteSpecialties.join(", ") } : {}),
    ...(restaurant.websiteInstagram?.startsWith("http") ? { sameAs: [restaurant.websiteInstagram] } : {}),
    acceptsReservations: true,
    potentialAction: {
      "@type": "ReserveAction",
      target: { "@type": "EntryPoint", urlTemplate: reserveUrl, actionPlatform: ["https://schema.org/DesktopWebPlatform", "https://schema.org/MobileWebPlatform"] },
      result: { "@type": "FoodEstablishmentReservation" },
    },
    ...(menuSections.length ? { hasMenu: { "@type": "Menu", name: restaurant.websiteMenuTitle || `Menu ${restaurant.name}`, hasMenuSection: menuSections } } : {}),
  };
  const faqSchema = faqItems.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${canonical}#faq`,
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  } : null;

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema ? [restaurantSchema, faqSchema] : restaurantSchema).replace(/</g, "\\u003c") }} />
    <PublicWebsite restaurant={restaurant} />
  </>;
}
