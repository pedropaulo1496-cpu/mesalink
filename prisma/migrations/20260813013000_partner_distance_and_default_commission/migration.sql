ALTER TABLE "Restaurant"
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION;

ALTER TABLE "ReferralPayment"
ADD COLUMN "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "taxCountry" TEXT;

ALTER TABLE "ReferralPartner"
ALTER COLUMN "defaultCommissionAmount" SET DEFAULT 1;

UPDATE "ReferralPartner"
SET "defaultCommissionAmount" = 1
WHERE "defaultCommissionType" = 'PER_PERSON'
  AND "defaultCommissionAmount" = 5;
