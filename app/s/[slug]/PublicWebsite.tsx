import { WebsiteHero } from "./WebsiteHero";
import {
  FinalCtaSection,
  GallerySection,
  InstagramSection,
  LocationSection,
  MenuSection,
  MobileStickyReserve,
  PublicFooter,
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

      <ReservationAndHoursSection
        restaurant={restaurant}
        hours={hours}
        primaryColor={theme.accent}
      />

      <MenuSection restaurant={restaurant} primaryColor={theme.accent} />


      <GallerySection restaurant={restaurant} />

      <LocationSection restaurant={restaurant} primaryColor={theme.accent} />

      <InstagramSection restaurant={restaurant} primaryColor={theme.accent} />

      <FinalCtaSection restaurant={restaurant} primaryColor={theme.accent} />

      <PublicFooter />

      <MobileStickyReserve restaurant={restaurant} primaryColor={theme.accent} />
    </main>
  );
}
