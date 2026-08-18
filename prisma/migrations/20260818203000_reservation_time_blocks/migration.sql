CREATE TABLE "ReservationTimeBlock" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationTimeBlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReservationTimeBlock_restaurantId_day_time_key"
ON "ReservationTimeBlock"("restaurantId", "day", "time");

CREATE INDEX "ReservationTimeBlock_restaurantId_day_idx"
ON "ReservationTimeBlock"("restaurantId", "day");

ALTER TABLE "ReservationTimeBlock"
ADD CONSTRAINT "ReservationTimeBlock_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
