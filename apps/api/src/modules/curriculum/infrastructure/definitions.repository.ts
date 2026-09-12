import { Injectable } from '@nestjs/common';
import type {
  LearningDomain,
  CompetencyDefinition,
  PedagogicalModelDefinition,
  LearningPath,
  SkillDefinition,
  RubricDefinition,
  RubricCriterion,
  EvidenceTypeDefinition,
  CurriculumDefinition,
  CurriculumDefinitionDomain,
  CurriculumDefinitionCompetency,
  CurriculumDefinitionRubric,
  CurriculumDefinitionActivity,
  ActivityDefinition,
  ActivityDefinitionCompetency,
  ActivityDefinitionEvidenceType,
  TheologicalTraditionDefinition,
  TheologicalPositionDefinition,
  ProgressionPolicy,
  BibleTranslationDefinition,
  Prisma,
} from '@prisma/client';
import type {
  CreateLearningDomainOutput,
  CreateCompetencyDefinitionOutput,
  CreatePedagogicalModelDefinitionOutput,
  CreateLearningPathOutput,
  CreateSkillDefinitionOutput,
  CreateRubricDefinitionOutput,
  CreateRubricCriterionOutput,
  CreateEvidenceTypeDefinitionOutput,
  CreateCurriculumDefinitionOutput,
  AddCurriculumDefinitionDomainOutput,
  AddCurriculumDefinitionCompetencyOutput,
  AddCurriculumDefinitionRubricOutput,
  AddCurriculumDefinitionActivityOutput,
  CreateActivityDefinitionOutput,
  AddActivityDefinitionCompetencyOutput,
  AddActivityDefinitionEvidenceTypeOutput,
  CreateTheologicalTraditionDefinitionOutput,
  CreateTheologicalPositionDefinitionOutput,
  CreateProgressionPolicyOutput,
  CreateBibleTranslationDefinitionOutput,
} from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import type { DefinitionStatusUpdate } from '../application/definition-status-transition.js';

