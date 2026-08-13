ALTER TABLE "Restaurant"
ADD COLUMN "googleBusinessAccountName" TEXT,
ADD COLUMN "googleBusinessLocationName" TEXT,
ADD COLUMN "googleBusinessRefreshToken" TEXT,
ADD COLUMN "googleBusinessTitle" TEXT,
ADD COLUMN "googleBusinessAddress" TEXT,
ADD COLUMN "googleBusinessPhotos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "googleBusinessConnectedAt" TIMESTAMP(3),
ADD COLUMN "googleBusinessSyncedAt" TIMESTAMP(3);
