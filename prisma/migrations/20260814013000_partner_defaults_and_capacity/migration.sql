ALTER TABLE "Restaurant"
ALTER COLUMN "referralDefaultCommissionAmount" SET DEFAULT 1.5;

UPDATE "Restaurant"
SET
  "referralDefaultCommissionType" = 'PER_PERSON',
  "referralDefaultCommissionAmount" = 1.5
WHERE
  "referralAutoAcceptEnabled" = false
  AND "referralDefaultCommissionAmount" = 5;

UPDATE "Restaurant" AS restaurant
SET "referralDefaultDailyCapacity" = CASE
  WHEN restaurant."reservationMode" = 'CAPACITY' AND COALESCE(restaurant."totalCapacity", 0) > 0
    THEN restaurant."totalCapacity"
  ELSE COALESCE((
    SELECT SUM(table_row."capacity")
    FROM "Table" AS table_row
    WHERE table_row."restaurantId" = restaurant."id"
  ), 0)
END
WHERE restaurant."referralDefaultDailyCapacity" = 0;
