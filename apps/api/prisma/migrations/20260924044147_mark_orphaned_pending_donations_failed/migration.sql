-- Data-only migration, no schema change.
--
-- Before PR #240, a ONE_TIME donation record was persisted as PENDING
-- *before* the Mercado Pago gateway call was made. When that call threw
-- (exactly what happened live in production during the payer.email bugs,
-- #238/#239), the record was left stuck at PENDING forever with no
-- gateway_transaction_id -- no webhook could ever reach it, so it never
-- resolved. These are the orphaned "Pendente" rows a real user spotted in
-- their donation history.
--
-- PENDING + gateway_transaction_id IS NULL is a safe, unambiguous signal
-- that no order/preference was ever actually created at Mercado Pago for
-- that row (a real intent always gets a gateway_transaction_id set
-- immediately, whether it's a real order id or, for the Checkout Pro
-- credit-card flow, a placeholder preference id backfilled by the first
-- webhook -- see PR #241). This does not touch any row with a real gateway
-- reference, confirmed or not.
UPDATE "donation_records"
SET "status" = 'FAILED', "updated_at" = CURRENT_TIMESTAMP
WHERE "status" = 'PENDING' AND "gateway_transaction_id" IS NULL;
