-- Reinforce payments and add operational Revenue AI / measured AI Visibility.

ALTER TABLE "Subscription"
    ADD COLUMN "aiCredits" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "MarketingAction"
    ADD COLUMN "actualRevenue" DECIMAL(10,2),
    ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    ADD COLUMN "deliveryId" TEXT,
    ADD COLUMN "failureReason" TEXT,
    ADD COLUMN "repliedAt" TIMESTAMP(3),
    ADD COLUMN "nextFollowUpAt" TIMESTAMP(3),
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ReferralPayment"
    ADD COLUMN "stripeChargeId" TEXT,
    ADD COLUMN "serviceFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN "checkoutAttempt" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "refundedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN "reversedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN "lastError" TEXT,
    ADD COLUMN "failedAt" TIMESTAMP(3),
    ADD COLUMN "refundedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "ReferralPayment_stripeChargeId_key" ON "ReferralPayment"("stripeChargeId");

CREATE TABLE "AiCreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "feature" TEXT,
    "description" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "refundedCents" INTEGER NOT NULL DEFAULT 0,
    "revokedCredits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiCreditTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiCreditTransaction_reference_key" ON "AiCreditTransaction"("reference");
CREATE UNIQUE INDEX "AiCreditTransaction_stripeCheckoutSessionId_key" ON "AiCreditTransaction"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "AiCreditTransaction_stripePaymentIntentId_key" ON "AiCreditTransaction"("stripePaymentIntentId");
CREATE UNIQUE INDEX "AiCreditTransaction_stripeChargeId_key" ON "AiCreditTransaction"("stripeChargeId");
CREATE INDEX "AiCreditTransaction_userId_createdAt_idx" ON "AiCreditTransaction"("userId", "createdAt");
ALTER TABLE "AiCreditTransaction" ADD CONSTRAINT "AiCreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "RevenueConversation" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "customerId" TEXT,
    "reservationId" TEXT,
    "sourceId" TEXT NOT NULL,
    "opportunityType" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "lastMessagePreview" TEXT,
    "aiSummary" TEXT,
    "handoffReason" TEXT,
    "nextFollowUpAt" TIMESTAMP(3),
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimatedRevenue" DECIMAL(10,2),
    "recoveredRevenue" DECIMAL(10,2),
    "recoveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RevenueConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RevenueMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "externalId" TEXT,
    "failureReason" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RevenueMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RevenueConversation_restaurantId_opportunityType_sourceId_key" ON "RevenueConversation"("restaurantId", "opportunityType", "sourceId");
CREATE INDEX "RevenueConversation_restaurantId_status_lastMessageAt_idx" ON "RevenueConversation"("restaurantId", "status", "lastMessageAt");
CREATE INDEX "RevenueConversation_restaurantId_nextFollowUpAt_idx" ON "RevenueConversation"("restaurantId", "nextFollowUpAt");
CREATE INDEX "RevenueMessage_conversationId_createdAt_idx" ON "RevenueMessage"("conversationId", "createdAt");
CREATE INDEX "RevenueMessage_status_sentAt_idx" ON "RevenueMessage"("status", "sentAt");

CREATE TABLE "AiVisibilityScan" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "provider" TEXT NOT NULL DEFAULT 'OPENAI_WEB_SEARCH',
    "overallScore" INTEGER,
    "readinessScore" INTEGER,
    "visibilityScore" INTEGER,
    "mentionRate" INTEGER,
    "sourceCount" INTEGER,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiVisibilityScan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiVisibilityPromptResult" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "engine" TEXT NOT NULL DEFAULT 'OPENAI_WEB_SEARCH',
    "mentioned" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER,
    "answerSummary" TEXT,
    "competitors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiVisibilityPromptResult_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiVisibilityScan_restaurantId_createdAt_idx" ON "AiVisibilityScan"("restaurantId", "createdAt");
CREATE INDEX "AiVisibilityScan_restaurantId_status_idx" ON "AiVisibilityScan"("restaurantId", "status");
CREATE INDEX "AiVisibilityPromptResult_scanId_idx" ON "AiVisibilityPromptResult"("scanId");
CREATE INDEX "AiVisibilityPromptResult_mentioned_createdAt_idx" ON "AiVisibilityPromptResult"("mentioned", "createdAt");

ALTER TABLE "RevenueConversation" ADD CONSTRAINT "RevenueConversation_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RevenueConversation" ADD CONSTRAINT "RevenueConversation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RevenueConversation" ADD CONSTRAINT "RevenueConversation_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RevenueMessage" ADD CONSTRAINT "RevenueMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "RevenueConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiVisibilityScan" ADD CONSTRAINT "AiVisibilityScan_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiVisibilityPromptResult" ADD CONSTRAINT "AiVisibilityPromptResult_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "AiVisibilityScan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
