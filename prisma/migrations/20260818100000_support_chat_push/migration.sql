CREATE TABLE "SupportConversation" (
    "id" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "salesRepresentativeId" TEXT,
    "restaurantId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastClientMessageAt" TIMESTAMP(3),
    "lastStaffMessageAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "clientReadAt" TIMESTAMP(3),
    "staffReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupportConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HqPushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HqPushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupportConversation_clientUserId_key" ON "SupportConversation"("clientUserId");
CREATE INDEX "SupportConversation_salesRepresentativeId_lastMessageAt_idx" ON "SupportConversation"("salesRepresentativeId", "lastMessageAt");
CREATE INDEX "SupportConversation_escalatedAt_lastMessageAt_idx" ON "SupportConversation"("escalatedAt", "lastMessageAt");
CREATE INDEX "SupportMessage_conversationId_createdAt_idx" ON "SupportMessage"("conversationId", "createdAt");
CREATE INDEX "SupportMessage_conversationId_readAt_idx" ON "SupportMessage"("conversationId", "readAt");
CREATE UNIQUE INDEX "HqPushSubscription_endpoint_key" ON "HqPushSubscription"("endpoint");
CREATE INDEX "HqPushSubscription_userId_idx" ON "HqPushSubscription"("userId");

ALTER TABLE "SupportConversation" ADD CONSTRAINT "SupportConversation_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportConversation" ADD CONSTRAINT "SupportConversation_salesRepresentativeId_fkey" FOREIGN KEY ("salesRepresentativeId") REFERENCES "SalesRepresentative"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "SupportConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HqPushSubscription" ADD CONSTRAINT "HqPushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
