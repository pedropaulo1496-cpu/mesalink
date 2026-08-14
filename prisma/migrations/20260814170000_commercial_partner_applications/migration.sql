CREATE TABLE "CommercialPartnerApplication" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "markets" TEXT[],
    "languages" TEXT[],
    "linkedinUrl" TEXT,
    "cvUrl" TEXT,
    "salesYears" INTEGER NOT NULL DEFAULT 0,
    "hospitalityYears" INTEGER NOT NULL DEFAULT 0,
    "hasSaasExperience" BOOLEAN NOT NULL DEFAULT false,
    "hasCommissionExperience" BOOLEAN NOT NULL DEFAULT false,
    "networkSize" TEXT NOT NULL,
    "weeklyAvailability" TEXT NOT NULL,
    "motivation" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "scoreBreakdown" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "adminNote" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MESALINK_SITE',
    "consentAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialPartnerApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommercialPartnerApplication_email_key" ON "CommercialPartnerApplication"("email");
CREATE INDEX "CommercialPartnerApplication_status_score_idx" ON "CommercialPartnerApplication"("status", "score");
CREATE INDEX "CommercialPartnerApplication_country_createdAt_idx" ON "CommercialPartnerApplication"("country", "createdAt");
CREATE INDEX "CommercialPartnerApplication_createdAt_idx" ON "CommercialPartnerApplication"("createdAt");
