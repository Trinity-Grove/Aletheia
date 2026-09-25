import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
  ProjectDefinition,
  ProjectDefinitionDomain,
  ProjectDefinitionCompetency,
  ProjectDefinitionMilestone,
  CurriculumDefinitionProject,
  TheologicalTraditionDefinition,
  TheologicalPositionDefinition,
  ProgressionPolicy,
  BibleTranslationDefinition,
} from '@prisma/client';
import type {
  CreateLearningDomainOutput,
  LearningDomainResponseDto,
  CreateCompetencyDefinitionOutput,
  CompetencyDefinitionResponseDto,
  CreatePedagogicalModelDefinitionOutput,
  PedagogicalModelDefinitionResponseDto,
  CreateLearningPathOutput,
  LearningPathResponseDto,
  CreateSkillDefinitionOutput,
  SkillDefinitionResponseDto,
  CreateRubricDefinitionOutput,
  RubricDefinitionResponseDto,
  CreateRubricCriterionOutput,
  RubricCriterionResponseDto,
  CreateEvidenceTypeDefinitionOutput,
  EvidenceTypeDefinitionResponseDto,
  CreateCurriculumDefinitionOutput,
  CurriculumDefinitionResponseDto,
  AddCurriculumDefinitionDomainOutput,
  CurriculumDefinitionDomainResponseDto,
  AddCurriculumDefinitionCompetencyOutput,
  CurriculumDefinitionCompetencyResponseDto,
  AddCurriculumDefinitionRubricOutput,
  CurriculumDefinitionRubricResponseDto,
  AddCurriculumDefinitionActivityOutput,
  CurriculumDefinitionActivityResponseDto,
  CreateActivityDefinitionOutput,
  ActivityDefinitionResponseDto,
  AddActivityDefinitionCompetencyOutput,
  ActivityDefinitionCompetencyResponseDto,
  AddActivityDefinitionEvidenceTypeOutput,
  ActivityDefinitionEvidenceTypeResponseDto,
  CreateProjectDefinitionOutput,
  ProjectDefinitionResponseDto,
  AddProjectDefinitionDomainOutput,
  ProjectDefinitionDomainResponseDto,
  AddProjectDefinitionCompetencyOutput,
  ProjectDefinitionCompetencyResponseDto,
  AddProjectDefinitionMilestoneOutput,
  ProjectDefinitionMilestoneResponseDto,
  AddCurriculumDefinitionProjectOutput,
  CurriculumDefinitionProjectResponseDto,
  CreateTheologicalTraditionDefinitionOutput,
  TheologicalTraditionDefinitionResponseDto,
  CreateTheologicalPositionDefinitionOutput,
  TheologicalPositionDefinitionResponseDto,
  CreateProgressionPolicyOutput,
  ProgressionPolicyResponseDto,
  CreateBibleTranslationDefinitionOutput,
  BibleTranslationDefinitionResponseDto,
  DefinitionStatus,
} from '@aletheia/contracts';
import { DefinitionsRepository } from '../infrastructure/definitions.repository.js';
import { DefinitionVersionOperationsService } from './definition-version-operations.service.js';
import { computeStatusTransition } from './definition-status-transition.js';

// Admin CRUD for the data-driven curriculum foundation (issue #96 Fase 0,
// "test from section 40": adding a new domain/competency/track/skill/
// pedagogical model/rubric/evidence type/curriculum/activity should be a
// data write through this API, not a code change + deploy. DRAFT ->
// PUBLISHED -> DEPRECATED -> ARCHIVED transitions are explicit calls (see
// definition-status-transition.ts), never an implicit side effect of
// create/update.
//
// Deliberately NOT wired into any learner-facing read path -- CurriculumService
// still resolves pedagogical frameworks via the pre-existing enum +
// CurriculumTemplateEngine switch-case. That cutover is a separate,
// human-approved PR.
@Injectable()
export class DefinitionsService {
  constructor(
    private readonly repository: DefinitionsRepository,
    private readonly operationsService: DefinitionVersionOperationsService,
  ) {}

  // Learning Domain
  async createLearningDomain(
    dto: CreateLearningDomainOutput,
    actorUserId?: string,
  ): Promise<LearningDomainResponseDto> {
    const row = await this.repository.createLearningDomain(dto);
    if (actorUserId) {
      await this.operationsService.logCreate('LearningDomain', row.code, row.version, actorUserId);
    }
    return this.toLearningDomainDto(row);
  }

  async listLearningDomains(): Promise<LearningDomainResponseDto[]> {
    const rows = await this.repository.listLearningDomains();
    return rows.map((row) => this.toLearningDomainDto(row));
  }

  async transitionLearningDomainStatus(
    id: string,
    status: DefinitionStatus,
    actorUserId?: string,
    reason?: string | null,
  ): Promise<LearningDomainResponseDto> {
    const existing = await this.repository.findLearningDomainById(id);
    if (!existing) throw new NotFoundException('Learning domain not found.');
    const update = computeStatusTransition(existing.status as DefinitionStatus, status);
    const row = await this.repository.updateLearningDomainStatus(id, update);
    if (actorUserId) {
      await this.operationsService.logStatusTransition(
        'LearningDomain', row.code, row.version, actorUserId, existing.status, row.status, reason,
        );
    }
    return this.toLearningDomainDto(row);
  }

