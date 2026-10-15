CREATE TABLE "family_project_selections" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "family_project_selections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "family_project_selections_family_id_project_id_key"
    ON "family_project_selections"("family_id", "project_id");

CREATE INDEX "family_project_selections_family_id_idx"
    ON "family_project_selections"("family_id");

CREATE INDEX "family_project_selections_project_id_idx"
    ON "family_project_selections"("project_id");

ALTER TABLE "family_project_selections"
    ADD CONSTRAINT "family_project_selections_family_id_fkey"
    FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "family_project_selections"
    ADD CONSTRAINT "family_project_selections_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "project_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
