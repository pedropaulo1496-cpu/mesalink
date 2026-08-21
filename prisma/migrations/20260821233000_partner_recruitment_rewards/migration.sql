ALTER TABLE "ReferralPartnerRestaurantInvitation"
ADD COLUMN "rewardEligible" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ReferralPartnerRecruitmentReward" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TRACKING',
    "paidMonths" INTEGER NOT NULL DEFAULT 0,
    "baseAmount" DECIMAL(10,2) NOT NULL DEFAULT 100,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 23,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 23,
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 123,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "coverageStartedAt" TIMESTAMP(3),
    "paidThroughAt" TIMESTAMP(3),
    "qualifiedAt" TIMESTAMP(3),
    "payoutDueAt" TIMESTAMP(3),
    "partnerInvoiceUrl" TEXT,
    "partnerInvoiceNumber" TEXT,
    "partnerInvoiceUploadedAt" TIMESTAMP(3),
    "partnerInvoiceStatus" TEXT NOT NULL DEFAULT 'MISSING',
    "partnerInvoiceVerifiedAt" TIMESTAMP(3),
    "partnerInvoiceVerifiedBy" TEXT,
    "partnerInvoiceRejectedAt" TIMESTAMP(3),
    "partnerInvoiceRejectionReason" TEXT,
    "stripeTransferId" TEXT,
    "transferredAt" TIMESTAMP(3),
    "payoutConfirmedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReferralPartnerRecruitmentReward_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartnerRecruitmentSubscriptionInvoice" (
    "id" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "amountPaid" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerRecruitmentSubscriptionInvoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReferralPartnerRecruitmentReward_invitationId_key" ON "ReferralPartnerRecruitmentReward"("invitationId");
CREATE UNIQUE INDEX "ReferralPartnerRecruitmentReward_restaurantId_key" ON "ReferralPartnerRecruitmentReward"("restaurantId");
CREATE UNIQUE INDEX "ReferralPartnerRecruitmentReward_stripeTransferId_key" ON "ReferralPartnerRecruitmentReward"("stripeTransferId");
CREATE INDEX "ReferralPartnerRecruitmentReward_partnerId_status_idx" ON "ReferralPartnerRecruitmentReward"("partnerId", "status");
CREATE INDEX "ReferralPartnerRecruitmentReward_status_payoutDueAt_idx" ON "ReferralPartnerRecruitmentReward"("status", "payoutDueAt");
CREATE UNIQUE INDEX "PartnerRecruitmentSubscriptionInvoice_stripeInvoiceId_key" ON "PartnerRecruitmentSubscriptionInvoice"("stripeInvoiceId");
CREATE INDEX "PartnerRecruitmentSubscriptionInvoice_rewardId_periodStart_idx" ON "PartnerRecruitmentSubscriptionInvoice"("rewardId", "periodStart");

ALTER TABLE "ReferralPartnerRecruitmentReward"
ADD CONSTRAINT "ReferralPartnerRecruitmentReward_invitationId_fkey"
FOREIGN KEY ("invitationId") REFERENCES "ReferralPartnerRestaurantInvitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReferralPartnerRecruitmentReward"
ADD CONSTRAINT "ReferralPartnerRecruitmentReward_partnerId_fkey"
FOREIGN KEY ("partnerId") REFERENCES "ReferralPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReferralPartnerRecruitmentReward"
ADD CONSTRAINT "ReferralPartnerRecruitmentReward_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnerRecruitmentSubscriptionInvoice"
ADD CONSTRAINT "PartnerRecruitmentSubscriptionInvoice_rewardId_fkey"
FOREIGN KEY ("rewardId") REFERENCES "ReferralPartnerRecruitmentReward"("id") ON DELETE CASCADE ON UPDATE CASCADE;
