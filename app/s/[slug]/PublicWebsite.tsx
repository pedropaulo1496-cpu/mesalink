import { getTranslations } from "next-intl/server";
import { WebsiteHero } from "./WebsiteHero";
import {
  FinalCtaSection,
  GallerySection,
  LocationSection,
  MenuSection,
  PublicFooter,
  ReservationAndHoursSection,
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
        t={t}
      />

      <MenuSection
        restaurant={restaurant}
        primaryColor={theme.accent}
        t={t}
      />

      <GallerySection restaurant={restaurant} />

      <LocationSection
        restaurant={restaurant}
        primaryColor={theme.accent}
      />

      <FinalCtaSection
        restaurant={restaurant}
        primaryColor={theme.accent}
        t={t}
      />

      <PublicFooter t={t} />
    </main>
  );
}
