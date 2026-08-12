export type PriceBenchmarkPosition = "BELOW" | "ALIGNED" | "ABOVE" | "INSUFFICIENT_DATA";
export type PriceBenchmarkConfidence = "LOW" | "MEDIUM" | "HIGH";

export type PriceComparable = {
  name: string;
  area: string;
  estimatedTicket: number | null;
  qualitySignal: string;
};

export type PriceBenchmark = {
  status: "READY" | "INSUFFICIENT_DATA";
  position: PriceBenchmarkPosition;
  confidence: PriceBenchmarkConfidence;
  marketLow: number | null;
  marketMedian: number | null;
  marketHigh: number | null;
  restaurantTicket: number;
  restaurantMenuMedian: number | null;
  differencePercent: number | null;
  comparableCount: number;
  qualityBand: string;
  summary: string;
  recommendation: string;
  comparables: PriceComparable[];
  sourceUrls: string[];
};

type RawBenchmark = {
  status?: unknown;
  confidence?: unknown;
  marketLow?: unknown;
  marketMedian?: unknown;
  marketHigh?: unknown;
  comparableCount?: unknown;
  qualityBand?: unknown;
  summary?: unknown;
  recommendation?: unknown;
  comparables?: unknown;
  sourceUrls?: unknown;
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;
const cleanText = (value: unknown, length: number) => String(value || "").trim().slice(0, length);
const nullableMoney = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 && number < 1000 ? roundMoney(number) : null;
};

export function median(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  if (!clean.length) return null;
  const middle = Math.floor(clean.length / 2);
  return roundMoney(clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2);
}

export function cleanPriceBenchmark(raw: RawBenchmark, restaurantTicket: number, restaurantMenuMedian: number | null): PriceBenchmark {
  const marketLow = nullableMoney(raw.marketLow);
  const marketMedian = nullableMoney(raw.marketMedian);
  const marketHigh = nullableMoney(raw.marketHigh);
  const comparableCount = Math.max(0, Math.min(20, Math.round(Number(raw.comparableCount) || 0)));
  const hasReliableRange = comparableCount >= 3 && marketLow !== null && marketMedian !== null && marketHigh !== null && marketLow <= marketMedian && marketMedian <= marketHigh;
  const status = raw.status === "READY" && hasReliableRange ? "READY" : "INSUFFICIENT_DATA";
  const differencePercent = status === "READY" && marketMedian
    ? Math.round(((restaurantTicket - marketMedian) / marketMedian) * 100)
    : null;
  const position: PriceBenchmarkPosition = status !== "READY" || marketLow === null || marketHigh === null
    ? "INSUFFICIENT_DATA"
    : restaurantTicket < marketLow * 0.95
      ? "BELOW"
      : restaurantTicket > marketHigh * 1.05
        ? "ABOVE"
        : "ALIGNED";
  const confidence: PriceBenchmarkConfidence = raw.confidence === "HIGH" && comparableCount >= 7
    ? "HIGH"
    : raw.confidence === "MEDIUM" && comparableCount >= 4
      ? "MEDIUM"
      : "LOW";
  const comparables = Array.isArray(raw.comparables) ? raw.comparables.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const comparable = item as Record<string, unknown>;
    const name = cleanText(comparable.name, 120);
    if (!name) return [];
    return [{
      name,
      area: cleanText(comparable.area, 100),
      estimatedTicket: nullableMoney(comparable.estimatedTicket),
      qualitySignal: cleanText(comparable.qualitySignal, 160),
    }];
  }).slice(0, 8) : [];
  const sourceUrls = Array.isArray(raw.sourceUrls)
    ? [...new Set(raw.sourceUrls.map(String).filter((url) => /^https:\/\//i.test(url)))].slice(0, 12)
    : [];

  return {
    status,
    position,
    confidence,
    marketLow,
    marketMedian,
    marketHigh,
    restaurantTicket: roundMoney(restaurantTicket),
    restaurantMenuMedian,
    differencePercent,
    comparableCount,
    qualityBand: cleanText(raw.qualityBand, 120) || "Segmento comparável",
    summary: cleanText(raw.summary, 600) || (status === "READY" ? "Comparação concluída com restaurantes semelhantes." : "Não foram encontrados dados públicos suficientes para uma comparação responsável."),
    recommendation: cleanText(raw.recommendation, 500) || (status === "READY" ? "Reveja o posicionamento em conjunto com a procura, margem e proposta de valor." : "Mantenha os preços e volte a medir quando existirem mais fontes públicas comparáveis."),
    comparables,
    sourceUrls,
  };
}

export function parsePriceBenchmark(value: unknown): PriceBenchmark | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Partial<PriceBenchmark>;
  if (item.status !== "READY" && item.status !== "INSUFFICIENT_DATA") return null;
  if (typeof item.restaurantTicket !== "number" || !Number.isFinite(item.restaurantTicket)) return null;
  return item as PriceBenchmark;
}
