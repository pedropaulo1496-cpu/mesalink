import { WebsiteHero } from "./WebsiteHero";
import {
  ExperienceSection,
  FinalCtaSection,
  GallerySection,
  InstagramSection,
  LocationSection,
  MobileStickyReserve,
  PublicFooter,
  QuickInfoSection,
  ReservationAndHoursSection,
} from "./WebsiteSections";
import {
  getOpeningHours,
  getPrimaryColor,
  type PublicRestaurant,
} from "./utils";
import { getTemplateTheme, getWebsiteTemplate } from "./templates";

export function PublicWebsite({
  restaurant,
}: {
  restaurant: PublicRestaurant;
}) {
  const primaryColor = getPrimaryColor(restaurant);
  const hours = getOpeningHours(restaurant);
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
      />

      <QuickInfoSection restaurant={restaurant} />

      <ReservationAndHoursSection
        restaurant={restaurant}
        hours={hours}
        primaryColor={theme.accent}
      />

      <ExperienceSection
        restaurant={restaurant}
        primaryColor={theme.accent}
      />

      <GallerySection restaurant={restaurant} />

      <LocationSection
        restaurant={restaurant}
        primaryColor={theme.accent}
      />

      <InstagramSection
        restaurant={restaurant}
        primaryColor={theme.accent}
      />

      <FinalCtaSection
        restaurant={restaurant}
        primaryColor={theme.accent}
      />

      <PublicFooter />

      <MobileStickyReserve
        restaurant={restaurant}
        primaryColor={theme.accent}
      />
    </main>
  );
}