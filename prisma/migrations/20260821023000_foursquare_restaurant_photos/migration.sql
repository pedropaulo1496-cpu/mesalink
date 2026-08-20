ALTER TABLE "ExternalRestaurantPlace"
  ADD COLUMN "photoCheckedAt" TIMESTAMP(3);

CREATE TABLE "ExternalApiUsage" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "callCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ExternalApiUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExternalApiUsage_provider_period_key" ON "ExternalApiUsage"("provider", "period");
CREATE INDEX "ExternalApiUsage_provider_period_idx" ON "ExternalApiUsage"("provider", "period");
