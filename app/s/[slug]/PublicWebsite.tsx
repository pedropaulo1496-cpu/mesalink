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

export function PublicWebsite({
  restaurant,
}: {
  restaurant: PublicRestaurant;
}) {
  const primaryColor = getPrimaryColor(restaurant);
  const hours = getOpeningHours(restaurant);

  return (
    <main className="min-h-screen bg-[#060606] text-white">
      <WebsiteHero
        restaurant={restaurant}
        hours={hours}
        primaryColor={primaryColor}
      />

      <QuickInfoSection restaurant={restaurant} />

      <ReservationAndHoursSection
        restaurant={restaurant}
        hours={hours}
        primaryColor={primaryColor}
      />

      <ExperienceSection
        restaurant={restaurant}
        primaryColor={primaryColor}
      />

      <GallerySection restaurant={restaurant} />

      <LocationSection
        restaurant={restaurant}
        primaryColor={primaryColor}
      />

      <InstagramSection
        restaurant={restaurant}
        primaryColor={primaryColor}
      />

      <FinalCtaSection
        restaurant={restaurant}
        primaryColor={primaryColor}
      />

      <PublicFooter />

      <MobileStickyReserve
        restaurant={restaurant}
        primaryColor={primaryColor}
      />
    </main>
  );
}