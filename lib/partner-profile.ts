import { normalizeReferralCuisine } from "@/lib/referral-tags";

type MenuProduct = {
  name: string;
  imageUrl?: string | null;
};

type MenuCategory = {
  name: string;
  products?: MenuProduct[];
};

type WebsiteMenu = {
  title: string;
  pdf: string;
};

export type PartnerProfileSource = {
  name: string;
  address?: string | null;
  websiteCuisine?: string | null;
  websiteDescription?: string | null;
  websiteAboutText?: string | null;
  websiteHeroImage?: string | null;
  websiteLogoImage?: string | null;
  websiteGalleryImage1?: string | null;
  websiteGalleryImage2?: string | null;
  websiteGalleryImage3?: string | null;
  websiteGalleryImage4?: string | null;
  websiteSpecialties?: string[];
  websiteMenuPdf?: string | null;
  websiteMenus?: WebsiteMenu[];
  orderingCategories?: MenuCategory[];
  referralProfileCuisine?: string | null;
  referralProfileDescription?: string | null;
  referralProfileHeroImage?: string | null;
  referralProfileGallery?: string[];
  referralProfileHighlights?: string[];
  referralProfileMenuUrl?: string | null;
};

export function buildPartnerProfile(source: PartnerProfileSource) {
  const menuSections = (source.orderingCategories || [])
    .map((category) => ({
      title: category.name,
      items: (category.products || []).map((product) => product.name).filter(Boolean).slice(0, 5),
    }))
    .filter((section) => section.title && section.items.length > 0)
    .slice(0, 6);

  const productImages = (source.orderingCategories || [])
    .flatMap((category) => category.products || [])
    .map((product) => product.imageUrl || "")
    .filter(Boolean);

  const automaticGallery = unique([
    source.websiteGalleryImage1,
    source.websiteGalleryImage2,
    source.websiteGalleryImage3,
    source.websiteGalleryImage4,
    ...productImages,
  ]).slice(0, 6);
  const explicitGallery = unique(source.referralProfileGallery || []);
  const heroImage = clean(source.referralProfileHeroImage)
    || clean(source.websiteHeroImage)
    || automaticGallery[0]
    || clean(source.websiteLogoImage);
  const galleryImages = (explicitGallery.length > 0 ? explicitGallery : automaticGallery)
    .filter((image) => image !== heroImage)
    .slice(0, 6);
  const automaticHighlights = unique([
    ...(source.websiteSpecialties || []),
    ...menuSections.map((section) => section.title),
  ]).slice(0, 6);
  const explicitHighlights = unique(source.referralProfileHighlights || []);
  const cuisine = normalizeReferralCuisine(source.referralProfileCuisine)
    || normalizeReferralCuisine(source.websiteCuisine)
    || "Internacional";

  return {
    cuisine,
    description: clean(source.referralProfileDescription)
      || clean(source.websiteDescription)
      || clean(source.websiteAboutText)
      || `${source.name} recebe grupos através da rede MesaLink.`,
    heroImage,
    galleryImages,
    highlights: explicitHighlights.length > 0 ? explicitHighlights : automaticHighlights,
    menuUrl: clean(source.referralProfileMenuUrl)
      || clean(source.websiteMenuPdf)
      || clean(source.websiteMenus?.[0]?.pdf),
    menuSections,
  };
}

function clean(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}
