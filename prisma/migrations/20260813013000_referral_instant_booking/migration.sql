ALTER TABLE "Restaurant"
ADD COLUMN "referralAutoAcceptEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "referralPaymentMethodId" TEXT,
ADD COLUMN "referralDefaultDailyCapacity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "googlePlaceId" TEXT,
ADD COLUMN "googleRating" DOUBLE PRECISION,
ADD COLUMN "googleReviewCount" INTEGER,
ADD COLUMN "googlePriceLevel" INTEGER;

CREATE TABLE "ReferralDailyCapacity" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralDailyCapacity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReferralDailyCapacity_restaurantId_date_key"
ON "ReferralDailyCapacity"("restaurantId", "date");

CREATE INDEX "ReferralDailyCapacity_restaurantId_date_enabled_idx"
ON "ReferralDailyCapacity"("restaurantId", "date", "enabled");

ALTER TABLE "ReferralDailyCapacity"
ADD CONSTRAINT "ReferralDailyCapacity_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