  // Competency Definition
  async createCompetencyDefinition(
    dto: CreateCompetencyDefinitionOutput,
    actorUserId?: string,
  ): Promise<CompetencyDefinitionResponseDto> {
    const row = await this.repository.createCompetencyDefinition(dto);
    if (actorUserId) {
      await this.operationsService.logCreate('CompetencyDefinition', row.code, row.version, actorUserId);
    }
    return this.toCompetencyDefinitionDto(row);
  }

  async listCompetencyDefinitions(): Promise<CompetencyDefinitionResponseDto[]> {
    const rows = await this.repository.listCompetencyDefinitions();
    return rows.map((row) => this.toCompetencyDefinitionDto(row));
  }

  async transitionCompetencyDefinitionStatus(
    id: string,
    status: DefinitionStatus,
    actorUserId?: string,
    reason?: string | null,
  ): Promise<CompetencyDefinitionResponseDto> {
    const existing = await this.repository.findCompetencyDefinitionById(id);
    if (!existing) throw new NotFoundException('Competency definition not found.');
    const update = computeStatusTransition(existing.status as DefinitionStatus, status);
    const row = await this.repository.updateCompetencyDefinitionStatus(id, update);
    if (actorUserId) {
      await this.operationsService.logStatusTransition(
        'CompetencyDefinition', row.code, row.version, actorUserId, existing.status, row.status, reason,
        );
    }
    return this.toCompetencyDefinitionDto(row);
  }

  // Pedagogical Model Definition
  async createPedagogicalModelDefinition(
    dto: CreatePedagogicalModelDefinitionOutput,
    actorUserId?: string,
  ): Promise<PedagogicalModelDefinitionResponseDto> {
    const row = await this.repository.createPedagogicalModelDefinition(dto);
    if (actorUserId) {
      await this.operationsService.logCreate('PedagogicalModelDefinition', row.code, row.version, actorUserId);
    }
    return this.toPedagogicalModelDefinitionDto(row);
  }

  async listPedagogicalModelDefinitions(): Promise<PedagogicalModelDefinitionResponseDto[]> {
    const rows = await this.repository.listPedagogicalModelDefinitions();
    return rows.map((row) => this.toPedagogicalModelDefinitionDto(row));
  }

  async transitionPedagogicalModelDefinitionStatus(
    id: string,
    status: DefinitionStatus,
    actorUserId?: string,
    reason?: string | null,
  ): Promise<PedagogicalModelDefinitionResponseDto> {
    const existing = await this.repository.findPedagogicalModelDefinitionById(id);
    if (!existing) throw new NotFoundException('Pedagogical model definition not found.');
    const update = computeStatusTransition(existing.status as DefinitionStatus, status);
    const row = await this.repository.updatePedagogicalModelDefinitionStatus(id, update);
    if (actorUserId) {
      await this.operationsService.logStatusTransition(
        'PedagogicalModelDefinition', row.code, row.version, actorUserId, existing.status, row.status, reason,
        );
    }
    return this.toPedagogicalModelDefinitionDto(row);
  }

  // Learning Path
  async createLearningPath(
    dto: CreateLearningPathOutput,
    actorUserId?: string,
  ): Promise<LearningPathResponseDto> {
    const row = await this.repository.createLearningPath(dto);
    if (actorUserId) {
      await this.operationsService.logCreate('LearningPath', row.code, row.version, actorUserId);
    }
    return this.toLearningPathDto(row);
  }

  async listLearningPaths(): Promise<LearningPathResponseDto[]> {
    const rows = await this.repository.listLearningPaths();
    return rows.map((row) => this.toLearningPathDto(row));
  }

  async transitionLearningPathStatus(
    id: string,
    status: DefinitionStatus,
    actorUserId?: string,
    reason?: string | null,
  ): Promise<LearningPathResponseDto> {
    const existing = await this.repository.findLearningPathById(id);
    if (!existing) throw new NotFoundException('Learning path not found.');
    const update = computeStatusTransition(existing.status as DefinitionStatus, status);
    const row = await this.repository.updateLearningPathStatus(id, update);
    if (actorUserId) {
      await this.operationsService.logStatusTransition(
        'LearningPath', row.code, row.version, actorUserId, existing.status, row.status, reason,
        );
    }
    return this.toLearningPathDto(row);
  }

  // Skill Definition
  async createSkillDefinition(
    dto: CreateSkillDefinitionOutput,
    actorUserId?: string,
  ): Promise<SkillDefinitionResponseDto> {
    const row = await this.repository.createSkillDefinition(dto);
    if (actorUserId) {
      await this.operationsService.logCreate('SkillDefinition', row.code, row.version, actorUserId);
    }
    return this.toSkillDefinitionDto(row);
  }

  async listSkillDefinitions(): Promise<SkillDefinitionResponseDto[]> {
    const rows = await this.repository.listSkillDefinitions();
    return rows.map((row) => this.toSkillDefinitionDto(row));
  }

  async transitionSkillDefinitionStatus(
    id: string,
    status: DefinitionStatus,
    actorUserId?: string,
    reason?: string | null,
  ): Promise<SkillDefinitionResponseDto> {
    const existing = await this.repository.findSkillDefinitionById(id);
    if (!existing) throw new NotFoundException('Skill definition not found.');
    const update = computeStatusTransition(existing.status as DefinitionStatus, status);
    const row = await this.repository.updateSkillDefinitionStatus(id, update);
    if (actorUserId) {
      await this.operationsService.logStatusTransition(
        'SkillDefinition', row.code, row.version, actorUserId, existing.status, row.status, reason,
        );
    }
    return this.toSkillDefinitionDto(row);
  }

