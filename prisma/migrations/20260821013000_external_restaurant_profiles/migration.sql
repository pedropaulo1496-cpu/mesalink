ALTER TABLE "ExternalRestaurantPlace"
  ADD COLUMN "websiteUrl" TEXT,
  ADD COLUMN "heroImage" TEXT,
  ADD COLUMN "galleryImages" JSONB,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "openingHours" TEXT,
  ADD COLUMN "rating" DOUBLE PRECISION,
  ADD COLUMN "reviewCount" INTEGER,
  ADD COLUMN "ratingSource" TEXT,
  ADD COLUMN "priceLevel" INTEGER,
  ADD COLUMN "enrichedAt" TIMESTAMP(3);

CREATE INDEX "ExternalRestaurantPlace_enrichedAt_idx" ON "ExternalRestaurantPlace"("enrichedAt");
