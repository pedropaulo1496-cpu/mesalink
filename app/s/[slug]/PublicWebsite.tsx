import { getTranslations } from "next-intl/server";
import { WebsiteHero } from "./WebsiteHero";
import {
  FinalCtaSection,
  FaqSection,
  GallerySection,
  LocationSection,
  MenuSection,
  MobileStickyReserve,
  PublicFooter,
  ReservationAndHoursSection,
  StorySection,
} from "./WebsiteSections";
import {
  getOpeningHours,
  getPrimaryColor,
  type PublicRestaurant,
} from "./utils";
import { getTemplateTheme, getWebsiteTemplate } from "./templates";

export async function PublicWebsite({
  restaurant,
}: {
  restaurant: PublicRestaurant;
}) {
  const t = await getTranslations("publicFlows.publicSite");
  const primaryColor = getPrimaryColor(restaurant);
  const hours = getOpeningHours(restaurant, t);
  const template = getWebsiteTemplate(restaurant.websiteTemplate);
  const theme = getTemplateTheme(template, primaryColor);

  return (
    <main className={`min-h-screen ${theme.page}`}>
      <WebsiteHero
        restaurant={restaurant}
        hours={hours}
        primaryColor={theme.accent}
        theme={theme}
        template={template}
        t={t}
      />

      <ReservationAndHoursSection
        restaurant={restaurant}
        hours={hours}
        primaryColor={theme.accent}
        template={template}
        t={t}
      />

      <StorySection
        restaurant={restaurant}
        primaryColor={theme.accent}
        template={template}
      />

      <MenuSection
        restaurant={restaurant}
        primaryColor={theme.accent}
        template={template}
        t={t}
      />

      <GallerySection restaurant={restaurant} template={template} />

      <FaqSection restaurant={restaurant} template={template} />

      <LocationSection
        restaurant={restaurant}
        primaryColor={theme.accent}
        template={template}
        t={t}
      />

      <FinalCtaSection
        restaurant={restaurant}
        primaryColor={theme.accent}
        template={template}
        t={t}
      />

      <PublicFooter restaurant={restaurant} template={template} t={t} />

      <MobileStickyReserve
        restaurant={restaurant}
        primaryColor={theme.accent}
        t={t}
      />
    </main>
  );
}
