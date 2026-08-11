-- Add first-party email engagement tracking to Revenue AI actions.
ALTER TABLE "MarketingAction"
ADD COLUMN "trackingToken" TEXT,
ADD COLUMN "openCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "clickCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastOpenedAt" TIMESTAMP(3),
ADD COLUMN "lastClickedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "MarketingAction_trackingToken_key"
ON "MarketingAction"("trackingToken");
