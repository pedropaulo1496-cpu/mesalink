export type OpeningHour = {
  day: string;
  shortDay: string;
  open: boolean;
  lunch: string | null;
  dinner: string | null;
};

export type PublicRestaurant = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;

  websiteEnabled: boolean;
  websiteTemplate: string;
  websiteHeadline: string | null;
  websiteDescription: string | null;
  websiteCuisine: string | null;
  websiteInstagram: string | null;
  websiteHeroImage: string | null;
  websiteGalleryImage1: string | null;
  websiteGalleryImage2: string | null;
  websiteGalleryImage3: string | null;
  websiteGalleryImage4: string | null;
  websiteAboutTitle: string | null;
  websiteAboutText: string | null;
  websiteFeatureTitle: string | null;
  websiteFeatureText: string | null;
  websitePrimaryColor: string | null;

  mondayOpen: boolean;
  mondayLunch: string | null;
  mondayDinner: string | null;

  tuesdayOpen: boolean;
  tuesdayLunch: string | null;
  tuesdayDinner: string | null;

  wednesdayOpen: boolean;
  wednesdayLunch: string | null;
  wednesdayDinner: string | null;

  thursdayOpen: boolean;
  thursdayLunch: string | null;
  thursdayDinner: string | null;

  fridayOpen: boolean;
  fridayLunch: string | null;
  fridayDinner: string | null;

  saturdayOpen: boolean;
  saturdayLunch: string | null;
  saturdayDinner: string | null;

  sundayOpen: boolean;
  sundayLunch: string | null;
  sundayDinner: string | null;
};

export function getPrimaryColor(restaurant: PublicRestaurant) {
  return restaurant.websitePrimaryColor || "#111827";
}

export function getReserveUrl(restaurant: PublicRestaurant) {
  return `/reserve/${restaurant.slug}`;
}

export function hasValidHeroImage(restaurant: PublicRestaurant) {
  return Boolean(
    restaurant.websiteHeroImage &&
      restaurant.websiteHeroImage.startsWith("http")
  );
}

export function getGalleryImages(restaurant: PublicRestaurant) {
  return [
    restaurant.websiteGalleryImage1,
    restaurant.websiteGalleryImage2,
    restaurant.websiteGalleryImage3,
    restaurant.websiteGalleryImage4,
  ].filter((image): image is string => Boolean(image && image.startsWith("http")));
}

export function getMapsUrl(restaurant: PublicRestaurant) {
  if (!restaurant.address) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    restaurant.address
  )}`;
}

export function getOpeningHours(restaurant: PublicRestaurant): OpeningHour[] {
  return [
    {
      day: "Segunda-feira",
      shortDay: "Seg",
      open: restaurant.mondayOpen,
      lunch: restaurant.mondayLunch,
      dinner: restaurant.mondayDinner,
    },
    {
      day: "Terça-feira",
      shortDay: "Ter",
      open: restaurant.tuesdayOpen,
      lunch: restaurant.tuesdayLunch,
      dinner: restaurant.tuesdayDinner,
    },
    {
      day: "Quarta-feira",
      shortDay: "Qua",
      open: restaurant.wednesdayOpen,
      lunch: restaurant.wednesdayLunch,
      dinner: restaurant.wednesdayDinner,
    },
    {
      day: "Quinta-feira",
      shortDay: "Qui",
      open: restaurant.thursdayOpen,
      lunch: restaurant.thursdayLunch,
      dinner: restaurant.thursdayDinner,
    },
    {
      day: "Sexta-feira",
      shortDay: "Sex",
      open: restaurant.fridayOpen,
      lunch: restaurant.fridayLunch,
      dinner: restaurant.fridayDinner,
    },
    {
      day: "Sábado",
      shortDay: "Sáb",
      open: restaurant.saturdayOpen,
      lunch: restaurant.saturdayLunch,
      dinner: restaurant.saturdayDinner,
    },
    {
      day: "Domingo",
      shortDay: "Dom",
      open: restaurant.sundayOpen,
      lunch: restaurant.sundayLunch,
      dinner: restaurant.sundayDinner,
    },
  ];
}

export function formatOpeningHour(item: OpeningHour) {
  if (!item.open) return "Fechado";

  const periods = [item.lunch, item.dinner].filter(Boolean);

  if (periods.length === 0) return "Aberto";

  return periods.join(" · ");
}

export function getTodayOpeningHour(hours: OpeningHour[]) {
  const day = new Date().getDay();

  const indexMap: Record<number, number> = {
    0: 6,
    1: 0,
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
  };

  return hours[indexMap[day]] ?? hours[0];
}

export function normalizeInstagramUrl(value: string | null) {
  if (!value) return null;

  if (value.startsWith("http")) return value;

  const clean = value.replace("@", "").trim();

  return `https://instagram.com/${clean}`;
}

export function getDisplayCuisine(restaurant: PublicRestaurant) {
  return restaurant.websiteCuisine || "Restaurante";
}

export function getDisplayTitle(restaurant: PublicRestaurant) {
  return restaurant.websiteHeadline || restaurant.name;
}

export function getDisplayDescription(restaurant: PublicRestaurant) {
  return (
    restaurant.websiteDescription ||
    "Reserva a tua mesa online de forma rápida, simples e segura."
  );
}

export function getAboutTitle(restaurant: PublicRestaurant) {
  return restaurant.websiteAboutTitle || "A nossa casa";
}

export function getAboutText(restaurant: PublicRestaurant) {
  return (
    restaurant.websiteAboutText ||
    restaurant.websiteDescription ||
    "Um espaço pensado para comer bem, ficar mais um pouco e voltar."
  );
}

export function getFeatureTitle(restaurant: PublicRestaurant) {
  return restaurant.websiteFeatureTitle || "Uma experiência à mesa";
}

export function getFeatureText(restaurant: PublicRestaurant) {
  return (
    restaurant.websiteFeatureText ||
    "Boa comida, bom ambiente e reservas online sem complicações."
  );
}