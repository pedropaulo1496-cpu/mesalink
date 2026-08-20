ALTER TABLE "ExternalRestaurantPlace"
ADD COLUMN "name" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "address" TEXT,
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION,
ADD COLUMN "phone" TEXT,
ADD COLUMN "cuisine" TEXT,
ADD COLUMN "mapUrl" TEXT,
ADD COLUMN "contactSourceUrl" TEXT,
ADD COLUMN "photoSourceUrl" TEXT,
ADD COLUMN "dataSourceUrl" TEXT,
ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "verifiedAt" TIMESTAMP(3);

CREATE INDEX "ExternalRestaurantPlace_provider_city_published_idx"
ON "ExternalRestaurantPlace"("provider", "city", "published");

CREATE INDEX "ExternalRestaurantPlace_published_lastSeenAt_idx"
ON "ExternalRestaurantPlace"("published", "lastSeenAt");