  // Rubric Definition
  async createRubricDefinition(
    dto: CreateRubricDefinitionOutput,
    actorUserId?: string,
  ): Promise<RubricDefinitionResponseDto> {
    const row = await this.withWriteErrorMapping(() => this.repository.createRubricDefinition(dto));
    if (actorUserId) {
      await this.operationsService.logCreate('RubricDefinition', row.code, row.version, actorUserId);
    }
    return this.toRubricDefinitionDto(row);
  }

  async listRubricDefinitions(): Promise<RubricDefinitionResponseDto[]> {
    const rows = await this.repository.listRubricDefinitions();
    return rows.map((row) => this.toRubricDefinitionDto(row));
  }

  async transitionRubricDefinitionStatus(
    id: string,
    status: DefinitionStatus,
    actorUserId?: string,
    reason?: string | null,
  ): Promise<RubricDefinitionResponseDto> {
    const existing = await this.repository.findRubricDefinitionById(id);
    if (!existing) throw new NotFoundException('Rubric definition not found.');
    const update = computeStatusTransition(existing.status as DefinitionStatus, status);
    const row = await this.repository.updateRubricDefinitionStatus(id, update);
    if (actorUserId) {
      await this.operationsService.logStatusTransition(
        'RubricDefinition', row.code, row.version, actorUserId, existing.status, row.status, reason,
        );
    }
    return this.toRubricDefinitionDto(row);
  }

  async createRubricCriterion(
    rubricId: string,
    dto: CreateRubricCriterionOutput,
  ): Promise<RubricCriterionResponseDto> {
    const rubric = await this.repository.findRubricDefinitionById(rubricId);
    if (!rubric) throw new NotFoundException('Rubric definition not found.');
    const row = await this.withWriteErrorMapping(() => this.repository.createRubricCriterion(rubricId, dto));
    return this.toRubricCriterionDto(row);
  }

  async listRubricCriteria(rubricId: string): Promise<RubricCriterionResponseDto[]> {
    const rubric = await this.repository.findRubricDefinitionById(rubricId);
    if (!rubric) throw new NotFoundException('Rubric definition not found.');
    const rows = await this.repository.listRubricCriteria(rubricId);
    return rows.map((row) => this.toRubricCriterionDto(row));
  }

  // Evidence Type Definition
  async createEvidenceTypeDefinition(
    dto: CreateEvidenceTypeDefinitionOutput,
    actorUserId?: string,
  ): Promise<EvidenceTypeDefinitionResponseDto> {
    const row = await this.withWriteErrorMapping(() => this.repository.createEvidenceTypeDefinition(dto));
    if (actorUserId) {
      await this.operationsService.logCreate('EvidenceTypeDefinition', row.code, row.version, actorUserId);
    }
    return this.toEvidenceTypeDefinitionDto(row);
  }

  async listEvidenceTypeDefinitions(): Promise<EvidenceTypeDefinitionResponseDto[]> {
    const rows = await this.repository.listEvidenceTypeDefinitions();
    return rows.map((row) => this.toEvidenceTypeDefinitionDto(row));
  }

  async transitionEvidenceTypeDefinitionStatus(
    id: string,
    status: DefinitionStatus,
    actorUserId?: string,
    reason?: string | null,
  ): Promise<EvidenceTypeDefinitionResponseDto> {
    const existing = await this.repository.findEvidenceTypeDefinitionById(id);
    if (!existing) throw new NotFoundException('Evidence type definition not found.');
    const update = computeStatusTransition(existing.status as DefinitionStatus, status);
    const row = await this.repository.updateEvidenceTypeDefinitionStatus(id, update);
    if (actorUserId) {
      await this.operationsService.logStatusTransition(
        'EvidenceTypeDefinition', row.code, row.version, actorUserId, existing.status, row.status, reason,
        );
    }
    return this.toEvidenceTypeDefinitionDto(row);
  }

  // Curriculum Definition
  async createCurriculumDefinition(
    dto: CreateCurriculumDefinitionOutput,
    actorUserId?: string,
  ): Promise<CurriculumDefinitionResponseDto> {
    const row = await this.withWriteErrorMapping(() => this.repository.createCurriculumDefinition(dto));
    if (actorUserId) {
      await this.operationsService.logCreate('CurriculumDefinition', row.code, row.version, actorUserId);
    }
    return this.toCurriculumDefinitionDto(row);
  }

  async listCurriculumDefinitions(): Promise<CurriculumDefinitionResponseDto[]> {
    const rows = await this.repository.listCurriculumDefinitions();
    return rows.map((row) => this.toCurriculumDefinitionDto(row));
  }

  async transitionCurriculumDefinitionStatus(
    id: string,
    status: DefinitionStatus,
    actorUserId?: string,
    reason?: string | null,
  ): Promise<CurriculumDefinitionResponseDto> {
    const existing = await this.repository.findCurriculumDefinitionById(id);
    if (!existing) throw new NotFoundException('Curriculum definition not found.');
    const update = computeStatusTransition(existing.status as DefinitionStatus, status);
    const row = await this.repository.updateCurriculumDefinitionStatus(id, update);
    if (actorUserId) {
      await this.operationsService.logStatusTransition(
        'CurriculumDefinition', row.code, row.version, actorUserId, existing.status, row.status, reason,
        );
    }
    return this.toCurriculumDefinitionDto(row);
  }

