-- CreateEnum
CREATE TYPE "donation_frequencies" AS ENUM ('ONE_TIME', 'MONTHLY');

-- CreateEnum
CREATE TYPE "donation_statuses" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "donation_payment_methods" AS ENUM ('PIX', 'GOOGLE_PAY', 'CREDIT_CARD');

-- CreateTable
CREATE TABLE "donation_records" (
    "id" UUID NOT NULL,
    "family_id" UUID,
    "donor_name" TEXT,
    "donor_email" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "frequency" "donation_frequencies" NOT NULL DEFAULT 'ONE_TIME',
    "payment_method" "donation_payment_methods" NOT NULL,
    "status" "donation_statuses" NOT NULL DEFAULT 'PENDING',
    "gateway_provider" TEXT NOT NULL,
    "gateway_transaction_id" TEXT,
    "gateway_subscription_id" TEXT,
    "pix_qr_code_url" TEXT,
    "pix_copia_e_cola" TEXT,
    "notes" TEXT,
    "confirmed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "donation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supporter_subscriptions" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "payment_method" "donation_payment_methods" NOT NULL,
    "status" "donation_statuses" NOT NULL DEFAULT 'PENDING',
    "gateway_provider" TEXT NOT NULL,
    "gateway_subscription_id" TEXT NOT NULL,
    "cancelled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "supporter_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "donation_records_family_id_idx" ON "donation_records"("family_id");

-- CreateIndex
CREATE INDEX "donation_records_gateway_transaction_id_idx" ON "donation_records"("gateway_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "supporter_subscriptions_gateway_subscription_id_key" ON "supporter_subscriptions"("gateway_subscription_id");

-- CreateIndex
CREATE INDEX "supporter_subscriptions_family_id_idx" ON "supporter_subscriptions"("family_id");

-- AddForeignKey
ALTER TABLE "donation_records" ADD CONSTRAINT "donation_records_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supporter_subscriptions" ADD CONSTRAINT "supporter_subscriptions_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
