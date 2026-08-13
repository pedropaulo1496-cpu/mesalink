ALTER TABLE "ReferralCommissionRequest"
ADD COLUMN "initiator" TEXT NOT NULL DEFAULT 'PARTNER';

CREATE INDEX "ReferralCommissionRequest_partnerId_initiator_status_idx"
ON "ReferralCommissionRequest"("partnerId", "initiator", "status");
