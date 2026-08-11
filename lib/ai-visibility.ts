export type VisibilityInput = {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  websiteEnabled: boolean;
  websiteHeadline: string | null;
  websiteDescription: string | null;
  websiteCuisine: string | null;
  websiteInstagram: string | null;
  websiteAboutText: string | null;
  websiteSectionText: string | null;
  websiteGalleryDescription: string | null;
  websiteMenuDescription: string | null;
  websiteSeoTitle: string | null;
  websiteSeoDescription: string | null;
  customDomain: string | null;
  customDomainVerified: boolean;
  googleReviewUrl: string | null;
  menuCount: number;
  productCount: number;
  describedProductCount: number;
  reviewCount: number;
  averageRating: number;
};

export type VisibilityOpportunity = {
  key: string;
  tone: "critical" | "warning" | "positive";
  href: "website" | "menu" | "marketing" | "settings";
};

export type VisibilityReport = {
  overall: number;
  chatgpt: number;
  search: number;
  reviews: number;
  website: number;
  citations: number;
  opportunities: VisibilityOpportunity[];
};

const present = (value: string | null | undefined) => Boolean(value?.trim());
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function calculateAiVisibility(input: VisibilityInput): VisibilityReport {
  const business = clamp(
    15 +
      (present(input.address) ? 25 : 0) +
      (present(input.phone) ? 20 : 0) +
      (present(input.email) ? 15 : 0) +
      (present(input.websiteCuisine) ? 25 : 0),
  );

  const website = clamp(
    (input.websiteEnabled ? 20 : 0) +
      (present(input.websiteSeoTitle) ? 15 : 0) +
      (present(input.websiteSeoDescription) ? 15 : 0) +
      (present(input.websiteHeadline) ? 10 : 0) +
      (present(input.websiteDescription) ? 15 : 0) +
      (present(input.websiteAboutText) ? 15 : 0) +
      (input.customDomainVerified ? 10 : 0),
  );

  const productDescriptionCoverage = input.productCount
    ? input.describedProductCount / input.productCount
    : 0;

  const content = clamp(
    (present(input.websiteCuisine) ? 20 : 0) +
      (present(input.websiteDescription) ? 15 : 0) +
      (present(input.websiteAboutText) ? 15 : 0) +
      (present(input.websiteSectionText) ? 10 : 0) +
      (present(input.websiteGalleryDescription) ? 10 : 0) +
      productDescriptionCoverage * 30,
  );

  const reviews = clamp(
    (present(input.googleReviewUrl) ? 30 : 0) +
      Math.min(40, input.reviewCount * 4) +
      (input.reviewCount ? (input.averageRating / 5) * 30 : 0),
  );

  const citations = clamp(
    (present(input.customDomain) ? 25 : 0) +
      (input.customDomainVerified ? 20 : 0) +
      (present(input.websiteInstagram) ? 20 : 0) +
      (present(input.googleReviewUrl) ? 20 : 0) +
      (present(input.email) ? 15 : 0),
  );

  const search = clamp(business * 0.4 + website * 0.35 + citations * 0.25);
  const chatgpt = clamp(website * 0.35 + content * 0.35 + citations * 0.2 + business * 0.1);
  const overall = clamp(
    chatgpt * 0.3 + search * 0.25 + reviews * 0.15 + website * 0.15 + citations * 0.15,
  );

  const opportunities: VisibilityOpportunity[] = [];

  if (!input.websiteEnabled) opportunities.push({ key: "publishWebsite", tone: "critical", href: "website" });
  if (!present(input.websiteCuisine)) opportunities.push({ key: "defineCuisine", tone: "critical", href: "website" });
  if (input.productCount < 5 || input.menuCount === 0) opportunities.push({ key: "structureMenu", tone: "critical", href: "menu" });
  if (productDescriptionCoverage < 0.6) opportunities.push({ key: "describeDishes", tone: "warning", href: "menu" });
  if (!present(input.websiteSeoTitle) || !present(input.websiteSeoDescription)) opportunities.push({ key: "seoMetadata", tone: "warning", href: "website" });
  if (!present(input.address) || !present(input.phone)) opportunities.push({ key: "businessDetails", tone: "warning", href: "settings" });
  if (!present(input.customDomain) || !input.customDomainVerified) opportunities.push({ key: "domainAuthority", tone: "warning", href: "website" });
  if (input.reviewCount < 10) opportunities.push({ key: "collectReviews", tone: "warning", href: "marketing" });
  if (present(input.googleReviewUrl)) opportunities.push({ key: "googleProfile", tone: "positive", href: "marketing" });
  if (input.websiteEnabled && website >= 70) opportunities.push({ key: "aiReadyWebsite", tone: "positive", href: "website" });

  return { overall, chatgpt, search, reviews, website, citations, opportunities };
}
