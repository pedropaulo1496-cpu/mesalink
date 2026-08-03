-- Índices em falta nas foreign keys/colunas mais filtradas do produto (reservas,
-- mesas, pedidos, POS, marketing). Nenhuma delas tinha índice além da primary key,
-- por isso praticamente todas as queries do dashboard/calendário/POS faziam table
-- scan completo.
--
-- Nota: esta base de dados corre atrás do connection pooler do Supabase, que não
-- aceita CREATE INDEX CONCURRENTLY dentro do batch de statements enviado pelo
-- Prisma (falha com "cannot run inside a transaction block"). Como as tabelas
-- ainda são pequenas nesta fase do produto, usa-se CREATE INDEX normal — o lock
-- de escrita durante a criação é da ordem dos milissegundos a esta escala.

-- Reservation: chave única "reserva igual" (mesmo restaurante+cliente+data/hora)
-- + índices para os filtros mais comuns (calendário, listagem, disponibilidade).
CREATE UNIQUE INDEX IF NOT EXISTS "Reservation_dedupe_key"
  ON "Reservation"("restaurantId", "customerId", "date");

ALTER TABLE "Reservation"
  ADD CONSTRAINT "Reservation_dedupe_key" UNIQUE USING INDEX "Reservation_dedupe_key";

CREATE INDEX IF NOT EXISTS "Reservation_restaurantId_idx" ON "Reservation"("restaurantId");
CREATE INDEX IF NOT EXISTS "Reservation_restaurantId_date_idx" ON "Reservation"("restaurantId", "date");
CREATE INDEX IF NOT EXISTS "Reservation_restaurantId_status_idx" ON "Reservation"("restaurantId", "status");
CREATE INDEX IF NOT EXISTS "Reservation_tableId_idx" ON "Reservation"("tableId");
CREATE INDEX IF NOT EXISTS "Reservation_customerId_idx" ON "Reservation"("customerId");

-- Restaurant
CREATE INDEX IF NOT EXISTS "Restaurant_userId_idx" ON "Restaurant"("userId");

-- WebsiteMenu
CREATE INDEX IF NOT EXISTS "WebsiteMenu_restaurantId_idx" ON "WebsiteMenu"("restaurantId");
CREATE INDEX IF NOT EXISTS "WebsiteMenu_roomId_idx" ON "WebsiteMenu"("roomId");

-- FloorRoom
CREATE INDEX IF NOT EXISTS "FloorRoom_restaurantId_idx" ON "FloorRoom"("restaurantId");

-- Table
CREATE INDEX IF NOT EXISTS "Table_restaurantId_idx" ON "Table"("restaurantId");
CREATE INDEX IF NOT EXISTS "Table_roomId_idx" ON "Table"("roomId");

-- OrderingCategory / OrderingProduct
CREATE INDEX IF NOT EXISTS "OrderingCategory_restaurantId_idx" ON "OrderingCategory"("restaurantId");
CREATE INDEX IF NOT EXISTS "OrderingProduct_categoryId_idx" ON "OrderingProduct"("categoryId");

-- OrderingOrder / OrderingOrderItem / OrderingTableSession
CREATE INDEX IF NOT EXISTS "OrderingOrder_restaurantId_idx" ON "OrderingOrder"("restaurantId");
CREATE INDEX IF NOT EXISTS "OrderingOrder_restaurantId_status_idx" ON "OrderingOrder"("restaurantId", "status");
CREATE INDEX IF NOT EXISTS "OrderingOrder_sessionId_idx" ON "OrderingOrder"("sessionId");
CREATE INDEX IF NOT EXISTS "OrderingOrderItem_orderId_idx" ON "OrderingOrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "OrderingTableSession_restaurantId_idx" ON "OrderingTableSession"("restaurantId");
CREATE INDEX IF NOT EXISTS "OrderingTableSession_restaurantId_status_idx" ON "OrderingTableSession"("restaurantId", "status");

