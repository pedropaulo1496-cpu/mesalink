ALTER TABLE "Restaurant"
ADD COLUMN "referralProfileCuisine" TEXT,
ADD COLUMN "referralProfileDescription" TEXT,
ADD COLUMN "referralProfileHeroImage" TEXT,
ADD COLUMN "referralProfileGallery" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "referralProfileHighlights" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "referralProfileMenuUrl" TEXT;

ALTER TABLE "ReferralGroup"
ADD COLUMN "adults" INTEGER,
ADD COLUMN "children" INTEGER NOT NULL DEFAULT 0;

UPDATE "ReferralGroup"
SET "adults" = "guests"
WHERE "adults" IS NULL;
