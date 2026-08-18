ALTER TABLE "Restaurant"
ADD COLUMN "nearbyReferralEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "outboundReferralPartnerId" TEXT;

CREATE UNIQUE INDEX "Restaurant_outboundReferralPartnerId_key"
ON "Restaurant"("outboundReferralPartnerId");

ALTER TABLE "Restaurant"
ADD CONSTRAINT "Restaurant_outboundReferralPartnerId_fkey"
FOREIGN KEY ("outboundReferralPartnerId") REFERENCES "ReferralPartner"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
