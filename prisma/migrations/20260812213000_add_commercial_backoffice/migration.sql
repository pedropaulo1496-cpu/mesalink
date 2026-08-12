ALTER TABLE "User"
ADD COLUMN "lastLoginAt" TIMESTAMP(3),
ADD COLUMN "lastActiveAt" TIMESTAMP(3),
ADD COLUMN "salesRepresentativeId" TEXT,
ADD COLUMN "salesPlanCommissionPercent" DECIMAL(5,2),
ADD COLUMN "salesExtraCommissionPercent" DECIMAL(5,2);

ALTER TABLE "Subscription"
ADD COLUMN "whatsappMessageBalance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "whatsappMessagesSent" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "SalesRepresentative" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "defaultPlanCommissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 10,
  "defaultExtraCommissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 5,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SalesRepresentative_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SalesCommission" (
  "id" TEXT NOT NULL,
  "salesRepresentativeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "grossAmount" DECIMAL(12,2) NOT NULL,
  "commissionPercent" DECIMAL(5,2) NOT NULL,
  "commissionAmount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SalesCommission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommercialRequest" (
  "id" TEXT NOT NULL,
  "salesRepresentativeId" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amount" DECIMAL(12,2),
  "duration" TEXT,
  "durationMonths" INTEGER,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "adminNote" TEXT,
  "decidedById" TEXT,
  "decidedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommercialRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommercialMessage" (
  "id" TEXT NOT NULL,
  "salesRepresentativeId" TEXT NOT NULL,
  "senderUserId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommercialMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminPromotion" (
  "id" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "requestId" TEXT,
  "code" TEXT NOT NULL,
  "percentOff" INTEGER NOT NULL,
  "duration" TEXT NOT NULL DEFAULT 'ONCE',
  "durationMonths" INTEGER,
  "expiresAt" TIMESTAMP(3),
  "stripeCouponId" TEXT,
  "stripePromotionCodeId" TEXT,
  "emailDeliveryId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'CREATED',
  "sentAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminPromotion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WhatsAppUsage" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "restaurantId" TEXT,
  "reference" TEXT NOT NULL,
  "externalId" TEXT,
  "category" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RESERVED',
  "aiCreditCharged" INTEGER NOT NULL DEFAULT 0,
  "balanceAfter" INTEGER NOT NULL,
  "sentAt" TIMESTAMP(3),
  "refundedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WhatsAppUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SalesRepresentative_userId_key" ON "SalesRepresentative"("userId");
CREATE UNIQUE INDEX "SalesRepresentative_email_key" ON "SalesRepresentative"("email");
CREATE INDEX "SalesRepresentative_active_idx" ON "SalesRepresentative"("active");
CREATE UNIQUE INDEX "SalesCommission_sourceType_sourceId_key" ON "SalesCommission"("sourceType", "sourceId");
CREATE INDEX "SalesCommission_salesRepresentativeId_status_earnedAt_idx" ON "SalesCommission"("salesRepresentativeId", "status", "earnedAt");
CREATE INDEX "SalesCommission_userId_earnedAt_idx" ON "SalesCommission"("userId", "earnedAt");
CREATE INDEX "CommercialRequest_salesRepresentativeId_status_createdAt_idx" ON "CommercialRequest"("salesRepresentativeId", "status", "createdAt");
CREATE INDEX "CommercialRequest_targetUserId_createdAt_idx" ON "CommercialRequest"("targetUserId", "createdAt");
CREATE INDEX "CommercialRequest_status_createdAt_idx" ON "CommercialRequest"("status", "createdAt");
CREATE INDEX "CommercialMessage_salesRepresentativeId_createdAt_idx" ON "CommercialMessage"("salesRepresentativeId", "createdAt");
CREATE INDEX "CommercialMessage_salesRepresentativeId_readAt_idx" ON "CommercialMessage"("salesRepresentativeId", "readAt");
CREATE UNIQUE INDEX "AdminPromotion_requestId_key" ON "AdminPromotion"("requestId");
CREATE UNIQUE INDEX "AdminPromotion_code_key" ON "AdminPromotion"("code");
CREATE UNIQUE INDEX "AdminPromotion_stripeCouponId_key" ON "AdminPromotion"("stripeCouponId");
CREATE UNIQUE INDEX "AdminPromotion_stripePromotionCodeId_key" ON "AdminPromotion"("stripePromotionCodeId");
CREATE INDEX "AdminPromotion_targetUserId_createdAt_idx" ON "AdminPromotion"("targetUserId", "createdAt");
CREATE INDEX "AdminPromotion_status_createdAt_idx" ON "AdminPromotion"("status", "createdAt");
CREATE INDEX "User_salesRepresentativeId_idx" ON "User"("salesRepresentativeId");
CREATE INDEX "User_lastActiveAt_idx" ON "User"("lastActiveAt");
CREATE UNIQUE INDEX "WhatsAppUsage_reference_key" ON "WhatsAppUsage"("reference");
CREATE UNIQUE INDEX "WhatsAppUsage_externalId_key" ON "WhatsAppUsage"("externalId");
CREATE INDEX "WhatsAppUsage_userId_createdAt_idx" ON "WhatsAppUsage"("userId", "createdAt");
CREATE INDEX "WhatsAppUsage_restaurantId_createdAt_idx" ON "WhatsAppUsage"("restaurantId", "createdAt");
CREATE INDEX "WhatsAppUsage_status_createdAt_idx" ON "WhatsAppUsage"("status", "createdAt");

ALTER TABLE "SalesRepresentative" ADD CONSTRAINT "SalesRepresentative_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_salesRepresentativeId_fkey" FOREIGN KEY ("salesRepresentativeId") REFERENCES "SalesRepresentative"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_salesRepresentativeId_fkey" FOREIGN KEY ("salesRepresentativeId") REFERENCES "SalesRepresentative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommercialRequest" ADD CONSTRAINT "CommercialRequest_salesRepresentativeId_fkey" FOREIGN KEY ("salesRepresentativeId") REFERENCES "SalesRepresentative"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialRequest" ADD CONSTRAINT "CommercialRequest_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialRequest" ADD CONSTRAINT "CommercialRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommercialMessage" ADD CONSTRAINT "CommercialMessage_salesRepresentativeId_fkey" FOREIGN KEY ("salesRepresentativeId") REFERENCES "SalesRepresentative"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialMessage" ADD CONSTRAINT "CommercialMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminPromotion" ADD CONSTRAINT "AdminPromotion_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminPromotion" ADD CONSTRAINT "AdminPromotion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminPromotion" ADD CONSTRAINT "AdminPromotion_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CommercialRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WhatsAppUsage" ADD CONSTRAINT "WhatsAppUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
