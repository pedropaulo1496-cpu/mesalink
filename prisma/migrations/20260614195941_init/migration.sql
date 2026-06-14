-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" TIMESTAMP(3),
    "restaurantLimit" INTEGER NOT NULL DEFAULT 1,
    "priceMonthly" INTEGER NOT NULL DEFAULT 0,
    "websiteAddon" BOOLEAN NOT NULL DEFAULT false,
    "stripeCustomerId" TEXT,
    "stripeProSubscriptionId" TEXT,
    "stripeWebsiteSubscriptionId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "websiteEnabled" BOOLEAN NOT NULL DEFAULT false,
    "websiteTemplate" TEXT NOT NULL DEFAULT 'PREMIUM',
    "websitePrimaryColor" TEXT DEFAULT '#111827',
    "websiteHeadline" TEXT,
    "websiteDescription" TEXT,
    "websiteCuisine" TEXT,
    "websiteInstagram" TEXT,
    "websiteHeroImage" TEXT,
    "websiteLogoImage" TEXT,
    "websiteAboutTitle" TEXT,
    "websiteAboutText" TEXT,
    "websiteFeatureTitle" TEXT,
    "websiteFeatureText" TEXT,
    "websiteSectionTitle" TEXT,
    "websiteSectionText" TEXT,
    "websiteGalleryTitle" TEXT,
    "websiteGalleryDescription" TEXT,
    "websiteLocationTitle" TEXT,
    "websiteLocationDescription" TEXT,
    "websiteFinalCtaTitle" TEXT,
    "websiteFinalCtaText" TEXT,
    "websiteGalleryImage1" TEXT,
    "websiteGalleryImage2" TEXT,
    "websiteGalleryImage3" TEXT,
    "websiteGalleryImage4" TEXT,
    "websiteGalleryTitle1" TEXT,
    "websiteGalleryTitle2" TEXT,
    "websiteGalleryTitle3" TEXT,
    "websiteGalleryTitle4" TEXT,
    "websiteMenuTitle" TEXT,
    "websiteMenuDescription" TEXT,
    "websiteMenuPdf" TEXT,
    "websiteSeoTitle" TEXT,
    "websiteSeoDescription" TEXT,
    "customDomain" TEXT,
    "customDomainVerified" BOOLEAN NOT NULL DEFAULT false,
    "plan" TEXT NOT NULL DEFAULT 'STARTER',
    "userId" TEXT,
    "reservationMode" TEXT NOT NULL DEFAULT 'TABLES',
    "totalCapacity" INTEGER,
    "manualApprovalGuests" INTEGER,
    "approvalOnTableMerge" BOOLEAN NOT NULL DEFAULT true,
    "onlineReservationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "mondayOpen" BOOLEAN NOT NULL DEFAULT false,
    "mondayLunch" TEXT,
    "mondayDinner" TEXT,
    "tuesdayOpen" BOOLEAN NOT NULL DEFAULT false,
    "tuesdayLunch" TEXT,
    "tuesdayDinner" TEXT,
    "wednesdayOpen" BOOLEAN NOT NULL DEFAULT false,
    "wednesdayLunch" TEXT,
    "wednesdayDinner" TEXT,
    "thursdayOpen" BOOLEAN NOT NULL DEFAULT false,
    "thursdayLunch" TEXT,
    "thursdayDinner" TEXT,
    "fridayOpen" BOOLEAN NOT NULL DEFAULT false,
    "fridayLunch" TEXT,
    "fridayDinner" TEXT,
    "saturdayOpen" BOOLEAN NOT NULL DEFAULT false,
    "saturdayLunch" TEXT,
    "saturdayDinner" TEXT,
    "sundayOpen" BOOLEAN NOT NULL DEFAULT false,
    "sundayLunch" TEXT,
    "sundayDinner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteMenu" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pdf" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "restaurantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "x" INTEGER NOT NULL DEFAULT 80,
    "y" INTEGER NOT NULL DEFAULT 80,
    "shape" TEXT NOT NULL DEFAULT 'square',
    "mergeGroupId" TEXT,
    "restaurantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "guests" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "approvalReason" TEXT,
    "restaurantId" TEXT,
    "tableId" TEXT,
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_slug_key" ON "Restaurant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteMenu" ADD CONSTRAINT "WebsiteMenu_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
