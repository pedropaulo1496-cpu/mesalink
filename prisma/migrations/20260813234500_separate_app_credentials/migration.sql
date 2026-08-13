-- MesaLink Restaurant, Partners and HQ keep independent credentials.
ALTER TABLE "User"
  ADD COLUMN "staffPasswordHash" TEXT,
  ADD COLUMN "staffLastLoginAt" TIMESTAMP(3),
  ADD COLUMN "staffLastActiveAt" TIMESTAMP(3);

ALTER TABLE "ReferralPartner"
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN "lastActiveAt" TIMESTAMP(3);

ALTER TABLE "PasswordResetToken"
  ADD COLUMN "purpose" TEXT NOT NULL DEFAULT 'RESTAURANT';

-- Existing Partner accounts retain their current login while gaining an
-- independent credential that can be changed without affecting Restaurant.
UPDATE "ReferralPartner" AS partner
SET "passwordHash" = account."passwordHash"
FROM "User" AS account
WHERE partner."userId" = account."id"
  AND partner."passwordHash" IS NULL;

-- Preserve access for the existing HQ team once, then keep the HQ password
-- independent from the Restaurant password from this migration onward.
UPDATE "User" AS account
SET "staffPasswordHash" = account."passwordHash"
WHERE account."staffPasswordHash" IS NULL
  AND account."passwordHash" IS NOT NULL
  AND (
    account."isAdmin" = TRUE
    OR EXISTS (
      SELECT 1 FROM "SalesRepresentative" AS representative
      WHERE representative."userId" = account."id"
    )
  );