  async addCurriculumDefinitionDomain(
    curriculumDefinitionId: string,
    dto: AddCurriculumDefinitionDomainOutput,
  ): Promise<CurriculumDefinitionDomainResponseDto> {
    await this.requireCurriculumDefinition(curriculumDefinitionId);
    const row = await this.withWriteErrorMapping(() =>
      this.repository.addCurriculumDefinitionDomain(curriculumDefinitionId, dto),
    );
    return this.toCurriculumDefinitionDomainDto(row);
  }

  async listCurriculumDefinitionDomains(
    curriculumDefinitionId: string,
  ): Promise<CurriculumDefinitionDomainResponseDto[]> {
    await this.requireCurriculumDefinition(curriculumDefinitionId);
    const rows = await this.repository.listCurriculumDefinitionDomains(curriculumDefinitionId);
    return rows.map((row) => this.toCurriculumDefinitionDomainDto(row));
  }

  async addCurriculumDefinitionCompetency(
    curriculumDefinitionId: string,
    dto: AddCurriculumDefinitionCompetencyOutput,
  ): Promise<CurriculumDefinitionCompetencyResponseDto> {
    await this.requireCurriculumDefinition(curriculumDefinitionId);
    const row = await this.withWriteErrorMapping(() =>
      this.repository.addCurriculumDefinitionCompetency(curriculumDefinitionId, dto),
    );
    return this.toCurriculumDefinitionCompetencyDto(row);
  }

  async listCurriculumDefinitionCompetencies(
    curriculumDefinitionId: string,
  ): Promise<CurriculumDefinitionCompetencyResponseDto[]> {
    await this.requireCurriculumDefinition(curriculumDefinitionId);
    const rows = await this.repository.listCurriculumDefinitionCompetencies(curriculumDefinitionId);
    return rows.map((row) => this.toCurriculumDefinitionCompetencyDto(row));
  }

  async addCurriculumDefinitionRubric(
    curriculumDefinitionId: string,
    dto: AddCurriculumDefinitionRubricOutput,
  ): Promise<CurriculumDefinitionRubricResponseDto> {
    await this.requireCurriculumDefinition(curriculumDefinitionId);
    const row = await this.withWriteErrorMapping(() =>
      this.repository.addCurriculumDefinitionRubric(curriculumDefinitionId, dto),
    );
    return this.toCurriculumDefinitionRubricDto(row);
  }

  async listCurriculumDefinitionRubrics(
    curriculumDefinitionId: string,
  ): Promise<CurriculumDefinitionRubricResponseDto[]> {
    await this.requireCurriculumDefinition(curriculumDefinitionId);
    const rows = await this.repository.listCurriculumDefinitionRubrics(curriculumDefinitionId);
    return rows.map((row) => this.toCurriculumDefinitionRubricDto(row));
  }

  async addCurriculumDefinitionActivity(
    curriculumDefinitionId: string,
    dto: AddCurriculumDefinitionActivityOutput,
  ): Promise<CurriculumDefinitionActivityResponseDto> {
    await this.requireCurriculumDefinition(curriculumDefinitionId);
    const row = await this.withWriteErrorMapping(() =>
      this.repository.addCurriculumDefinitionActivity(curriculumDefinitionId, dto),
    );
    return this.toCurriculumDefinitionActivityDto(row);
  }

  async listCurriculumDefinitionActivities(
    curriculumDefinitionId: string,
  ): Promise<CurriculumDefinitionActivityResponseDto[]> {
    await this.requireCurriculumDefinition(curriculumDefinitionId);
    const rows = await this.repository.listCurriculumDefinitionActivities(curriculumDefinitionId);
    return rows.map((row) => this.toCurriculumDefinitionActivityDto(row));
  }

  // Activity Definition
  async createActivityDefinition(
    dto: CreateActivityDefinitionOutput,
    actorUserId?: string,
  ): Promise<ActivityDefinitionResponseDto> {
    const row = await this.withWriteErrorMapping(() => this.repository.createActivityDefinition(dto));
    if (actorUserId) {
      await this.operationsService.logCreate('ActivityDefinition', row.code, row.version, actorUserId);
    }
    return this.toActivityDefinitionDto(row);
  }

  async listActivityDefinitions(): Promise<ActivityDefinitionResponseDto[]> {
    const rows = await this.repository.listActivityDefinitions();
    return rows.map((row) => this.toActivityDefinitionDto(row));
  }

  async transitionActivityDefinitionStatus(
    id: string,
    status: DefinitionStatus,
    actorUserId?: string,
    reason?: string | null,
  ): Promise<ActivityDefinitionResponseDto> {
    const existing = await this.repository.findActivityDefinitionById(id);
    if (!existing) throw new NotFoundException('Activity definition not found.');
    const update = computeStatusTransition(existing.status as DefinitionStatus, status);
    const row = await this.repository.updateActivityDefinitionStatus(id, update);
    if (actorUserId) {
      await this.operationsService.logStatusTransition(
        'ActivityDefinition', row.code, row.version, actorUserId, existing.status, row.status, reason,
        );
    }
    return this.toActivityDefinitionDto(row);
  }

  async addActivityDefinitionCompetency(
    activityId: string,
    dto: AddActivityDefinitionCompetencyOutput,
  ): Promise<ActivityDefinitionCompetencyResponseDto> {
    await this.requireActivityDefinition(activityId);
    const row = await this.withWriteErrorMapping(() =>
      this.repository.addActivityDefinitionCompetency(activityId, dto),
    );
    return this.toActivityDefinitionCompetencyDto(row);
  }

