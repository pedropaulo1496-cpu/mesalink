CREATE TABLE "MarketingPromoCard" (
    "id" TEXT NOT NULL,
    "publicCode" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "customerId" TEXT,
    "reviewFeedbackId" TEXT,
    "campaignId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "benefitType" TEXT NOT NULL DEFAULT 'PERCENT',
    "value" DECIMAL(10,2),
    "minSpend" DECIMAL(10,2),
    "terms" TEXT,
    "template" TEXT NOT NULL DEFAULT 'GOLD',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketingPromoCard_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketingPromoCard_publicCode_key" ON "MarketingPromoCard"("publicCode");
CREATE UNIQUE INDEX "MarketingPromoCard_reviewFeedbackId_key" ON "MarketingPromoCard"("reviewFeedbackId");
CREATE INDEX "MarketingPromoCard_restaurantId_status_idx" ON "MarketingPromoCard"("restaurantId", "status");
CREATE INDEX "MarketingPromoCard_customerId_status_idx" ON "MarketingPromoCard"("customerId", "status");
CREATE INDEX "MarketingPromoCard_expiresAt_status_idx" ON "MarketingPromoCard"("expiresAt", "status");
ALTER TABLE "MarketingPromoCard" ADD CONSTRAINT "MarketingPromoCard_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketingPromoCard" ADD CONSTRAINT "MarketingPromoCard_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
