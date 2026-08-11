-- MesaLink Partner Network: parceiros B2B, grupos anónimos, acordos e pagamentos.

ALTER TABLE "Restaurant"
    ADD COLUMN "referralNetworkEnabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "referralDefaultCommissionType" TEXT NOT NULL DEFAULT 'PER_PERSON',
    ADD COLUMN "referralDefaultCommissionAmount" DECIMAL(10,2) NOT NULL DEFAULT 5;

CREATE TABLE "ReferralPartner" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "partnerType" TEXT NOT NULL DEFAULT 'HOTEL',
    "contactName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "stripeAccountId" TEXT,
    "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedAt" TIMESTAMP(3),
    "privacyAcceptedAt" TIMESTAMP(3),
    "termsVersion" TEXT,
    "defaultCommissionType" TEXT NOT NULL DEFAULT 'PER_PERSON',
    "defaultCommissionAmount" DECIMAL(10,2) NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralPartner_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReferralAgreement" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "commissionType" TEXT NOT NULL DEFAULT 'PER_PERSON',
    "commissionAmount" DECIMAL(10,2) NOT NULL,
    "platformFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 15,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralAgreement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReferralGroup" (
    "id" TEXT NOT NULL,
    "publicCode" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "acceptedRestaurantId" TEXT,
    "reservationId" TEXT,
    "desiredDate" TIMESTAMP(3) NOT NULL,
    "alternativeDate" TIMESTAMP(3),
    "guests" INTEGER NOT NULL,
    "cuisineTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "city" TEXT,
    "area" TEXT,
    "budgetPerPerson" DECIMAL(10,2),
    "notes" TEXT,
    "commissionType" TEXT NOT NULL DEFAULT 'PER_PERSON',
    "commissionAmount" DECIMAL(10,2) NOT NULL,
    "platformFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 15,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReferralOffer" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "commissionType" TEXT NOT NULL DEFAULT 'PER_PERSON',
    "commissionAmount" DECIMAL(10,2) NOT NULL,
    "platformFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 15,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralOffer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReferralPayment" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "grossCommission" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL,
    "partnerNet" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeTransferId" TEXT,
    "paidAt" TIMESTAMP(3),
    "transferredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReferralBenefit" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "benefitType" TEXT NOT NULL DEFAULT 'PERCENT',
    "value" DECIMAL(10,2),
    "minSpend" DECIMAL(10,2),
    "terms" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "maxRedemptions" INTEGER,
    "redemptions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralBenefit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReferralBenefitCard" (
    "id" TEXT NOT NULL,
    "publicCode" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "guestCount" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralBenefitCard_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReferralPartner_userId_key" ON "ReferralPartner"("userId");
CREATE UNIQUE INDEX "ReferralPartner_email_key" ON "ReferralPartner"("email");
CREATE UNIQUE INDEX "ReferralPartner_stripeAccountId_key" ON "ReferralPartner"("stripeAccountId");
CREATE INDEX "ReferralPartner_status_idx" ON "ReferralPartner"("status");
CREATE INDEX "ReferralPartner_partnerType_city_idx" ON "ReferralPartner"("partnerType", "city");

CREATE UNIQUE INDEX "ReferralAgreement_partnerId_restaurantId_key" ON "ReferralAgreement"("partnerId", "restaurantId");
CREATE INDEX "ReferralAgreement_restaurantId_active_idx" ON "ReferralAgreement"("restaurantId", "active");

CREATE UNIQUE INDEX "ReferralGroup_publicCode_key" ON "ReferralGroup"("publicCode");
CREATE UNIQUE INDEX "ReferralGroup_reservationId_key" ON "ReferralGroup"("reservationId");
CREATE INDEX "ReferralGroup_partnerId_status_idx" ON "ReferralGroup"("partnerId", "status");
CREATE INDEX "ReferralGroup_acceptedRestaurantId_status_idx" ON "ReferralGroup"("acceptedRestaurantId", "status");
CREATE INDEX "ReferralGroup_desiredDate_status_idx" ON "ReferralGroup"("desiredDate", "status");

CREATE UNIQUE INDEX "ReferralOffer_groupId_restaurantId_key" ON "ReferralOffer"("groupId", "restaurantId");
CREATE INDEX "ReferralOffer_restaurantId_status_idx" ON "ReferralOffer"("restaurantId", "status");

CREATE UNIQUE INDEX "ReferralPayment_groupId_key" ON "ReferralPayment"("groupId");
CREATE UNIQUE INDEX "ReferralPayment_stripeCheckoutSessionId_key" ON "ReferralPayment"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "ReferralPayment_stripePaymentIntentId_key" ON "ReferralPayment"("stripePaymentIntentId");
CREATE UNIQUE INDEX "ReferralPayment_stripeTransferId_key" ON "ReferralPayment"("stripeTransferId");
CREATE INDEX "ReferralPayment_partnerId_status_idx" ON "ReferralPayment"("partnerId", "status");

CREATE INDEX "ReferralBenefit_restaurantId_active_idx" ON "ReferralBenefit"("restaurantId", "active");
CREATE INDEX "ReferralBenefit_validFrom_validUntil_idx" ON "ReferralBenefit"("validFrom", "validUntil");

CREATE UNIQUE INDEX "ReferralBenefitCard_publicCode_key" ON "ReferralBenefitCard"("publicCode");
CREATE INDEX "ReferralBenefitCard_partnerId_status_idx" ON "ReferralBenefitCard"("partnerId", "status");
CREATE INDEX "ReferralBenefitCard_benefitId_status_idx" ON "ReferralBenefitCard"("benefitId", "status");
CREATE INDEX "ReferralBenefitCard_expiresAt_status_idx" ON "ReferralBenefitCard"("expiresAt", "status");

ALTER TABLE "ReferralPartner" ADD CONSTRAINT "ReferralPartner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralAgreement" ADD CONSTRAINT "ReferralAgreement_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "ReferralPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralAgreement" ADD CONSTRAINT "ReferralAgreement_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralGroup" ADD CONSTRAINT "ReferralGroup_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "ReferralPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralGroup" ADD CONSTRAINT "ReferralGroup_acceptedRestaurantId_fkey" FOREIGN KEY ("acceptedRestaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReferralGroup" ADD CONSTRAINT "ReferralGroup_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReferralOffer" ADD CONSTRAINT "ReferralOffer_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ReferralGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralOffer" ADD CONSTRAINT "ReferralOffer_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralPayment" ADD CONSTRAINT "ReferralPayment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ReferralGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralPayment" ADD CONSTRAINT "ReferralPayment_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "ReferralPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReferralBenefit" ADD CONSTRAINT "ReferralBenefit_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralBenefitCard" ADD CONSTRAINT "ReferralBenefitCard_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "ReferralBenefit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralBenefitCard" ADD CONSTRAINT "ReferralBenefitCard_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "ReferralPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
