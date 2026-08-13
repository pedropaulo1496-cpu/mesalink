import { randomBytes } from "crypto";

export const MESALINK_REFERRAL_FEE_PERCENT = 15;
export const MESALINK_REFERRAL_SERVICE_PERCENT = 5;
export const MESALINK_REFERRAL_SERVICE_FIXED = 0.35;

export type CommissionType = "PER_PERSON" | "TOTAL";

export function isCommissionType(value: unknown): value is CommissionType {
  return value === "PER_PERSON" || value === "TOTAL";
}

export function calculateReferralCommission({
  guests,
  commissionType,
  commissionAmount,
  platformFeePercent = MESALINK_REFERRAL_FEE_PERCENT,
}: {
  guests: number;
  commissionType: CommissionType;
  commissionAmount: number;
  platformFeePercent?: number;
}) {
  const gross = roundCurrency(
    commissionType === "PER_PERSON" ? guests * commissionAmount : commissionAmount,
  );
  const platformFee = roundCurrency(gross * (platformFeePercent / 100));
  const partnerNet = roundCurrency(gross - platformFee);

  return { gross, platformFee, partnerNet };
}

export function createReferralCode() {
  return `ML-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function calculateReferralServiceFee(grossCommission: number) {
  return roundCurrency(grossCommission * (MESALINK_REFERRAL_SERVICE_PERCENT / 100) + MESALINK_REFERRAL_SERVICE_FIXED);
}

export function calculatePartnerInvoiceAmounts({
  partnerNet,
  grossCommission,
  serviceFee,
  taxAmount,
}: {
  partnerNet: number;
  grossCommission: number;
  serviceFee: number;
  taxAmount: number;
}) {
  const base = roundCurrency(Math.max(0, partnerNet));
  const taxableSubtotal = Math.max(0, grossCommission) + Math.max(0, serviceFee);
  const tax = taxableSubtotal > 0
    ? roundCurrency(Math.max(0, taxAmount) * (base / taxableSubtotal))
    : 0;
  return { base, tax, total: roundCurrency(base + tax) };
}

export function createBenefitCardCode() {
  return `MLC-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export function sanitizeReferralNotes(value: unknown) {
  if (typeof value !== "string") return null;

  const clean = value
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[contacto removido]")
    .replace(/(?:\+?\d[\s().-]?){7,}/g, "[contacto removido]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);

  return clean || null;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
