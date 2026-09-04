-- Evidence upload/storage (issue #29): a portfolio item's uploaded file is
-- identified by an opaque object-storage key, not the raw file_url text
-- column (which stays for LINK-type evidence pointing at external URLs).
ALTER TABLE "portfolio_items" ADD COLUMN "storage_key" TEXT;
ALTER TABLE "portfolio_items" ADD COLUMN "checksum_sha256" TEXT;
ALTER TABLE "portfolio_items" ADD COLUMN "deleted_at" TIMESTAMPTZ;

CREATE UNIQUE INDEX "portfolio_items_storage_key_key" ON "portfolio_items"("storage_key");
