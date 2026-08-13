-- Monthly commercial balances require an approved invoice before payment.
CREATE TABLE "SalesCommissionStatement" (
    "id" TEXT NOT NULL,
    "salesRepresentativeId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "grossSales" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commissionTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'MISSING',
    "invoiceUrl" TEXT,
    "invoiceNumber" TEXT,
    "invoiceUploadedAt" TIMESTAMP(3),
    "invoiceVerifiedAt" TIMESTAMP(3),
    "invoiceVerifiedBy" TEXT,
    "invoiceRejectedAt" TIMESTAMP(3),
    "invoiceRejectionReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesCommissionStatement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SalesCommissionStatement_salesRepresentativeId_period_key" ON "SalesCommissionStatement"("salesRepresentativeId", "period");
CREATE INDEX "SalesCommissionStatement_status_period_idx" ON "SalesCommissionStatement"("status", "period");
ALTER TABLE "SalesCommissionStatement" ADD CONSTRAINT "SalesCommissionStatement_salesRepresentativeId_fkey" FOREIGN KEY ("salesRepresentativeId") REFERENCES "SalesRepresentative"("id") ON DELETE CASCADE ON UPDATE CASCADE;
