-- Every MesaLink account starts with 1,000 included restaurant emails.
ALTER TABLE "Subscription"
ADD COLUMN "emailBalance" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN "emailsSent" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "EmailUsage" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "restaurantId" TEXT,
  "reference" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RESERVED',
  "aiCreditCharged" INTEGER NOT NULL DEFAULT 0,
  "balanceAfter" INTEGER NOT NULL,
  "sentAt" TIMESTAMP(3),
  "refundedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EmailUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailUsage_reference_key" ON "EmailUsage"("reference");
CREATE INDEX "EmailUsage_userId_createdAt_idx" ON "EmailUsage"("userId", "createdAt");
CREATE INDEX "EmailUsage_restaurantId_createdAt_idx" ON "EmailUsage"("restaurantId", "createdAt");
CREATE INDEX "EmailUsage_status_createdAt_idx" ON "EmailUsage"("status", "createdAt");

ALTER TABLE "EmailUsage"
ADD CONSTRAINT "EmailUsage_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
