-- Explicit LearningPath composition for CurriculumDefinition (issue #96).
CREATE TABLE "curriculum_definition_paths" (
    "id" UUID NOT NULL,
    "curriculum_definition_id" UUID NOT NULL,
    "path_id" UUID NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculum_definition_paths_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "curriculum_definition_paths_curriculum_definition_id_path_id_key"
  ON "curriculum_definition_paths"("curriculum_definition_id", "path_id");
CREATE INDEX "curriculum_definition_paths_curriculum_definition_id_idx"
  ON "curriculum_definition_paths"("curriculum_definition_id");
CREATE INDEX "curriculum_definition_paths_path_id_idx"
  ON "curriculum_definition_paths"("path_id");

ALTER TABLE "curriculum_definition_paths"
  ADD CONSTRAINT "curriculum_definition_paths_curriculum_definition_id_fkey"
  FOREIGN KEY ("curriculum_definition_id") REFERENCES "curriculum_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "curriculum_definition_paths"
  ADD CONSTRAINT "curriculum_definition_paths_path_id_fkey"
  FOREIGN KEY ("path_id") REFERENCES "learning_paths"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
