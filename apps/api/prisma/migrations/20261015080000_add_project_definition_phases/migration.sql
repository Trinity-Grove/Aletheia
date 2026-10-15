CREATE TABLE "project_definition_phases" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_definition_phases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_definition_phases_project_id_code_key"
    ON "project_definition_phases"("project_id", "code");

CREATE INDEX "project_definition_phases_project_id_idx"
    ON "project_definition_phases"("project_id");

ALTER TABLE "project_definition_phases"
    ADD CONSTRAINT "project_definition_phases_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "project_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_definition_milestones"
    ADD COLUMN "phase_id" UUID;

CREATE INDEX "project_definition_milestones_phase_id_idx"
    ON "project_definition_milestones"("phase_id");

ALTER TABLE "project_definition_milestones"
    ADD CONSTRAINT "project_definition_milestones_phase_id_fkey"
    FOREIGN KEY ("phase_id") REFERENCES "project_definition_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
