import { domainToASCII } from "node:url";

export const DOMAIN_QUOTE_TTL_MS = 15 * 60 * 1000;
export const DOMAIN_SERVICE_PERCENT_BPS = 500;
export const DOMAIN_SERVICE_FIXED_CENTS = 100;

function envInteger(name: string, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

export function getDomainStripeFeeConfig() {
  return {
    bps: envInteger("DOMAIN_STRIPE_FEE_BPS", 150, 0, 1000),
    fixedCents: envInteger("DOMAIN_STRIPE_FEE_FIXED_CENTS", 25, 0, 500),
  };
}

export function normalizeCustomDomain(input: unknown) {
  const value = String(input || "").trim().toLowerCase();
  if (!value) throw new Error("Indica um domínio.");
  if (value.length > 253) throw new Error("O domínio é demasiado comprido.");
  if (value.includes("/") || value.includes(":") || value.includes("?") || value.includes("#")) {
    throw new Error("Escreve apenas o domínio, por exemplo restaurante.pt.");
  }

  const ascii = domainToASCII(value.replace(/\.$/, ""));
  if (!ascii || ascii.length > 253 || !ascii.includes(".")) {
    throw new Error("O domínio não é válido.");
  }

  const labels = ascii.split(".");
  if (
    labels.some(
      (label) =>
        !label ||
        label.length > 63 ||
        label.startsWith("-") ||
        label.endsWith("-") ||
        !/^[a-z0-9-]+$/.test(label),
    )
  ) {
    throw new Error("O domínio não é válido.");
  }

  if (ascii === "mesalink.pt" || ascii.endsWith(".mesalink.pt") || ascii.endsWith(".vercel.app")) {
    throw new Error("Este domínio já pertence à infraestrutura MesaLink.");
  }

  return ascii;
}

export function calculateDomainPrice(providerPriceCents: number) {
  if (!Number.isInteger(providerPriceCents) || providerPriceCents < 0) {
    throw new Error("Preço de domínio inválido.");
  }

  const servicePercentCents = Math.ceil(
    (providerPriceCents * DOMAIN_SERVICE_PERCENT_BPS) / 10_000,
  );
  const subtotalCents =
    providerPriceCents + servicePercentCents + DOMAIN_SERVICE_FIXED_CENTS;
  const stripe = getDomainStripeFeeConfig();
  const totalCents = Math.ceil(
    (subtotalCents + stripe.fixedCents) / (1 - stripe.bps / 10_000),
  );

  return {
    providerPriceCents,
    servicePercentBps: DOMAIN_SERVICE_PERCENT_BPS,
    servicePercentCents,
    serviceFixedCents: DOMAIN_SERVICE_FIXED_CENTS,
    stripeFeeBps: stripe.bps,
    stripeFeeFixedCents: stripe.fixedCents,
    stripeFeeCents: totalCents - subtotalCents,
    totalCents,
  };
}

export async function getUsdToEurRate() {
  const configured = Number(process.env.DOMAIN_USD_TO_EUR_RATE || "");
  if (Number.isFinite(configured) && configured > 0.5 && configured < 1.5) {
    return configured;
  }

  const end = new Date();
  const start = new Date(end.getTime() - 10 * 24 * 60 * 60 * 1000);
  const date = (value: Date) => value.toISOString().slice(0, 10);

  try {
    const response = await fetch(
      `https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?startPeriod=${date(start)}&endPeriod=${date(end)}&format=csvdata`,
      { signal: AbortSignal.timeout(5_000), next: { revalidate: 21_600 } },
    );
    if (!response.ok) throw new Error(`ECB ${response.status}`);
    const csv = await response.text();
    const lines = csv.trim().split(/\r?\n/);
    const headers = lines[0]?.split(",");
    const valueIndex = headers?.indexOf("OBS_VALUE") ?? -1;
    if (valueIndex < 0) throw new Error("ECB response without OBS_VALUE");
    const lastValue = [...lines.slice(1)]
      .reverse()
      .map((line) => Number(line.split(",")[valueIndex]))
      .find((value) => Number.isFinite(value) && value > 0);
    if (!lastValue) throw new Error("ECB response without exchange rate");
    return lastValue;
  } catch (error) {
    console.error("ECB exchange-rate lookup failed", error);
    return 1;
  }
}

export function providerUsdToEurCents(price: number, usdToEur: number) {
  if (!Number.isFinite(price) || price < 0) throw new Error("Preço do fornecedor inválido.");
  return Math.ceil(price * usdToEur * 100);
}

export function formatMoney(cents: number, locale = "pt-PT") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