  async listActivityDefinitionCompetencies(activityId: string): Promise<ActivityDefinitionCompetencyResponseDto[]> {
    await this.requireActivityDefinition(activityId);
    const rows = await this.repository.listActivityDefinitionCompetencies(activityId);
    return rows.map((row) => this.toActivityDefinitionCompetencyDto(row));
  }

  async addActivityDefinitionEvidenceType(
    activityId: string,
    dto: AddActivityDefinitionEvidenceTypeOutput,
  ): Promise<ActivityDefinitionEvidenceTypeResponseDto> {
    await this.requireActivityDefinition(activityId);
    const row = await this.withWriteErrorMapping(() =>
      this.repository.addActivityDefinitionEvidenceType(activityId, dto),
    );
    return this.toActivityDefinitionEvidenceTypeDto(row);
  }

  async listActivityDefinitionEvidenceTypes(
    activityId: string,
  ): Promise<ActivityDefinitionEvidenceTypeResponseDto[]> {
    await this.requireActivityDefinition(activityId);
    const rows = await this.repository.listActivityDefinitionEvidenceTypes(activityId);
    return rows.map((row) => this.toActivityDefinitionEvidenceTypeDto(row));
  }

  async addCurriculumDefinitionProject(
    curriculumDefinitionId: string,
    dto: AddCurriculumDefinitionProjectOutput,
  ): Promise<CurriculumDefinitionProjectResponseDto> {
    await this.requireCurriculumDefinition(curriculumDefinitionId);
    const row = await this.withWriteErrorMapping(() =>
      this.repository.addCurriculumDefinitionProject(curriculumDefinitionId, dto),
    );
    return this.toCurriculumDefinitionProjectDto(row);
  }

  async listCurriculumDefinitionProjects(
    curriculumDefinitionId: string,
  ): Promise<CurriculumDefinitionProjectResponseDto[]> {
    await this.requireCurriculumDefinition(curriculumDefinitionId);
    const rows = await this.repository.listCurriculumDefinitionProjects(curriculumDefinitionId);
    return rows.map((row) => this.toCurriculumDefinitionProjectDto(row));
  }

  // Project Definition (issue #96 section 8): an interdisciplinary
  // project mapping multiple domains and competencies at once -- same
  // admin CRUD shape as ActivityDefinition, plus milestones.
  async createProjectDefinition(
    dto: CreateProjectDefinitionOutput,
    actorUserId?: string,
  ): Promise<ProjectDefinitionResponseDto> {
    const row = await this.withWriteErrorMapping(() => this.repository.createProjectDefinition(dto));
    if (actorUserId) {
      await this.operationsService.logCreate('ProjectDefinition', row.code, row.version, actorUserId);
    }
    return this.toProjectDefinitionDto(row);
  }

  async listProjectDefinitions(): Promise<ProjectDefinitionResponseDto[]> {
    const rows = await this.repository.listProjectDefinitions();
    return rows.map((row) => this.toProjectDefinitionDto(row));
  }

  async transitionProjectDefinitionStatus(
    id: string,
    status: DefinitionStatus,
    actorUserId?: string,
    reason?: string | null,
  ): Promise<ProjectDefinitionResponseDto> {
    const existing = await this.repository.findProjectDefinitionById(id);
    if (!existing) throw new NotFoundException('Project definition not found.');
    const update = computeStatusTransition(existing.status as DefinitionStatus, status);
    const row = await this.repository.updateProjectDefinitionStatus(id, update);
    if (actorUserId) {
      await this.operationsService.logStatusTransition(
        'ProjectDefinition', row.code, row.version, actorUserId, existing.status, row.status, reason,
        );
    }
    return this.toProjectDefinitionDto(row);
  }

  async addProjectDefinitionDomain(
    projectId: string,
    dto: AddProjectDefinitionDomainOutput,
  ): Promise<ProjectDefinitionDomainResponseDto> {
    await this.requireProjectDefinition(projectId);
    const row = await this.withWriteErrorMapping(() =>
      this.repository.addProjectDefinitionDomain(projectId, dto),
    );
    return this.toProjectDefinitionDomainDto(row);
  }

  async listProjectDefinitionDomains(projectId: string): Promise<ProjectDefinitionDomainResponseDto[]> {
    await this.requireProjectDefinition(projectId);
    const rows = await this.repository.listProjectDefinitionDomains(projectId);
    return rows.map((row) => this.toProjectDefinitionDomainDto(row));
  }

  async addProjectDefinitionCompetency(
    projectId: string,
    dto: AddProjectDefinitionCompetencyOutput,
  ): Promise<ProjectDefinitionCompetencyResponseDto> {
    await this.requireProjectDefinition(projectId);
    const row = await this.withWriteErrorMapping(() =>
      this.repository.addProjectDefinitionCompetency(projectId, dto),
    );
    return this.toProjectDefinitionCompetencyDto(row);
  }

  async listProjectDefinitionCompetencies(
    projectId: string,
  ): Promise<ProjectDefinitionCompetencyResponseDto[]> {
    await this.requireProjectDefinition(projectId);
    const rows = await this.repository.listProjectDefinitionCompetencies(projectId);
    return rows.map((row) => this.toProjectDefinitionCompetencyDto(row));
  }

