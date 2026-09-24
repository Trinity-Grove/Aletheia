-- CreateEnum
CREATE TYPE "mentor_grant_statuses" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED');

-- CreateTable
CREATE TABLE "mentor_grants" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "learner_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" "mentor_grant_statuses" NOT NULL DEFAULT 'PENDING',
    "token_hash" TEXT NOT NULL,
    "invited_by" UUID NOT NULL,
    "mentor_user_id" UUID,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "accepted_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mentor_grants_token_hash_key" ON "mentor_grants"("token_hash");

-- CreateIndex
CREATE INDEX "mentor_grants_family_id_idx" ON "mentor_grants"("family_id");

-- CreateIndex
CREATE INDEX "mentor_grants_learner_id_idx" ON "mentor_grants"("learner_id");

-- CreateIndex
CREATE INDEX "mentor_grants_email_idx" ON "mentor_grants"("email");

-- AddForeignKey
ALTER TABLE "mentor_grants" ADD CONSTRAINT "mentor_grants_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_grants" ADD CONSTRAINT "mentor_grants_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_grants" ADD CONSTRAINT "mentor_grants_mentor_user_id_fkey" FOREIGN KEY ("mentor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_grants" ADD CONSTRAINT "mentor_grants_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