// Thin CRUD for the Definition/Version tables added across #97-#99 and
// #104-#107 (LearningDomain, CompetencyDefinition,
// PedagogicalModelDefinition, LearningPath, SkillDefinition,
// RubricDefinition, EvidenceTypeDefinition, CurriculumDefinition,
// ActivityDefinition, and their join tables). No business logic here
// beyond straight Prisma calls -- status-transition validation lives in
// definition-status-transition.ts and is applied by the service layer.
@Injectable()
export class DefinitionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Learning Domain
  createLearningDomain(dto: CreateLearningDomainOutput): Promise<LearningDomain> {
    return this.prisma.learningDomain.create({
      data: {
        code: dto.code,
        version: dto.version,
        status: dto.status,
        schemaVersion: dto.schemaVersion,
        name: dto.name,
        description: dto.description ?? null,
        parentId: dto.parentId ?? null,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  listLearningDomains(): Promise<LearningDomain[]> {
    return this.prisma.learningDomain.findMany({ orderBy: [{ code: 'asc' }, { version: 'desc' }] });
  }

  findLearningDomainById(id: string): Promise<LearningDomain | null> {
    return this.prisma.learningDomain.findUnique({ where: { id } });
  }

  updateLearningDomainStatus(id: string, update: DefinitionStatusUpdate): Promise<LearningDomain> {
    return this.prisma.learningDomain.update({ where: { id }, data: update });
  }

  // Competency Definition
  createCompetencyDefinition(dto: CreateCompetencyDefinitionOutput): Promise<CompetencyDefinition> {
    return this.prisma.competencyDefinition.create({
      data: {
        code: dto.code,
        version: dto.version,
        status: dto.status,
        schemaVersion: dto.schemaVersion,
        domainId: dto.domainId,
        pathId: dto.pathId ?? null,
        title: dto.title,
        level: dto.level ?? null,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  listCompetencyDefinitions(): Promise<CompetencyDefinition[]> {
    return this.prisma.competencyDefinition.findMany({ orderBy: [{ code: 'asc' }, { version: 'desc' }] });
  }

  findCompetencyDefinitionById(id: string): Promise<CompetencyDefinition | null> {
    return this.prisma.competencyDefinition.findUnique({ where: { id } });
  }

  updateCompetencyDefinitionStatus(id: string, update: DefinitionStatusUpdate): Promise<CompetencyDefinition> {
    return this.prisma.competencyDefinition.update({ where: { id }, data: update });
  }

  // Pedagogical Model Definition
  createPedagogicalModelDefinition(
    dto: CreatePedagogicalModelDefinitionOutput,
  ): Promise<PedagogicalModelDefinition> {
    return this.prisma.pedagogicalModelDefinition.create({
      data: {
        code: dto.code,
        version: dto.version,
        status: dto.status,
        schemaVersion: dto.schemaVersion,
        name: dto.name,
        description: dto.description ?? null,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  listPedagogicalModelDefinitions(): Promise<PedagogicalModelDefinition[]> {
    return this.prisma.pedagogicalModelDefinition.findMany({ orderBy: [{ code: 'asc' }, { version: 'desc' }] });
  }

  findPedagogicalModelDefinitionById(id: string): Promise<PedagogicalModelDefinition | null> {
    return this.prisma.pedagogicalModelDefinition.findUnique({ where: { id } });
  }

  updatePedagogicalModelDefinitionStatus(
    id: string,
    update: DefinitionStatusUpdate,
  ): Promise<PedagogicalModelDefinition> {
    return this.prisma.pedagogicalModelDefinition.update({ where: { id }, data: update });
  }

  // Learning Path
  createLearningPath(dto: CreateLearningPathOutput): Promise<LearningPath> {
    return this.prisma.learningPath.create({
      data: {
        code: dto.code,
        version: dto.version,
        status: dto.status,
        schemaVersion: dto.schemaVersion,
        domainId: dto.domainId,
        name: dto.name,
        description: dto.description ?? null,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  listLearningPaths(): Promise<LearningPath[]> {
    return this.prisma.learningPath.findMany({ orderBy: [{ code: 'asc' }, { version: 'desc' }] });
  }

  findLearningPathById(id: string): Promise<LearningPath | null> {
    return this.prisma.learningPath.findUnique({ where: { id } });
  }

  updateLearningPathStatus(id: string, update: DefinitionStatusUpdate): Promise<LearningPath> {
    return this.prisma.learningPath.update({ where: { id }, data: update });
  }

  // Skill Definition
  createSkillDefinition(dto: CreateSkillDefinitionOutput): Promise<SkillDefinition> {
    return this.prisma.skillDefinition.create({
      data: {
        code: dto.code,
        version: dto.version,
        status: dto.status,
        schemaVersion: dto.schemaVersion,
        competencyId: dto.competencyId,
        title: dto.title,
        order: dto.order,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  listSkillDefinitions(): Promise<SkillDefinition[]> {
    return this.prisma.skillDefinition.findMany({ orderBy: [{ code: 'asc' }, { version: 'desc' }] });
  }

  findSkillDefinitionById(id: string): Promise<SkillDefinition | null> {
    return this.prisma.skillDefinition.findUnique({ where: { id } });
  }

  updateSkillDefinitionStatus(id: string, update: DefinitionStatusUpdate): Promise<SkillDefinition> {
    return this.prisma.skillDefinition.update({ where: { id }, data: update });
  }

  // Rubric Definition
  createRubricDefinition(dto: CreateRubricDefinitionOutput): Promise<RubricDefinition> {
    return this.prisma.rubricDefinition.create({
      data: {
        code: dto.code,
        version: dto.version,
        status: dto.status,
        schemaVersion: dto.schemaVersion,
        competencyId: dto.competencyId ?? null,
        name: dto.name,
        description: dto.description ?? null,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  listRubricDefinitions(): Promise<RubricDefinition[]> {
    return this.prisma.rubricDefinition.findMany({ orderBy: [{ code: 'asc' }, { version: 'desc' }] });
  }

  findRubricDefinitionById(id: string): Promise<RubricDefinition | null> {
    return this.prisma.rubricDefinition.findUnique({ where: { id } });
  }

  updateRubricDefinitionStatus(id: string, update: DefinitionStatusUpdate): Promise<RubricDefinition> {
    return this.prisma.rubricDefinition.update({ where: { id }, data: update });
  }

  createRubricCriterion(rubricId: string, dto: CreateRubricCriterionOutput): Promise<RubricCriterion> {
    return this.prisma.rubricCriterion.create({
      data: {
        rubricId,
        code: dto.code,
        label: dto.label,
        weight: dto.weight,
        order: dto.order,
        scaleMin: dto.scaleMin,
        scaleMax: dto.scaleMax,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  listRubricCriteria(rubricId: string): Promise<RubricCriterion[]> {
    return this.prisma.rubricCriterion.findMany({ where: { rubricId }, orderBy: { order: 'asc' } });
  }

  // Evidence Type Definition
  createEvidenceTypeDefinition(dto: CreateEvidenceTypeDefinitionOutput): Promise<EvidenceTypeDefinition> {
    return this.prisma.evidenceTypeDefinition.create({
      data: {
        code: dto.code,
        version: dto.version,
        status: dto.status,
        schemaVersion: dto.schemaVersion,
        name: dto.name,
        description: dto.description ?? null,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  listEvidenceTypeDefinitions(): Promise<EvidenceTypeDefinition[]> {
    return this.prisma.evidenceTypeDefinition.findMany({ orderBy: [{ code: 'asc' }, { version: 'desc' }] });
  }

  findEvidenceTypeDefinitionById(id: string): Promise<EvidenceTypeDefinition | null> {
    return this.prisma.evidenceTypeDefinition.findUnique({ where: { id } });
  }

  updateEvidenceTypeDefinitionStatus(id: string, update: DefinitionStatusUpdate): Promise<EvidenceTypeDefinition> {
    return this.prisma.evidenceTypeDefinition.update({ where: { id }, data: update });
  }

  // Curriculum Definition
  createCurriculumDefinition(dto: CreateCurriculumDefinitionOutput): Promise<CurriculumDefinition> {
    return this.prisma.curriculumDefinition.create({
      data: {
        code: dto.code,
        version: dto.version,
        status: dto.status,
        schemaVersion: dto.schemaVersion,
        name: dto.name,
        description: dto.description ?? null,
        pedagogicalModelDefinitionId: dto.pedagogicalModelDefinitionId ?? null,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  listCurriculumDefinitions(): Promise<CurriculumDefinition[]> {
    return this.prisma.curriculumDefinition.findMany({ orderBy: [{ code: 'asc' }, { version: 'desc' }] });
  }

  findCurriculumDefinitionById(id: string): Promise<CurriculumDefinition | null> {
    return this.prisma.curriculumDefinition.findUnique({ where: { id } });
  }

  updateCurriculumDefinitionStatus(id: string, update: DefinitionStatusUpdate): Promise<CurriculumDefinition> {
    return this.prisma.curriculumDefinition.update({ where: { id }, data: update });
  }

  addCurriculumDefinitionDomain(
    curriculumDefinitionId: string,
    dto: AddCurriculumDefinitionDomainOutput,
  ): Promise<CurriculumDefinitionDomain> {
    return this.prisma.curriculumDefinitionDomain.create({
      data: { curriculumDefinitionId, domainId: dto.domainId, required: dto.required, order: dto.order },
    });
  }

  listCurriculumDefinitionDomains(curriculumDefinitionId: string): Promise<CurriculumDefinitionDomain[]> {
    return this.prisma.curriculumDefinitionDomain.findMany({
      where: { curriculumDefinitionId },
      orderBy: { order: 'asc' },
    });
  }

  addCurriculumDefinitionCompetency(
    curriculumDefinitionId: string,
    dto: AddCurriculumDefinitionCompetencyOutput,
  ): Promise<CurriculumDefinitionCompetency> {
    return this.prisma.curriculumDefinitionCompetency.create({
      data: {
        curriculumDefinitionId,
        competencyId: dto.competencyId,
        required: dto.required,
        order: dto.order,
      },
    });
  }

  listCurriculumDefinitionCompetencies(
    curriculumDefinitionId: string,
  ): Promise<CurriculumDefinitionCompetency[]> {
    return this.prisma.curriculumDefinitionCompetency.findMany({
      where: { curriculumDefinitionId },
      orderBy: { order: 'asc' },
    });
  }

  addCurriculumDefinitionRubric(
    curriculumDefinitionId: string,
    dto: AddCurriculumDefinitionRubricOutput,
  ): Promise<CurriculumDefinitionRubric> {
    return this.prisma.curriculumDefinitionRubric.create({
      data: { curriculumDefinitionId, rubricId: dto.rubricId },
    });
  }

  listCurriculumDefinitionRubrics(curriculumDefinitionId: string): Promise<CurriculumDefinitionRubric[]> {
    return this.prisma.curriculumDefinitionRubric.findMany({ where: { curriculumDefinitionId } });
  }

  addCurriculumDefinitionActivity(
    curriculumDefinitionId: string,
    dto: AddCurriculumDefinitionActivityOutput,
  ): Promise<CurriculumDefinitionActivity> {
    return this.prisma.curriculumDefinitionActivity.create({
      data: {
        curriculumDefinitionId,
        activityId: dto.activityId,
        required: dto.required,
        order: dto.order,
      },
    });
  }

  listCurriculumDefinitionActivities(
    curriculumDefinitionId: string,
  ): Promise<CurriculumDefinitionActivity[]> {
    return this.prisma.curriculumDefinitionActivity.findMany({
      where: { curriculumDefinitionId },
      orderBy: { order: 'asc' },
    });
  }

  // Activity Definition
  createActivityDefinition(dto: CreateActivityDefinitionOutput): Promise<ActivityDefinition> {
    return this.prisma.activityDefinition.create({
      data: {
        code: dto.code,
        version: dto.version,
        status: dto.status,
        schemaVersion: dto.schemaVersion,
        name: dto.name,
        description: dto.description ?? null,
        ageMin: dto.ageMin ?? null,
        ageMax: dto.ageMax ?? null,
        estimatedDurationMinutes: dto.estimatedDurationMinutes ?? null,
        supervisionRequired: dto.supervisionRequired,
        riskLevel: dto.riskLevel ?? null,
        evidenceRequirementMode: dto.evidenceRequirementMode,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  listActivityDefinitions(): Promise<ActivityDefinition[]> {
    return this.prisma.activityDefinition.findMany({ orderBy: [{ code: 'asc' }, { version: 'desc' }] });
  }

  findActivityDefinitionById(id: string): Promise<ActivityDefinition | null> {
    return this.prisma.activityDefinition.findUnique({ where: { id } });
  }

  updateActivityDefinitionStatus(id: string, update: DefinitionStatusUpdate): Promise<ActivityDefinition> {
    return this.prisma.activityDefinition.update({ where: { id }, data: update });
  }

  addActivityDefinitionCompetency(
    activityId: string,
    dto: AddActivityDefinitionCompetencyOutput,
  ): Promise<ActivityDefinitionCompetency> {
    return this.prisma.activityDefinitionCompetency.create({
      data: { activityId, competencyId: dto.competencyId, required: dto.required, order: dto.order },
    });
  }

  listActivityDefinitionCompetencies(activityId: string): Promise<ActivityDefinitionCompetency[]> {
    return this.prisma.activityDefinitionCompetency.findMany({
      where: { activityId },
      orderBy: { order: 'asc' },
    });
  }

  addActivityDefinitionEvidenceType(
    activityId: string,
    dto: AddActivityDefinitionEvidenceTypeOutput,
  ): Promise<ActivityDefinitionEvidenceType> {
    return this.prisma.activityDefinitionEvidenceType.create({
      data: { activityId, evidenceTypeId: dto.evidenceTypeId },
    });
  }

  listActivityDefinitionEvidenceTypes(activityId: string): Promise<ActivityDefinitionEvidenceType[]> {
    return this.prisma.activityDefinitionEvidenceType.findMany({ where: { activityId } });
  }

  // Theological Tradition Definition
  createTheologicalTraditionDefinition(
    dto: CreateTheologicalTraditionDefinitionOutput,
  ): Promise<TheologicalTraditionDefinition> {
    return this.prisma.theologicalTraditionDefinition.create({
      data: {
        code: dto.code,
        version: dto.version,
        status: dto.status,
        schemaVersion: dto.schemaVersion,
        name: dto.name,
        description: dto.description ?? null,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  listTheologicalTraditionDefinitions(): Promise<TheologicalTraditionDefinition[]> {
    return this.prisma.theologicalTraditionDefinition.findMany({
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
    });
  }

  findTheologicalTraditionDefinitionById(id: string): Promise<TheologicalTraditionDefinition | null> {
    return this.prisma.theologicalTraditionDefinition.findUnique({ where: { id } });
  }

  updateTheologicalTraditionDefinitionStatus(
    id: string,
    update: DefinitionStatusUpdate,
  ): Promise<TheologicalTraditionDefinition> {
    return this.prisma.theologicalTraditionDefinition.update({ where: { id }, data: update });
  }

  // Theological Position Definition
  createTheologicalPositionDefinition(
    dto: CreateTheologicalPositionDefinitionOutput,
  ): Promise<TheologicalPositionDefinition> {
    return this.prisma.theologicalPositionDefinition.create({
      data: {
        code: dto.code,
        version: dto.version,
        status: dto.status,
        schemaVersion: dto.schemaVersion,
        traditionId: dto.traditionId ?? null,
        topic: dto.topic,
        name: dto.name,
        description: dto.description ?? null,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  listTheologicalPositionDefinitions(): Promise<TheologicalPositionDefinition[]> {
    return this.prisma.theologicalPositionDefinition.findMany({
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
    });
  }

  findTheologicalPositionDefinitionById(id: string): Promise<TheologicalPositionDefinition | null> {
    return this.prisma.theologicalPositionDefinition.findUnique({ where: { id } });
  }

  updateTheologicalPositionDefinitionStatus(
    id: string,
    update: DefinitionStatusUpdate,
  ): Promise<TheologicalPositionDefinition> {
    return this.prisma.theologicalPositionDefinition.update({ where: { id }, data: update });
  }

  // Progression Policy
  createProgressionPolicy(dto: CreateProgressionPolicyOutput): Promise<ProgressionPolicy> {
    return this.prisma.progressionPolicy.create({
      data: {
        code: dto.code,
        version: dto.version,
        status: dto.status,
        schemaVersion: dto.schemaVersion,
        name: dto.name,
        description: dto.description ?? null,
        policyType: dto.policyType,
        rules: dto.rules as Prisma.InputJsonValue,
        competencyDefinitionId: dto.competencyDefinitionId ?? null,
        curriculumDefinitionId: dto.curriculumDefinitionId ?? null,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  listProgressionPolicies(): Promise<ProgressionPolicy[]> {
    return this.prisma.progressionPolicy.findMany({ orderBy: [{ code: 'asc' }, { version: 'desc' }] });
  }

  findProgressionPolicyById(id: string): Promise<ProgressionPolicy | null> {
    return this.prisma.progressionPolicy.findUnique({ where: { id } });
  }

  updateProgressionPolicyStatus(id: string, update: DefinitionStatusUpdate): Promise<ProgressionPolicy> {
    return this.prisma.progressionPolicy.update({ where: { id }, data: update });
  }

  // Bible Translation Definition
  createBibleTranslationDefinition(
    dto: CreateBibleTranslationDefinitionOutput,
  ): Promise<BibleTranslationDefinition> {
    return this.prisma.bibleTranslationDefinition.create({
      data: {
        code: dto.code,
        version: dto.version,
        status: dto.status,
        schemaVersion: dto.schemaVersion,
        name: dto.name,
        language: dto.language,
        youVersionId: dto.youVersionId,
        translationPhilosophy: dto.translationPhilosophy ?? null,
        publisher: dto.publisher ?? null,
        licensingNotes: dto.licensingNotes ?? null,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  listBibleTranslationDefinitions(): Promise<BibleTranslationDefinition[]> {
    return this.prisma.bibleTranslationDefinition.findMany({ orderBy: [{ code: 'asc' }, { version: 'desc' }] });
  }

  findBibleTranslationDefinitionById(id: string): Promise<BibleTranslationDefinition | null> {
    return this.prisma.bibleTranslationDefinition.findUnique({ where: { id } });
  }

  updateBibleTranslationDefinitionStatus(
    id: string,
    update: DefinitionStatusUpdate,
  ): Promise<BibleTranslationDefinition> {
    return this.prisma.bibleTranslationDefinition.update({ where: { id }, data: update });
  }

  // Latest PUBLISHED row per code -- used by the read-only compare
  // endpoint to resolve a translation code to the youVersionId
  // YouVersionService.fetchPassage needs.
  async findLatestPublishedBibleTranslationDefinitionsByCodes(
    codes: string[],
  ): Promise<BibleTranslationDefinition[]> {
    const candidates = await this.prisma.bibleTranslationDefinition.findMany({
      where: { code: { in: codes }, status: 'PUBLISHED' },
      orderBy: { version: 'desc' },
    });
    const latestByCode = new Map<string, BibleTranslationDefinition>();
    for (const row of candidates) {
      if (!latestByCode.has(row.code)) latestByCode.set(row.code, row);
    }
    return codes.map((code) => latestByCode.get(code)).filter((row): row is BibleTranslationDefinition => Boolean(row));
  }
}
