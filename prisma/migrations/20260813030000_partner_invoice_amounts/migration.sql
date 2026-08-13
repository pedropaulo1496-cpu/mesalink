ALTER TABLE "ReferralPayment"
ADD COLUMN "partnerInvoiceBase" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "partnerInvoiceTax" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "partnerInvoiceTotal" DECIMAL(10,2) NOT NULL DEFAULT 0;

UPDATE "ReferralPayment"
SET
  "partnerInvoiceBase" = "partnerNet",
  "partnerInvoiceTax" = CASE
    WHEN "grossCommission" + "serviceFee" > 0
      THEN ROUND("taxAmount" * "partnerNet" / ("grossCommission" + "serviceFee"), 2)
    ELSE 0
  END,
  "partnerInvoiceTotal" = "partnerNet" + CASE
    WHEN "grossCommission" + "serviceFee" > 0
      THEN ROUND("taxAmount" * "partnerNet" / ("grossCommission" + "serviceFee"), 2)
    ELSE 0
  END;
