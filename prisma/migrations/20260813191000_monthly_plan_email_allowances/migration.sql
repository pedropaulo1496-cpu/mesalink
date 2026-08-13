-- Plan email allowances renew monthly and never accumulate.
ALTER TABLE "Subscription"
ALTER COLUMN "emailBalance" SET DEFAULT 750,
ADD COLUMN "emailAllowanceAnchorAt" TIMESTAMP(3),
ADD COLUMN "emailAllowanceResetAt" TIMESTAMP(3);

UPDATE "Subscription"
SET
  "emailBalance" = CASE
    WHEN UPPER("plan") = 'GROWTH' THEN 1000
    ELSE 750
  END,
  "emailsSent" = 0,
  "emailAllowanceAnchorAt" = CURRENT_TIMESTAMP,
  "emailAllowanceResetAt" = CURRENT_TIMESTAMP + INTERVAL '1 month'
WHERE "status" IN ('ACTIVE', 'TRIAL');
