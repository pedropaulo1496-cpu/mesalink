-- Custom-domain checkout, provisioning and DNS verification state.
CREATE TABLE "DomainOrder" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUOTED',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "providerCurrency" TEXT NOT NULL DEFAULT 'USD',
    "providerPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "renewalPrice" DECIMAL(12,2),
    "exchangeRate" DECIMAL(12,6) NOT NULL DEFAULT 1,
    "providerPriceCents" INTEGER NOT NULL DEFAULT 0,
    "servicePercentBps" INTEGER NOT NULL DEFAULT 500,
    "servicePercentCents" INTEGER NOT NULL DEFAULT 0,
    "serviceFixedCents" INTEGER NOT NULL DEFAULT 100,
    "stripeFeeBps" INTEGER NOT NULL DEFAULT 150,
    "stripeFeeFixedCents" INTEGER NOT NULL DEFAULT 25,
    "stripeFeeCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "quoteExpiresAt" TIMESTAMP(3) NOT NULL,
    "registrant" JSONB,
    "dnsRecords" JSONB,
    "verification" JSONB,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "stripeRefundId" TEXT,
    "providerOrderId" TEXT,
    "failureReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "purchasedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DomainOrder_stripeCheckoutSessionId_key" ON "DomainOrder"("stripeCheckoutSessionId");
CREATE INDEX "DomainOrder_restaurantId_createdAt_idx" ON "DomainOrder"("restaurantId", "createdAt");
CREATE INDEX "DomainOrder_domain_status_idx" ON "DomainOrder"("domain", "status");
CREATE INDEX "DomainOrder_status_updatedAt_idx" ON "DomainOrder"("status", "updatedAt");
CREATE INDEX "Restaurant_customDomain_idx" ON "Restaurant"("customDomain");

ALTER TABLE "DomainOrder" ADD CONSTRAINT "DomainOrder_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
