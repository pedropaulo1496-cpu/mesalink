ALTER TABLE "SupportConversation"
  ALTER COLUMN "clientUserId" DROP NOT NULL,
  ADD COLUMN "partnerId" TEXT;

CREATE UNIQUE INDEX "SupportConversation_partnerId_key" ON "SupportConversation"("partnerId");

ALTER TABLE "SupportConversation"
  ADD CONSTRAINT "SupportConversation_partnerId_fkey"
  FOREIGN KEY ("partnerId") REFERENCES "ReferralPartner"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