  async addProjectDefinitionMilestone(
    projectId: string,
    dto: AddProjectDefinitionMilestoneOutput,
  ): Promise<ProjectDefinitionMilestoneResponseDto> {
    await this.requireProjectDefinition(projectId);
    const row = await this.withWriteErrorMapping(() =>
      this.repository.addProjectDefinitionMilestone(projectId, dto),
    );
    return this.toProjectDefinitionMilestoneDto(row);
  }

  async listProjectDefinitionMilestones(projectId: string): Promise<ProjectDefinitionMilestoneResponseDto[]> {
    await this.requireProjectDefinition(projectId);
    const rows = await this.repository.listProjectDefinitionMilestones(projectId);
    return rows.map((row) => this.toProjectDefinitionMilestoneDto(row));
  }

  // Theological Tradition Definition
  async createTheologicalTraditionDefinition(
    dto: CreateTheologicalTraditionDefinitionOutput,
    actorUserId?: string,
  ): Promise<TheologicalTraditionDefinitionResponseDto> {
    const row = await this.withWriteErrorMapping(() =>
      this.repository.createTheologicalTraditionDefinition(dto),
    );
    if (actorUserId) {
      await this.operationsService.logCreate('TheologicalTraditionDefinition', row.code, row.version, actorUserId);
    }
    return this.toTheologicalTraditionDefinitionDto(row);
  }

  async listTheologicalTraditionDefinitions(): Promise<TheologicalTraditionDefinitionResponseDto[]> {
    const rows = await this.repository.listTheologicalTraditionDefinitions();
    return rows.map((row) => this.toTheologicalTraditionDefinitionDto(row));
  }

  async transitionTheologicalTraditionDefinitionStatus(
    id: string,
    status: DefinitionStatus,
    actorUserId?: string,
    reason?: string | null,
  ): Promise<TheologicalTraditionDefinitionResponseDto> {
    const existing = await this.repository.findTheologicalTraditionDefinitionById(id);
    if (!existing) throw new NotFoundException('Theological tradition definition not found.');
    const update = computeStatusTransition(existing.status as DefinitionStatus, status);
    const row = await this.repository.updateTheologicalTraditionDefinitionStatus(id, update);
    if (actorUserId) {
      await this.operationsService.logStatusTransition(
        'TheologicalTraditionDefinition', row.code, row.version, actorUserId, existing.status, row.status, reason,
        );
    }
    return this.toTheologicalTraditionDefinitionDto(row);
  }

  // Theological Position Definition
  async createTheologicalPositionDefinition(
    dto: CreateTheologicalPositionDefinitionOutput,
    actorUserId?: string,
  ): Promise<TheologicalPositionDefinitionResponseDto> {
    const row = await this.withWriteErrorMapping(() =>
      this.repository.createTheologicalPositionDefinition(dto),
    );
    if (actorUserId) {
      await this.operationsService.logCreate('TheologicalPositionDefinition', row.code, row.version, actorUserId);
    }
    return this.toTheologicalPositionDefinitionDto(row);
  }

  async listTheologicalPositionDefinitions(): Promise<TheologicalPositionDefinitionResponseDto[]> {
    const rows = await this.repository.listTheologicalPositionDefinitions();
    return rows.map((row) => this.toTheologicalPositionDefinitionDto(row));
  }

  async transitionTheologicalPositionDefinitionStatus(
    id: string,
    status: DefinitionStatus,
    actorUserId?: string,
    reason?: string | null,
  ): Promise<TheologicalPositionDefinitionResponseDto> {
    const existing = await this.repository.findTheologicalPositionDefinitionById(id);
    if (!existing) throw new NotFoundException('Theological position definition not found.');
    const update = computeStatusTransition(existing.status as DefinitionStatus, status);
    const row = await this.repository.updateTheologicalPositionDefinitionStatus(id, update);
    if (actorUserId) {
      await this.operationsService.logStatusTransition(
        'TheologicalPositionDefinition', row.code, row.version, actorUserId, existing.status, row.status, reason,
        );
    }
    return this.toTheologicalPositionDefinitionDto(row);
  }

  // Progression Policy
  async createProgressionPolicy(
    dto: CreateProgressionPolicyOutput,
    actorUserId?: string,
  ): Promise<ProgressionPolicyResponseDto> {
    const row = await this.withWriteErrorMapping(() => this.repository.createProgressionPolicy(dto));
    if (actorUserId) {
      await this.operationsService.logCreate('ProgressionPolicy', row.code, row.version, actorUserId);
    }
    return this.toProgressionPolicyDto(row);
  }

  async listProgressionPolicies(): Promise<ProgressionPolicyResponseDto[]> {
    const rows = await this.repository.listProgressionPolicies();
    return rows.map((row) => this.toProgressionPolicyDto(row));
  }

  async transitionProgressionPolicyStatus(
    id: string,
    status: DefinitionStatus,
    actorUserId?: string,
    reason?: string | null,
  ): Promise<ProgressionPolicyResponseDto> {
    const existing = await this.repository.findProgressionPolicyById(id);
    if (!existing) throw new NotFoundException('Progression policy not found.');
    const update = computeStatusTransition(existing.status as DefinitionStatus, status);
    const row = await this.repository.updateProgressionPolicyStatus(id, update);
    if (actorUserId) {
      await this.operationsService.logStatusTransition(
        'ProgressionPolicy', row.code, row.version, actorUserId, existing.status, row.status, reason,
        );
    }
    return this.toProgressionPolicyDto(row);
  }

