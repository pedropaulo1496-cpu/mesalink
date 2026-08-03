-- Limpa reservas duplicadas já existentes (mesmo restaurante + mesmo cliente + mesma
-- data/hora exata) ANTES de aplicar o índice único da migração seguinte, para que
-- essa migração não falhe por causa de duplicados que já estão na base de dados.
--
-- Critério de sobrevivente por grupo duplicado:
--   1) reservas ativas (não CANCELLED/REJECTED) vencem as canceladas/rejeitadas;
--   2) em empate, a mais recente (createdAt) vence.
--
-- Antes de apagar as linhas perdedoras, qualquer POSTableSession que apontasse
-- para uma reserva perdedora é reapontada para a sobrevivente, para não violar
-- a foreign key POSTableSession.reservationId -> Reservation.id.

WITH ranked AS (
  SELECT
    "id",
    "restaurantId",
    "customerId",
    "date",
    ROW_NUMBER() OVER (
      PARTITION BY "restaurantId", "customerId", "date"
      ORDER BY
        CASE WHEN "status" NOT IN ('CANCELLED', 'REJECTED') THEN 0 ELSE 1 END,
        "createdAt" DESC
    ) AS rn
  FROM "Reservation"
  WHERE "customerId" IS NOT NULL
),
survivors AS (
  SELECT loser."id" AS loser_id, winner."id" AS survivor_id
  FROM ranked loser
  JOIN ranked winner
    ON winner."restaurantId" = loser."restaurantId"
   AND winner."customerId" = loser."customerId"
   AND winner."date" = loser."date"
   AND winner.rn = 1
  WHERE loser.rn > 1
)
UPDATE "POSTableSession" pts
SET "reservationId" = s.survivor_id
FROM survivors s
WHERE pts."reservationId" = s.loser_id;

WITH ranked AS (
  SELECT
    "id",
    "restaurantId",
    "customerId",
    "date",
    ROW_NUMBER() OVER (
      PARTITION BY "restaurantId", "customerId", "date"
      ORDER BY
        CASE WHEN "status" NOT IN ('CANCELLED', 'REJECTED') THEN 0 ELSE 1 END,
        "createdAt" DESC
    ) AS rn
  FROM "Reservation"
  WHERE "customerId" IS NOT NULL
)
DELETE FROM "Reservation"
WHERE "id" IN (SELECT "id" FROM ranked WHERE rn > 1);
