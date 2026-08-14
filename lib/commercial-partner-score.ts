export type CommercialPartnerScoreInput = {
  salesYears: number;
  hospitalityYears: number;
  hasSaasExperience: boolean;
  hasCommissionExperience: boolean;
  languages: string[];
  markets: string[];
  networkSize: "NONE" | "SMALL" | "MEDIUM" | "LARGE";
  weeklyAvailability: "LT_5" | "H5_10" | "H10_20" | "H20_PLUS";
};

export type CommercialPartnerScoreBreakdown = {
  salesExperience: number;
  hospitalityExperience: number;
  saasExperience: number;
  commissionExperience: number;
  languages: number;
  markets: number;
  restaurantNetwork: number;
  availability: number;
};

export function calculateCommercialPartnerScore(input: CommercialPartnerScoreInput) {
  const breakdown: CommercialPartnerScoreBreakdown = {
    salesExperience: Math.min(Math.max(input.salesYears, 0), 5) * 5,
    hospitalityExperience: Math.min(Math.max(input.hospitalityYears, 0), 5) * 4,
    saasExperience: input.hasSaasExperience ? 10 : 0,
    commissionExperience: input.hasCommissionExperience ? 10 : 0,
    languages: Math.min(new Set(input.languages.map(normalize)).size, 4) * 3,
    markets: Math.min(new Set(input.markets.map(normalize)).size, 4) * 2,
    restaurantNetwork: { NONE: 0, SMALL: 5, MEDIUM: 8, LARGE: 10 }[input.networkSize],
    availability: { LT_5: 0, H5_10: 2, H10_20: 4, H20_PLUS: 5 }[input.weeklyAvailability],
  };

  return {
    score: Object.values(breakdown).reduce((sum, value) => sum + value, 0),
    breakdown,
  };
}

export function commercialPartnerScoreLabel(score: number) {
  if (score >= 80) return "Prioridade alta";
  if (score >= 60) return "Perfil forte";
  if (score >= 40) return "Rever experiência";
  return "Revisão normal";
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}