-- Marketing
CREATE INDEX IF NOT EXISTS "MarketingAutomation_restaurantId_idx" ON "MarketingAutomation"("restaurantId");
CREATE INDEX IF NOT EXISTS "ReviewFeedback_restaurantId_idx" ON "ReviewFeedback"("restaurantId");
CREATE INDEX IF NOT EXISTS "ReviewFeedback_customerId_idx" ON "ReviewFeedback"("customerId");
CREATE INDEX IF NOT EXISTS "ReviewFeedback_reservationId_idx" ON "ReviewFeedback"("reservationId");
CREATE INDEX IF NOT EXISTS "MarketingAction_restaurantId_idx" ON "MarketingAction"("restaurantId");
CREATE INDEX IF NOT EXISTS "MarketingAction_customerId_idx" ON "MarketingAction"("customerId");
CREATE INDEX IF NOT EXISTS "MarketingAction_restaurantId_status_type_idx" ON "MarketingAction"("restaurantId", "status", "type");

-- POS
CREATE INDEX IF NOT EXISTS "POSTableSession_restaurantId_idx" ON "POSTableSession"("restaurantId");
CREATE INDEX IF NOT EXISTS "POSTableSession_restaurantId_status_idx" ON "POSTableSession"("restaurantId", "status");
CREATE INDEX IF NOT EXISTS "POSTableSession_tableId_idx" ON "POSTableSession"("tableId");
CREATE INDEX IF NOT EXISTS "POSTableSession_reservationId_idx" ON "POSTableSession"("reservationId");
CREATE INDEX IF NOT EXISTS "POSTableSession_customerId_idx" ON "POSTableSession"("customerId");

CREATE INDEX IF NOT EXISTS "POSOrder_restaurantId_idx" ON "POSOrder"("restaurantId");
CREATE INDEX IF NOT EXISTS "POSOrder_restaurantId_status_idx" ON "POSOrder"("restaurantId", "status");
CREATE INDEX IF NOT EXISTS "POSOrder_tableSessionId_idx" ON "POSOrder"("tableSessionId");

CREATE INDEX IF NOT EXISTS "POSOrderItem_orderId_idx" ON "POSOrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "POSOrderItem_productId_idx" ON "POSOrderItem"("productId");

CREATE INDEX IF NOT EXISTS "POSPayment_restaurantId_idx" ON "POSPayment"("restaurantId");
CREATE INDEX IF NOT EXISTS "POSPayment_tableSessionId_idx" ON "POSPayment"("tableSessionId");
CREATE INDEX IF NOT EXISTS "POSPayment_cashRegisterId_idx" ON "POSPayment"("cashRegisterId");

CREATE INDEX IF NOT EXISTS "POSCashRegister_restaurantId_idx" ON "POSCashRegister"("restaurantId");
CREATE INDEX IF NOT EXISTS "POSCashRegister_restaurantId_status_idx" ON "POSCashRegister"("restaurantId", "status");

CREATE INDEX IF NOT EXISTS "POSDiscount_restaurantId_idx" ON "POSDiscount"("restaurantId");
CREATE INDEX IF NOT EXISTS "POSDiscount_pOSTableSessionId_idx" ON "POSDiscount"("pOSTableSessionId");
CREATE INDEX IF NOT EXISTS "POSDiscount_discountCodeId_idx" ON "POSDiscount"("discountCodeId");

CREATE INDEX IF NOT EXISTS "POSReceipt_restaurantId_idx" ON "POSReceipt"("restaurantId");
CREATE INDEX IF NOT EXISTS "POSReceipt_pOSTableSessionId_idx" ON "POSReceipt"("pOSTableSessionId");
CREATE INDEX IF NOT EXISTS "POSReceipt_tableSessionId_idx" ON "POSReceipt"("tableSessionId");

-- ProductionCenter
CREATE INDEX IF NOT EXISTS "ProductionCenter_restaurantId_idx" ON "ProductionCenter"("restaurantId");
CREATE INDEX IF NOT EXISTS "ProductionCenter_printerId_idx" ON "ProductionCenter"("printerId");
