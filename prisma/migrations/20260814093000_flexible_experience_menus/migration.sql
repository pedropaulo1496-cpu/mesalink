ALTER TABLE "DiningExperience"
ADD COLUMN "scheduleType" TEXT NOT NULL DEFAULT 'FLEXIBLE',
ADD COLUMN "paymentMode" TEXT NOT NULL DEFAULT 'AT_RESTAURANT',
ADD COLUMN "details" TEXT,
ADD COLUMN "servicePeriods" TEXT[] NOT NULL DEFAULT ARRAY['LUNCH', 'DINNER']::TEXT[];

-- Experiences created before this change were sold as fixed, prepaid events.
-- Keep their original behaviour while making new menus flexible by default.
UPDATE "DiningExperience"
SET "scheduleType" = 'FIXED', "paymentMode" = 'PREPAID';

ALTER TABLE "DiningExperience"
ALTER COLUMN "startsAt" DROP NOT NULL;