  // Bible Translation Definition
  async createBibleTranslationDefinition(
    dto: CreateBibleTranslationDefinitionOutput,
    actorUserId?: string,
  ): Promise<BibleTranslationDefinitionResponseDto> {
    const row = await this.withWriteErrorMapping(() => this.repository.createBibleTranslationDefinition(dto));
    if (actorUserId) {
      await this.operationsService.logCreate('BibleTranslationDefinition', row.code, row.version, actorUserId);
    }
    return this.toBibleTranslationDefinitionDto(row);
  }

  async listBibleTranslationDefinitions(): Promise<BibleTranslationDefinitionResponseDto[]> {
    const rows = await this.repository.listBibleTranslationDefinitions();
    return rows.map((row) => this.toBibleTranslationDefinitionDto(row));
  }

  async transitionBibleTranslationDefinitionStatus(
    id: string,
    status: DefinitionStatus,
    actorUserId?: string,
    reason?: string | null,
  ): Promise<BibleTranslationDefinitionResponseDto> {
    const existing = await this.repository.findBibleTranslationDefinitionById(id);
    if (!existing) throw new NotFoundException('Bible translation definition not found.');
    const update = computeStatusTransition(existing.status as DefinitionStatus, status);
    const row = await this.repository.updateBibleTranslationDefinitionStatus(id, update);
    if (actorUserId) {
      await this.operationsService.logStatusTransition(
        'BibleTranslationDefinition', row.code, row.version, actorUserId, existing.status, row.status, reason,
        );
    }
    return this.toBibleTranslationDefinitionDto(row);
  }

  // Helpers
  private async requireCurriculumDefinition(id: string): Promise<void> {
    const existing = await this.repository.findCurriculumDefinitionById(id);
    if (!existing) throw new NotFoundException('Curriculum definition not found.');
  }

  private async requireActivityDefinition(id: string): Promise<void> {
    const existing = await this.repository.findActivityDefinitionById(id);
    if (!existing) throw new NotFoundException('Activity definition not found.');
  }

  private async requireProjectDefinition(id: string): Promise<void> {
    const existing = await this.repository.findProjectDefinitionById(id);
    if (!existing) throw new NotFoundException('Project definition not found.');
  }

