ALTER TABLE "ReferralPartner" ADD COLUMN "partnerCode" TEXT;

UPDATE "ReferralPartner"
SET "partnerCode" = 'MLP-' || UPPER(SUBSTRING(MD5("id") FROM 1 FOR 8));

ALTER TABLE "ReferralPartner" ALTER COLUMN "partnerCode" SET NOT NULL;

CREATE UNIQUE INDEX "ReferralPartner_partnerCode_key" ON "ReferralPartner"("partnerCode");
