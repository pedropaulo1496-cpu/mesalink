ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User"
SET "isAdmin" = true
WHERE "email" = 'pedropaulo1496@gmail.com';

UPDATE "Subscription" SET "restaurantLimit" = 1 WHERE "restaurantLimit" <> 1;

CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "targetUserId" TEXT,
  "action" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminSettings" (
  "id" TEXT NOT NULL DEFAULT 'global',
  "emailCostMicros" INTEGER NOT NULL DEFAULT 400,
  "aiCreditCostMicros" INTEGER NOT NULL DEFAULT 10000,
  "whatsappCostMicros" INTEGER NOT NULL DEFAULT 5000,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminSettings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminAuditLog_actorId_createdAt_idx" ON "AdminAuditLog"("actorId", "createdAt");
CREATE INDEX "AdminAuditLog_targetUserId_createdAt_idx" ON "AdminAuditLog"("targetUserId", "createdAt");
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");

ALTER TABLE "AdminAuditLog"
ADD CONSTRAINT "AdminAuditLog_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdminAuditLog"
ADD CONSTRAINT "AdminAuditLog_targetUserId_fkey"
FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "AdminSettings" ("id", "updatedAt")
VALUES ('global', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
