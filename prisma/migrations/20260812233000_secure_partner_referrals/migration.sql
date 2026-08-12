ALTER TABLE "ReferralGroup"
ADD COLUMN "actualGuests" INTEGER,
ADD COLUMN "customerName" TEXT,
ADD COLUMN "customerPhone" TEXT,
ADD COLUMN "customerEmail" TEXT,
ADD COLUMN "contactRevealedAt" TIMESTAMP(3),
ADD COLUMN "targetMode" TEXT NOT NULL DEFAULT 'SELECTED',
ADD COLUMN "targetSummary" TEXT;

ALTER TABLE "Restaurant"
ADD COLUMN "billingLegalName" TEXT,
ADD COLUMN "billingTaxId" TEXT,
ADD COLUMN "billingTaxIdType" TEXT,
ADD COLUMN "billingEmail" TEXT,
ADD COLUMN "billingAddressLine1" TEXT,
ADD COLUMN "billingAddressLine2" TEXT,
ADD COLUMN "billingPostalCode" TEXT,
ADD COLUMN "billingCity" TEXT,
ADD COLUMN "billingState" TEXT,
ADD COLUMN "billingCountry" TEXT,
ADD COLUMN "billingDetailsSyncedAt" TIMESTAMP(3);

ALTER TABLE "ReferralPayment"
ADD COLUMN "authorizedAt" TIMESTAMP(3),
ADD COLUMN "authorizationExpiresAt" TIMESTAMP(3),
ADD COLUMN "capturedAt" TIMESTAMP(3),
ADD COLUMN "payoutDueAt" TIMESTAMP(3),
ADD COLUMN "payoutConfirmedAt" TIMESTAMP(3),
ADD COLUMN "partnerInvoiceUrl" TEXT,
ADD COLUMN "partnerInvoiceNumber" TEXT,
ADD COLUMN "partnerInvoiceUploadedAt" TIMESTAMP(3),
ADD COLUMN "partnerInvoiceStatus" TEXT NOT NULL DEFAULT 'MISSING',
ADD COLUMN "partnerInvoiceVerifiedAt" TIMESTAMP(3),
ADD COLUMN "partnerInvoiceVerifiedBy" TEXT,
ADD COLUMN "partnerInvoiceRejectedAt" TIMESTAMP(3),
ADD COLUMN "partnerInvoiceRejectionReason" TEXT;

ALTER TABLE "ReferralPayment"
ADD COLUMN "stripeInvoiceId" TEXT,
ADD COLUMN "stripeInvoiceUrl" TEXT,
ADD COLUMN "stripeInvoicePdfUrl" TEXT;

CREATE UNIQUE INDEX "ReferralPayment_stripeInvoiceId_key"
ON "ReferralPayment"("stripeInvoiceId");

CREATE INDEX "ReferralPayment_payoutDueAt_status_idx"
ON "ReferralPayment"("payoutDueAt", "status");

CREATE INDEX "ReferralPayment_partnerInvoiceStatus_payoutDueAt_idx"
ON "ReferralPayment"("partnerInvoiceStatus", "payoutDueAt");
