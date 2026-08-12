export const REFERRAL_CUISINE_TAGS = [
  "Portuguesa",
  "Italiana",
  "Mediterrânica",
  "Espanhola / Tapas",
  "Francesa",
  "Japonesa / Sushi",
  "Chinesa",
  "Indiana",
  "Tailandesa",
  "Mexicana",
  "Brasileira",
  "Africana",
  "Médio Oriente",
  "Coreana",
  "Marisqueira",
  "Grelhados / Steakhouse",
  "Hamburgueria",
  "Pizzaria",
  "Vegetariana / Vegan",
  "Internacional",
] as const;

export type ReferralCuisineTag = (typeof REFERRAL_CUISINE_TAGS)[number];

export function isReferralCuisineTag(value: unknown): value is ReferralCuisineTag {
  return typeof value === "string" && (REFERRAL_CUISINE_TAGS as readonly string[]).includes(value);
}

export function normalizeReferralCuisine(value: string | null | undefined): ReferralCuisineTag | "" {
  const normalized = String(value || "").trim().toLocaleLowerCase("pt-PT");
  if (!normalized) return "";

  const exact = REFERRAL_CUISINE_TAGS.find((tag) => tag.toLocaleLowerCase("pt-PT") === normalized);
  if (exact) return exact;

  const aliases: Array<[RegExp, ReferralCuisineTag]> = [
    [/(portugues|tuga|petisco|taberna)/, "Portuguesa"],
    [/(italian|italiana)/, "Italiana"],
    [/(mediterr)/, "Mediterrânica"],
    [/(espanhol|spanish|tapas)/, "Espanhola / Tapas"],
    [/(franc|french)/, "Francesa"],
    [/(japon|sushi|ramen)/, "Japonesa / Sushi"],
    [/(chines|chinese)/, "Chinesa"],
    [/(indian|indiana)/, "Indiana"],
    [/(tailand|thai)/, "Tailandesa"],
    [/(mexic)/, "Mexicana"],
    [/(brasil)/, "Brasileira"],
    [/(afric)/, "Africana"],
    [/(árabe|arabe|liban|middle east|médio oriente)/, "Médio Oriente"],
    [/(corean|korean)/, "Coreana"],
    [/(marisc|seafood)/, "Marisqueira"],
    [/(grelhad|steak|churrasc)/, "Grelhados / Steakhouse"],
    [/(hamb|burger)/, "Hamburgueria"],
    [/(pizz)/, "Pizzaria"],
    [/(veget|vegan)/, "Vegetariana / Vegan"],
    [/(internacional|fusion|fusão|world)/, "Internacional"],
  ];

  return aliases.find(([pattern]) => pattern.test(normalized))?.[1] || "";
}

export const REFERRAL_OCCASION_TAGS = [
  { value: "NONE", label: "Sem ocasião especial", note: null },
  { value: "BIRTHDAY", label: "Aniversário", note: "Ocasião: aniversário." },
  { value: "BUSINESS", label: "Empresa", note: "Ocasião: evento de empresa." },
  { value: "FAMILY", label: "Celebração familiar", note: "Ocasião: celebração familiar." },
  { value: "ENGAGEMENT", label: "Casamento / noivado", note: "Ocasião: casamento ou noivado." },
  { value: "TOUR", label: "Turismo / excursão", note: "Ocasião: grupo turístico ou excursão." },
] as const;

export const REFERRAL_DIETARY_TAGS = [
  { value: "NONE", label: "Sem restrições", note: null },
  { value: "VEGETARIAN", label: "Vegetariano", note: "Alimentação: opções vegetarianas." },
  { value: "VEGAN", label: "Vegan", note: "Alimentação: opções vegan." },
  { value: "GLUTEN_FREE", label: "Sem glúten", note: "Alimentação: opções sem glúten." },
  { value: "LACTOSE_FREE", label: "Sem lactose", note: "Alimentação: opções sem lactose." },
  { value: "HALAL", label: "Halal", note: "Alimentação: opções halal." },
  { value: "MIXED", label: "Necessidades variadas", note: "Alimentação: necessidades variadas." },
] as const;

export const REFERRAL_ACCESSIBILITY_TAGS = [
  { value: "NONE", label: "Sem pedido", note: null },
  { value: "STEP_FREE", label: "Acesso sem degraus", note: "Acessibilidade: acesso sem degraus." },
  { value: "WHEELCHAIR", label: "Cadeira de rodas", note: "Acessibilidade: espaço para cadeira de rodas." },
] as const;

export const REFERRAL_REQUIREMENT_TAGS = [
  "Menu de grupo",
  "Serviço rápido",
  "Mesas juntas",
  "Espaço reservado",
  "Cadeiras de bebé",
] as const;
