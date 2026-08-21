CREATE TABLE "ReferralPartnerFavorite" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralPartnerFavorite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReferralPartnerFavorite_partnerId_provider_placeId_key"
ON "ReferralPartnerFavorite"("partnerId", "provider", "placeId");

CREATE INDEX "ReferralPartnerFavorite_partnerId_createdAt_idx"
ON "ReferralPartnerFavorite"("partnerId", "createdAt");

ALTER TABLE "ReferralPartnerFavorite"
ADD CONSTRAINT "ReferralPartnerFavorite_partnerId_fkey"
FOREIGN KEY ("partnerId") REFERENCES "ReferralPartner"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
