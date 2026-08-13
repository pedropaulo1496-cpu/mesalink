ALTER TABLE "Restaurant"
ADD COLUMN "referralPaymentBlockedAt" TIMESTAMP(3),
ADD COLUMN "referralPaymentBlockReason" TEXT;
