CREATE TABLE "family_learning_path_selections" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "path_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "family_learning_path_selections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "family_learning_path_selections_family_id_path_id_key"
    ON "family_learning_path_selections"("family_id", "path_id");

CREATE INDEX "family_learning_path_selections_family_id_idx"
    ON "family_learning_path_selections"("family_id");

CREATE INDEX "family_learning_path_selections_path_id_idx"
    ON "family_learning_path_selections"("path_id");

ALTER TABLE "family_learning_path_selections"
    ADD CONSTRAINT "family_learning_path_selections_family_id_fkey"
    FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "family_learning_path_selections"
    ADD CONSTRAINT "family_learning_path_selections_path_id_fkey"
    FOREIGN KEY ("path_id") REFERENCES "learning_paths"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
