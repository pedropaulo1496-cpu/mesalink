CREATE TABLE "ReservationIssueAlert" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "emailDeliveryId" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationIssueAlert_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReservationIssueAlert_restaurantId_visitorHash_dayKey_key"
ON "ReservationIssueAlert"("restaurantId", "visitorHash", "dayKey");

CREATE INDEX "ReservationIssueAlert_restaurantId_createdAt_idx"
ON "ReservationIssueAlert"("restaurantId", "createdAt");

CREATE INDEX "ReservationIssueAlert_status_createdAt_idx"
ON "ReservationIssueAlert"("status", "createdAt");

ALTER TABLE "ReservationIssueAlert"
ADD CONSTRAINT "ReservationIssueAlert_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
