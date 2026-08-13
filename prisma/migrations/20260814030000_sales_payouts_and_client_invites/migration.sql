ALTER TABLE "SalesRepresentative"
ADD COLUMN "stripeAccountId" TEXT,
ADD COLUMN "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "SalesCommissionStatement"
ADD COLUMN "stripeTransferId" TEXT;

CREATE UNIQUE INDEX "SalesRepresentative_stripeAccountId_key" ON "SalesRepresentative"("stripeAccountId");
CREATE UNIQUE INDEX "SalesCommissionStatement_stripeTransferId_key" ON "SalesCommissionStatement"("stripeTransferId");

CREATE TABLE "SalesClientInvitation" (
    "id" TEXT NOT NULL,
    "salesRepresentativeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesClientInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SalesClientInvitation_token_key" ON "SalesClientInvitation"("token");
CREATE INDEX "SalesClientInvitation_salesRepresentativeId_createdAt_idx" ON "SalesClientInvitation"("salesRepresentativeId", "createdAt");
CREATE INDEX "SalesClientInvitation_email_expiresAt_idx" ON "SalesClientInvitation"("email", "expiresAt");

ALTER TABLE "SalesClientInvitation"
ADD CONSTRAINT "SalesClientInvitation_salesRepresentativeId_fkey"
FOREIGN KEY ("salesRepresentativeId") REFERENCES "SalesRepresentative"("id") ON DELETE CASCADE ON UPDATE CASCADE;
