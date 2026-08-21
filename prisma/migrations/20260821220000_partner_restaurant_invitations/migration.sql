CREATE TABLE "ReferralPartnerRestaurantInvitation" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "restaurantId" TEXT,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralPartnerRestaurantInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReferralPartnerRestaurantInvitation_tokenHash_key"
ON "ReferralPartnerRestaurantInvitation"("tokenHash");

CREATE INDEX "ReferralPartnerRestaurantInvitation_partnerId_email_createdAt_idx"
ON "ReferralPartnerRestaurantInvitation"("partnerId", "email", "createdAt");

CREATE INDEX "ReferralPartnerRestaurantInvitation_email_acceptedAt_idx"
ON "ReferralPartnerRestaurantInvitation"("email", "acceptedAt");

ALTER TABLE "ReferralPartnerRestaurantInvitation"
ADD CONSTRAINT "ReferralPartnerRestaurantInvitation_partnerId_fkey"
FOREIGN KEY ("partnerId") REFERENCES "ReferralPartner"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReferralPartnerRestaurantInvitation"
ADD CONSTRAINT "ReferralPartnerRestaurantInvitation_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
