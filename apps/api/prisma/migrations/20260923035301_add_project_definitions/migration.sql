-- AlterTable
ALTER TABLE "evidence_submissions" ADD COLUMN     "project_definition_id" UUID;

-- CreateTable
CREATE TABLE "project_definitions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "definition_statuses" NOT NULL DEFAULT 'DRAFT',
    "schema_version" TEXT NOT NULL DEFAULT '1.0.0',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "estimated_duration_days" INTEGER,
    "rubric_definition_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ,
    "deprecated_at" TIMESTAMPTZ,

    CONSTRAINT "project_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_definition_domains" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "domain_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_definition_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_definition_competencies" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "competency_id" UUID NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_definition_competencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_definition_milestones" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_definition_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_definition_projects" (
    "id" UUID NOT NULL,
    "curriculum_definition_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculum_definition_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_definitions_code_idx" ON "project_definitions"("code");

-- CreateIndex
CREATE INDEX "project_definitions_status_idx" ON "project_definitions"("status");

-- CreateIndex
CREATE INDEX "project_definitions_rubric_definition_id_idx" ON "project_definitions"("rubric_definition_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_definitions_code_version_key" ON "project_definitions"("code", "version");

-- CreateIndex
CREATE INDEX "project_definition_domains_project_id_idx" ON "project_definition_domains"("project_id");

-- CreateIndex
CREATE INDEX "project_definition_domains_domain_id_idx" ON "project_definition_domains"("domain_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_definition_domains_project_id_domain_id_key" ON "project_definition_domains"("project_id", "domain_id");

-- CreateIndex
CREATE INDEX "project_definition_competencies_project_id_idx" ON "project_definition_competencies"("project_id");

-- CreateIndex
CREATE INDEX "project_definition_competencies_competency_id_idx" ON "project_definition_competencies"("competency_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_definition_competencies_project_id_competency_id_key" ON "project_definition_competencies"("project_id", "competency_id");

-- CreateIndex
CREATE INDEX "project_definition_milestones_project_id_idx" ON "project_definition_milestones"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_definition_milestones_project_id_code_key" ON "project_definition_milestones"("project_id", "code");

-- CreateIndex
CREATE INDEX "curriculum_definition_projects_curriculum_definition_id_idx" ON "curriculum_definition_projects"("curriculum_definition_id");

-- CreateIndex
CREATE INDEX "curriculum_definition_projects_project_id_idx" ON "curriculum_definition_projects"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_definition_projects_curriculum_definition_id_pro_key" ON "curriculum_definition_projects"("curriculum_definition_id", "project_id");

-- CreateIndex
CREATE INDEX "evidence_submissions_project_definition_id_idx" ON "evidence_submissions"("project_definition_id");

-- AddForeignKey
ALTER TABLE "project_definitions" ADD CONSTRAINT "project_definitions_rubric_definition_id_fkey" FOREIGN KEY ("rubric_definition_id") REFERENCES "rubric_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_definition_domains" ADD CONSTRAINT "project_definition_domains_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_definition_domains" ADD CONSTRAINT "project_definition_domains_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "learning_domains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_definition_competencies" ADD CONSTRAINT "project_definition_competencies_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_definition_competencies" ADD CONSTRAINT "project_definition_competencies_competency_id_fkey" FOREIGN KEY ("competency_id") REFERENCES "competency_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_definition_milestones" ADD CONSTRAINT "project_definition_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_definition_projects" ADD CONSTRAINT "curriculum_definition_projects_curriculum_definition_id_fkey" FOREIGN KEY ("curriculum_definition_id") REFERENCES "curriculum_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_definition_projects" ADD CONSTRAINT "curriculum_definition_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_submissions" ADD CONSTRAINT "evidence_submissions_project_definition_id_fkey" FOREIGN KEY ("project_definition_id") REFERENCES "project_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
