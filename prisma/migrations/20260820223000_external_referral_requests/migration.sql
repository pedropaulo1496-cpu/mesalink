ALTER TABLE "ReferralOffer"
ADD COLUMN "publicAccessTokenHash" TEXT,
ADD COLUMN "publicAccessExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "ReferralOffer_publicAccessTokenHash_key"
ON "ReferralOffer"("publicAccessTokenHash");