  // Join-table and cross-referencing writes can fail on a missing FK
  // (P2003 -- the referenced row doesn't exist) or a duplicate link
  // (P2002 -- unique constraint), both caller mistakes rather than server
  // errors. Every other Prisma error is left to propagate as a 500.
  private async withWriteErrorMapping<T>(write: () => Promise<T>): Promise<T> {
    try {
      return await write();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException('One or more referenced definitions do not exist.');
        }
        if (error.code === 'P2002') {
          throw new BadRequestException('This definition or link already exists.');
        }
      }
      throw error;
    }
  }

  // Mappers
  private toLearningDomainDto(row: LearningDomain): LearningDomainResponseDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      status: row.status as DefinitionStatus,
      schemaVersion: row.schemaVersion,
      name: row.name,
      description: row.description,
      parentId: row.parentId,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
    };
  }

  private toCompetencyDefinitionDto(row: CompetencyDefinition): CompetencyDefinitionResponseDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      status: row.status as DefinitionStatus,
      schemaVersion: row.schemaVersion,
      domainId: row.domainId,
      pathId: row.pathId,
      title: row.title,
      level: row.level,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
    };
  }

  private toPedagogicalModelDefinitionDto(row: PedagogicalModelDefinition): PedagogicalModelDefinitionResponseDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      status: row.status as DefinitionStatus,
      schemaVersion: row.schemaVersion,
      name: row.name,
      description: row.description,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
    };
  }

  private toLearningPathDto(row: LearningPath): LearningPathResponseDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      status: row.status as DefinitionStatus,
      schemaVersion: row.schemaVersion,
      domainId: row.domainId,
      name: row.name,
      description: row.description,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
    };
  }

  private toSkillDefinitionDto(row: SkillDefinition): SkillDefinitionResponseDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      status: row.status as DefinitionStatus,
      schemaVersion: row.schemaVersion,
      competencyId: row.competencyId,
      title: row.title,
      order: row.order,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
    };
  }

  private toRubricDefinitionDto(row: RubricDefinition): RubricDefinitionResponseDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      status: row.status as DefinitionStatus,
      schemaVersion: row.schemaVersion,
      competencyId: row.competencyId,
      name: row.name,
      description: row.description,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
    };
  }

  private toRubricCriterionDto(row: RubricCriterion): RubricCriterionResponseDto {
    return {
      id: row.id,
      rubricId: row.rubricId,
      code: row.code,
      label: row.label,
      weight: row.weight,
      order: row.order,
      scaleMin: row.scaleMin,
      scaleMax: row.scaleMax,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toEvidenceTypeDefinitionDto(row: EvidenceTypeDefinition): EvidenceTypeDefinitionResponseDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      status: row.status as DefinitionStatus,
      schemaVersion: row.schemaVersion,
      name: row.name,
      description: row.description,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
    };
  }

  private toCurriculumDefinitionDto(row: CurriculumDefinition): CurriculumDefinitionResponseDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      status: row.status as DefinitionStatus,
      schemaVersion: row.schemaVersion,
      name: row.name,
      description: row.description,
      pedagogicalModelDefinitionId: row.pedagogicalModelDefinitionId,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
    };
  }

  private toCurriculumDefinitionDomainDto(row: CurriculumDefinitionDomain): CurriculumDefinitionDomainResponseDto {
    return {
      id: row.id,
      curriculumDefinitionId: row.curriculumDefinitionId,
      domainId: row.domainId,
      required: row.required,
      order: row.order,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toCurriculumDefinitionCompetencyDto(
    row: CurriculumDefinitionCompetency,
  ): CurriculumDefinitionCompetencyResponseDto {
    return {
      id: row.id,
      curriculumDefinitionId: row.curriculumDefinitionId,
      competencyId: row.competencyId,
      required: row.required,
      order: row.order,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toCurriculumDefinitionRubricDto(row: CurriculumDefinitionRubric): CurriculumDefinitionRubricResponseDto {
    return {
      id: row.id,
      curriculumDefinitionId: row.curriculumDefinitionId,
      rubricId: row.rubricId,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toCurriculumDefinitionProjectDto(
    row: CurriculumDefinitionProject,
  ): CurriculumDefinitionProjectResponseDto {
    return {
      id: row.id,
      curriculumDefinitionId: row.curriculumDefinitionId,
      projectId: row.projectId,
      required: row.required,
      order: row.order,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toProjectDefinitionDto(row: ProjectDefinition): ProjectDefinitionResponseDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      status: row.status as DefinitionStatus,
      schemaVersion: row.schemaVersion,
      name: row.name,
      description: row.description,
      estimatedDurationDays: row.estimatedDurationDays,
      rubricDefinitionId: row.rubricDefinitionId,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
    };
  }

  private toProjectDefinitionDomainDto(row: ProjectDefinitionDomain): ProjectDefinitionDomainResponseDto {
    return {
      id: row.id,
      projectId: row.projectId,
      domainId: row.domainId,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toProjectDefinitionCompetencyDto(
    row: ProjectDefinitionCompetency,
  ): ProjectDefinitionCompetencyResponseDto {
    return {
      id: row.id,
      projectId: row.projectId,
      competencyId: row.competencyId,
      required: row.required,
      order: row.order,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toProjectDefinitionMilestoneDto(
    row: ProjectDefinitionMilestone,
  ): ProjectDefinitionMilestoneResponseDto {
    return {
      id: row.id,
      projectId: row.projectId,
      code: row.code,
      title: row.title,
      description: row.description,
      order: row.order,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toCurriculumDefinitionActivityDto(
    row: CurriculumDefinitionActivity,
  ): CurriculumDefinitionActivityResponseDto {
    return {
      id: row.id,
      curriculumDefinitionId: row.curriculumDefinitionId,
      activityId: row.activityId,
      required: row.required,
      order: row.order,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toActivityDefinitionDto(row: ActivityDefinition): ActivityDefinitionResponseDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      status: row.status as DefinitionStatus,
      schemaVersion: row.schemaVersion,
      name: row.name,
      description: row.description,
      ageMin: row.ageMin,
      ageMax: row.ageMax,
      estimatedDurationMinutes: row.estimatedDurationMinutes,
      supervisionRequired: row.supervisionRequired,
      riskLevel: row.riskLevel,
      evidenceRequirementMode: row.evidenceRequirementMode as ActivityDefinitionResponseDto['evidenceRequirementMode'],
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
    };
  }

  private toActivityDefinitionCompetencyDto(
    row: ActivityDefinitionCompetency,
  ): ActivityDefinitionCompetencyResponseDto {
    return {
      id: row.id,
      activityId: row.activityId,
      competencyId: row.competencyId,
      required: row.required,
      order: row.order,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toActivityDefinitionEvidenceTypeDto(
    row: ActivityDefinitionEvidenceType,
  ): ActivityDefinitionEvidenceTypeResponseDto {
    return {
      id: row.id,
      activityId: row.activityId,
      evidenceTypeId: row.evidenceTypeId,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toTheologicalTraditionDefinitionDto(
    row: TheologicalTraditionDefinition,
  ): TheologicalTraditionDefinitionResponseDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      status: row.status as DefinitionStatus,
      schemaVersion: row.schemaVersion,
      name: row.name,
      description: row.description,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
    };
  }

  private toTheologicalPositionDefinitionDto(
    row: TheologicalPositionDefinition,
  ): TheologicalPositionDefinitionResponseDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      status: row.status as DefinitionStatus,
      schemaVersion: row.schemaVersion,
      traditionId: row.traditionId,
      topic: row.topic,
      name: row.name,
      description: row.description,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
    };
  }

  private toProgressionPolicyDto(row: ProgressionPolicy): ProgressionPolicyResponseDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      status: row.status as DefinitionStatus,
      schemaVersion: row.schemaVersion,
      name: row.name,
      description: row.description,
      policyType: row.policyType,
      rules: row.rules as Record<string, unknown>,
      competencyDefinitionId: row.competencyDefinitionId,
      curriculumDefinitionId: row.curriculumDefinitionId,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
    };
  }

  private toBibleTranslationDefinitionDto(row: BibleTranslationDefinition): BibleTranslationDefinitionResponseDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      status: row.status as DefinitionStatus,
      schemaVersion: row.schemaVersion,
      name: row.name,
      language: row.language,
      youVersionId: row.youVersionId,
      translationPhilosophy: row.translationPhilosophy,
      publisher: row.publisher,
      licensingNotes: row.licensingNotes,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
    };
  }
}
