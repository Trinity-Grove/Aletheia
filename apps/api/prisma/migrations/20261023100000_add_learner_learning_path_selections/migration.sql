CREATE TABLE "learner_learning_path_selections" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "learner_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "path_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learner_learning_path_selections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "learner_learning_path_selections_family_learner_year_path_key"
    ON "learner_learning_path_selections"("family_id", "learner_id", "academic_year_id", "path_id");
CREATE INDEX "learner_learning_path_selections_family_learner_year_idx"
    ON "learner_learning_path_selections"("family_id", "learner_id", "academic_year_id");
CREATE INDEX "learner_learning_path_selections_path_id_idx"
    ON "learner_learning_path_selections"("path_id");

ALTER TABLE "learner_learning_path_selections"
    ADD CONSTRAINT "learner_learning_path_selections_family_id_fkey"
    FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "learner_learning_path_selections"
    ADD CONSTRAINT "learner_learning_path_selections_learner_id_fkey"
    FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "learner_learning_path_selections"
    ADD CONSTRAINT "learner_learning_path_selections_academic_year_id_fkey"
    FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "learner_learning_path_selections"
    ADD CONSTRAINT "learner_learning_path_selections_path_id_fkey"
    FOREIGN KEY ("path_id") REFERENCES "learning_paths"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
