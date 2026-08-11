ALTER TABLE "Restaurant"
ADD COLUMN "websiteFaqTitle" TEXT,
ADD COLUMN "websiteFaqItems" JSONB,
ADD COLUMN "websiteSpecialties" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "websiteLastGeneratedAt" TIMESTAMP(3),
ADD COLUMN "websiteAiVersion" TEXT;

ALTER TABLE "Restaurant"
ADD COLUMN "reviewAutomationEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "reviewDelayHours" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN "marketingAutopilotEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "marketingAutopilotFrequencyDays" INTEGER NOT NULL DEFAULT 14,
ADD COLUMN "marketingAutopilotMaxDiscount" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN "marketingAutopilotLastRunAt" TIMESTAMP(3);

ALTER TABLE "Reservation"
ADD COLUMN "reviewEmailSentAt" TIMESTAMP(3);

CREATE INDEX "Reservation_reviewEmailSentAt_date_idx"
ON "Reservation"("reviewEmailSentAt", "date");

CREATE TABLE "AiVisibilityOptimization" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RUNNING',
  "beforeScore" INTEGER,
  "afterScore" INTEGER,
  "creditCost" INTEGER NOT NULL DEFAULT 20,
  "actions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "fieldsFilled" INTEGER NOT NULL DEFAULT 0,
  "dishesUpdated" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AiVisibilityOptimization_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiVisibilityOptimization_restaurantId_createdAt_idx"
ON "AiVisibilityOptimization"("restaurantId", "createdAt");

CREATE INDEX "AiVisibilityOptimization_restaurantId_status_idx"
ON "AiVisibilityOptimization"("restaurantId", "status");

ALTER TABLE "AiVisibilityOptimization"
ADD CONSTRAINT "AiVisibilityOptimization_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AiMarketingCampaign" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "segment" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "offerTitle" TEXT,
  "offerDescription" TEXT,
  "discountPercent" INTEGER,
  "promoCode" TEXT,
  "validUntil" TIMESTAMP(3),
  "cardToken" TEXT,
  "cardTheme" TEXT NOT NULL DEFAULT 'GOLD',
  "aiReason" TEXT,
  "audienceSize" INTEGER NOT NULL DEFAULT 0,
  "emailsSent" INTEGER NOT NULL DEFAULT 0,
  "aiCreditCost" INTEGER NOT NULL DEFAULT 3,
  "error" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AiMarketingCampaign_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiMarketingCampaign_cardToken_key" ON "AiMarketingCampaign"("cardToken");
CREATE INDEX "AiMarketingCampaign_restaurantId_createdAt_idx" ON "AiMarketingCampaign"("restaurantId", "createdAt");
CREATE INDEX "AiMarketingCampaign_restaurantId_status_idx" ON "AiMarketingCampaign"("restaurantId", "status");

ALTER TABLE "AiMarketingCampaign"
ADD CONSTRAINT "AiMarketingCampaign_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
