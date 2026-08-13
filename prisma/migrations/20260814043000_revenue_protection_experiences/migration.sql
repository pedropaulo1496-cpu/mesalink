ALTER TABLE "Restaurant"
ADD COLUMN "revenueSummaryEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "paymentsStripeAccountId" TEXT,
ADD COLUMN "paymentsStripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "noShowProtectionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "noShowMinGuests" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN "noShowDepositPerPerson" DECIMAL(10,2) NOT NULL DEFAULT 10,
ADD COLUMN "noShowFridayEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "noShowSaturdayEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "noShowSpecialDates" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "noShowCancellationHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN "noShowCreditOnLateCancellation" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX "Restaurant_paymentsStripeAccountId_key" ON "Restaurant"("paymentsStripeAccountId");

ALTER TABLE "Reservation"
ADD COLUMN "experienceId" TEXT,
ADD COLUMN "estimatedRevenue" DECIMAL(10,2);

CREATE TABLE "DiningExperience" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 120,
    "salesCloseAt" TIMESTAMP(3),
    "pricePerPerson" DECIMAL(10,2) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "cancellationHours" INTEGER NOT NULL DEFAULT 48,
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DiningExperience_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiningExperienceAddOn" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "perGuest" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DiningExperienceAddOn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReservationExperienceAddOn" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "addOnId" TEXT NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "ReservationExperienceAddOn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReservationPayment" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "confirmationStatus" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "marketingTrackingToken" TEXT,
    "offerCode" TEXT,
    "baseAmount" DECIMAL(10,2) NOT NULL,
    "addOnsAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "serviceFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "applicationFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "refundedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "stripeRefundId" TEXT,
    "lastError" TEXT,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReservationPayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DiningExperience_restaurantId_active_startsAt_idx" ON "DiningExperience"("restaurantId", "active", "startsAt");
CREATE INDEX "DiningExperienceAddOn_experienceId_active_idx" ON "DiningExperienceAddOn"("experienceId", "active");
CREATE UNIQUE INDEX "ReservationExperienceAddOn_reservationId_addOnId_key" ON "ReservationExperienceAddOn"("reservationId", "addOnId");
CREATE INDEX "ReservationExperienceAddOn_reservationId_idx" ON "ReservationExperienceAddOn"("reservationId");
CREATE UNIQUE INDEX "ReservationPayment_reservationId_key" ON "ReservationPayment"("reservationId");
CREATE UNIQUE INDEX "ReservationPayment_stripeCheckoutSessionId_key" ON "ReservationPayment"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "ReservationPayment_stripePaymentIntentId_key" ON "ReservationPayment"("stripePaymentIntentId");
CREATE UNIQUE INDEX "ReservationPayment_stripeChargeId_key" ON "ReservationPayment"("stripeChargeId");
CREATE UNIQUE INDEX "ReservationPayment_stripeRefundId_key" ON "ReservationPayment"("stripeRefundId");
CREATE INDEX "ReservationPayment_restaurantId_status_paidAt_idx" ON "ReservationPayment"("restaurantId", "status", "paidAt");
CREATE INDEX "ReservationPayment_kind_status_idx" ON "ReservationPayment"("kind", "status");
CREATE INDEX "Reservation_experienceId_idx" ON "Reservation"("experienceId");

ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "DiningExperience"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DiningExperience" ADD CONSTRAINT "DiningExperience_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiningExperienceAddOn" ADD CONSTRAINT "DiningExperienceAddOn_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "DiningExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReservationExperienceAddOn" ADD CONSTRAINT "ReservationExperienceAddOn_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReservationExperienceAddOn" ADD CONSTRAINT "ReservationExperienceAddOn_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "DiningExperienceAddOn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReservationPayment" ADD CONSTRAINT "ReservationPayment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReservationPayment" ADD CONSTRAINT "ReservationPayment_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
