ALTER TABLE "Restaurant"
ADD COLUMN "externalPlaceProvider" TEXT,
ADD COLUMN "externalPlaceId" TEXT,
ADD COLUMN "externalPlaceSyncedAt" TIMESTAMP(3),
ADD COLUMN "externalMapUrl" TEXT;

CREATE INDEX "Restaurant_externalPlaceProvider_externalPlaceId_idx"
ON "Restaurant"("externalPlaceProvider", "externalPlaceId");

CREATE TABLE "ExternalRestaurantPlace" (
    "provider" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactCheckedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSelectedAt" TIMESTAMP(3),
    "selectionCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExternalRestaurantPlace_pkey" PRIMARY KEY ("placeId")
);

CREATE UNIQUE INDEX "ExternalRestaurantPlace_provider_placeId_key" ON "ExternalRestaurantPlace"("provider", "placeId");
CREATE INDEX "ExternalRestaurantPlace_lastSeenAt_idx" ON "ExternalRestaurantPlace"("lastSeenAt");
CREATE INDEX "ExternalRestaurantPlace_contactCheckedAt_idx" ON "ExternalRestaurantPlace"("contactCheckedAt");
