import type Stripe from "stripe";

export const MESALINK_SERVICE_TAX_CODE = "txcd_20030000";
export const MESALINK_DIGITAL_TAX_CODE = "txcd_10103101";

export function referralPriceData({
  currency,
  unitAmount,
  name,
  description,
}: {
  currency: string;
  unitAmount: number;
  name: string;
  description: string;
}): Stripe.Checkout.SessionCreateParams.LineItem.PriceData {
  return {
    currency,
    unit_amount: unitAmount,
    tax_behavior: "exclusive",
    product_data: {
      name,
      description,
      tax_code: MESALINK_SERVICE_TAX_CODE,
    },
  };
}

export function checkoutTaxAmount(session: Pick<Stripe.Checkout.Session, "amount_subtotal" | "amount_total" | "total_details">) {
  return session.total_details?.amount_tax
    ?? Math.max(0, (session.amount_total || 0) - (session.amount_subtotal || 0));
}

export function proportionalTaxAmount({
  originalSubtotal,
  originalTax,
  targetSubtotal,
}: {
  originalSubtotal: number;
  originalTax: number;
  targetSubtotal: number;
}) {
  if (originalSubtotal <= 0 || originalTax <= 0 || targetSubtotal <= 0) return 0;
  return Math.round(targetSubtotal * (originalTax / originalSubtotal));
}
