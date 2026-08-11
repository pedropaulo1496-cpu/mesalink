ALTER TABLE "Restaurant"
ADD COLUMN "revenueWhatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "revenueWhatsappNumber" TEXT,
ADD COLUMN "revenueWhatsappContentSid" TEXT,
ADD COLUMN "revenueWhatsappAutoReply" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "revenueVoiceEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "revenueVoiceNumber" TEXT,
ADD COLUMN "revenueVoiceForwardNumber" TEXT,
ADD COLUMN "revenueMissedCallAutoReply" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "revenueChannelsConfiguredAt" TIMESTAMP(3),
ADD COLUMN "revenueChannelsLastError" TEXT;

ALTER TABLE "RevenueMessage"
ADD COLUMN "deliveredAt" TIMESTAMP(3),
ADD COLUMN "readAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Restaurant_revenueWhatsappNumber_key" ON "Restaurant"("revenueWhatsappNumber");
CREATE UNIQUE INDEX "Restaurant_revenueVoiceNumber_key" ON "Restaurant"("revenueVoiceNumber");
CREATE UNIQUE INDEX "RevenueMessage_externalId_key" ON "RevenueMessage"("externalId");
