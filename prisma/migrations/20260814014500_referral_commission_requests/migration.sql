CREATE TABLE "ReferralCommissionRequest" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "commissionType" TEXT NOT NULL DEFAULT 'PER_PERSON',
  "commissionAmount" DECIMAL(10,2) NOT NULL,
  "message" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "respondedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReferralCommissionRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReferralCommissionRequest_restaurantId_status_createdAt_idx"
ON "ReferralCommissionRequest"("restaurantId", "status", "createdAt");

CREATE INDEX "ReferralCommissionRequest_partnerId_restaurantId_status_idx"
ON "ReferralCommissionRequest"("partnerId", "restaurantId", "status");

ALTER TABLE "ReferralCommissionRequest"
ADD CONSTRAINT "ReferralCommissionRequest_partnerId_fkey"
FOREIGN KEY ("partnerId") REFERENCES "ReferralPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReferralCommissionRequest"
ADD CONSTRAINT "ReferralCommissionRequest_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
