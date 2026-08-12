ALTER TABLE "MarketingPromoCard"
ADD COLUMN "reservationId" TEXT;

CREATE UNIQUE INDEX "MarketingPromoCard_reservationId_key"
ON "MarketingPromoCard"("reservationId");

CREATE INDEX "MarketingPromoCard_reservationId_idx"
ON "MarketingPromoCard"("reservationId");

ALTER TABLE "MarketingPromoCard"
ADD CONSTRAINT "MarketingPromoCard_reservationId_fkey"
FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
