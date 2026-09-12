import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createLearningDomainSchema,
  createCompetencyDefinitionSchema,
  createPedagogicalModelDefinitionSchema,
  createLearningPathSchema,
  createSkillDefinitionSchema,
  createRubricDefinitionSchema,
  createRubricCriterionSchema,
  createEvidenceTypeDefinitionSchema,
  createCurriculumDefinitionSchema,
  addCurriculumDefinitionDomainSchema,
  addCurriculumDefinitionCompetencySchema,
  addCurriculumDefinitionRubricSchema,
  addCurriculumDefinitionActivitySchema,
  createActivityDefinitionSchema,
  addActivityDefinitionCompetencySchema,
  addActivityDefinitionEvidenceTypeSchema,
  createTheologicalTraditionDefinitionSchema,
  createTheologicalPositionDefinitionSchema,
  createProgressionPolicySchema,
  createBibleTranslationDefinitionSchema,
  transitionDefinitionStatusSchema,
  type CreateLearningDomainOutput,
  type LearningDomainResponseDto,
  type CreateCompetencyDefinitionOutput,
  type CompetencyDefinitionResponseDto,
  type CreatePedagogicalModelDefinitionOutput,
  type PedagogicalModelDefinitionResponseDto,
  type CreateLearningPathOutput,
  type LearningPathResponseDto,
  type CreateSkillDefinitionOutput,
  type SkillDefinitionResponseDto,
  type CreateRubricDefinitionOutput,
  type RubricDefinitionResponseDto,
  type CreateRubricCriterionOutput,
  type RubricCriterionResponseDto,
  type CreateEvidenceTypeDefinitionOutput,
  type EvidenceTypeDefinitionResponseDto,
  type CreateCurriculumDefinitionOutput,
  type CurriculumDefinitionResponseDto,
  type AddCurriculumDefinitionDomainOutput,
  type CurriculumDefinitionDomainResponseDto,
  type AddCurriculumDefinitionCompetencyOutput,
  type CurriculumDefinitionCompetencyResponseDto,
  type AddCurriculumDefinitionRubricOutput,
  type CurriculumDefinitionRubricResponseDto,
  type AddCurriculumDefinitionActivityOutput,
  type CurriculumDefinitionActivityResponseDto,
  type CreateActivityDefinitionOutput,
  type ActivityDefinitionResponseDto,
  type AddActivityDefinitionCompetencyOutput,
  type ActivityDefinitionCompetencyResponseDto,
  type AddActivityDefinitionEvidenceTypeOutput,
  type ActivityDefinitionEvidenceTypeResponseDto,
  type CreateTheologicalTraditionDefinitionOutput,
  type TheologicalTraditionDefinitionResponseDto,
  type CreateTheologicalPositionDefinitionOutput,
  type TheologicalPositionDefinitionResponseDto,
  type CreateProgressionPolicyOutput,
  type ProgressionPolicyResponseDto,
  type CreateBibleTranslationDefinitionOutput,
  type BibleTranslationDefinitionResponseDto,
  type TransitionDefinitionStatusDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, PlatformAdminGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { DefinitionsService } from '../application/definitions.service.js';

// Admin CRUD surface for the data-driven curriculum foundation (issue #96
// Fase 0). Platform-wide, not family-scoped -- gated by the real
// platform-admin role (issue #101, User.isPlatformAdmin), checked via
// PlatformAdminGuard. This replaces the temporary GuardianOnlyGuard PR
// #100 used as a stopgap ("is this user a guardian of any family").
//
// Nothing here is read by any learner-facing request path yet.
@ApiTags('Curriculum Definitions (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Controller({ path: 'admin/curriculum-definitions', version: '1' })
export class DefinitionsController {
  constructor(private readonly definitionsService: DefinitionsService) {}

  // Learning Domains
  @Post('learning-domains')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a learning domain definition' })
  async createLearningDomain(
    @Body(new ZodValidationPipe(createLearningDomainSchema)) dto: CreateLearningDomainOutput,
  ): Promise<LearningDomainResponseDto> {
    return this.definitionsService.createLearningDomain(dto);
  }

  @Get('learning-domains')
  @ApiOperation({ summary: 'List learning domain definitions' })
  async listLearningDomains(): Promise<LearningDomainResponseDto[]> {
    return this.definitionsService.listLearningDomains();
  }

  @Patch('learning-domains/:id/status')
  @ApiOperation({ summary: 'Transition a learning domain definition status' })
  async transitionLearningDomainStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionDefinitionStatusSchema)) dto: TransitionDefinitionStatusDto,
  ): Promise<LearningDomainResponseDto> {
    return this.definitionsService.transitionLearningDomainStatus(id, dto.status);
  }

  // Competency Definitions
  @Post('competency-definitions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a competency definition' })
  async createCompetencyDefinition(
    @Body(new ZodValidationPipe(createCompetencyDefinitionSchema)) dto: CreateCompetencyDefinitionOutput,
  ): Promise<CompetencyDefinitionResponseDto> {
    return this.definitionsService.createCompetencyDefinition(dto);
  }

  @Get('competency-definitions')
  @ApiOperation({ summary: 'List competency definitions' })
  async listCompetencyDefinitions(): Promise<CompetencyDefinitionResponseDto[]> {
    return this.definitionsService.listCompetencyDefinitions();
  }

  @Patch('competency-definitions/:id/status')
  @ApiOperation({ summary: 'Transition a competency definition status' })
  async transitionCompetencyDefinitionStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionDefinitionStatusSchema)) dto: TransitionDefinitionStatusDto,
  ): Promise<CompetencyDefinitionResponseDto> {
    return this.definitionsService.transitionCompetencyDefinitionStatus(id, dto.status);
  }

  // Pedagogical Model Definitions
  @Post('pedagogical-model-definitions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a pedagogical model definition' })
  async createPedagogicalModelDefinition(
    @Body(new ZodValidationPipe(createPedagogicalModelDefinitionSchema)) dto: CreatePedagogicalModelDefinitionOutput,
  ): Promise<PedagogicalModelDefinitionResponseDto> {
    return this.definitionsService.createPedagogicalModelDefinition(dto);
  }

  @Get('pedagogical-model-definitions')
  @ApiOperation({ summary: 'List pedagogical model definitions' })
  async listPedagogicalModelDefinitions(): Promise<PedagogicalModelDefinitionResponseDto[]> {
    return this.definitionsService.listPedagogicalModelDefinitions();
  }

  @Patch('pedagogical-model-definitions/:id/status')
  @ApiOperation({ summary: 'Transition a pedagogical model definition status' })
  async transitionPedagogicalModelDefinitionStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionDefinitionStatusSchema)) dto: TransitionDefinitionStatusDto,
  ): Promise<PedagogicalModelDefinitionResponseDto> {
    return this.definitionsService.transitionPedagogicalModelDefinitionStatus(id, dto.status);
  }

  // Learning Paths
  @Post('learning-paths')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a learning path definition' })
  async createLearningPath(
    @Body(new ZodValidationPipe(createLearningPathSchema)) dto: CreateLearningPathOutput,
  ): Promise<LearningPathResponseDto> {
    return this.definitionsService.createLearningPath(dto);
  }

  @Get('learning-paths')
  @ApiOperation({ summary: 'List learning path definitions' })
  async listLearningPaths(): Promise<LearningPathResponseDto[]> {
    return this.definitionsService.listLearningPaths();
  }

  @Patch('learning-paths/:id/status')
  @ApiOperation({ summary: 'Transition a learning path definition status' })
  async transitionLearningPathStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionDefinitionStatusSchema)) dto: TransitionDefinitionStatusDto,
  ): Promise<LearningPathResponseDto> {
    return this.definitionsService.transitionLearningPathStatus(id, dto.status);
  }

  // Skill Definitions
  @Post('skill-definitions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a skill definition' })
  async createSkillDefinition(
    @Body(new ZodValidationPipe(createSkillDefinitionSchema)) dto: CreateSkillDefinitionOutput,
  ): Promise<SkillDefinitionResponseDto> {
    return this.definitionsService.createSkillDefinition(dto);
  }

  @Get('skill-definitions')
  @ApiOperation({ summary: 'List skill definitions' })
  async listSkillDefinitions(): Promise<SkillDefinitionResponseDto[]> {
    return this.definitionsService.listSkillDefinitions();
  }

  @Patch('skill-definitions/:id/status')
  @ApiOperation({ summary: 'Transition a skill definition status' })
  async transitionSkillDefinitionStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionDefinitionStatusSchema)) dto: TransitionDefinitionStatusDto,
  ): Promise<SkillDefinitionResponseDto> {
    return this.definitionsService.transitionSkillDefinitionStatus(id, dto.status);
  }

  // Rubric Definitions
  @Post('rubric-definitions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a rubric definition' })
  async createRubricDefinition(
    @Body(new ZodValidationPipe(createRubricDefinitionSchema)) dto: CreateRubricDefinitionOutput,
  ): Promise<RubricDefinitionResponseDto> {
    return this.definitionsService.createRubricDefinition(dto);
  }

  @Get('rubric-definitions')
  @ApiOperation({ summary: 'List rubric definitions' })
  async listRubricDefinitions(): Promise<RubricDefinitionResponseDto[]> {
    return this.definitionsService.listRubricDefinitions();
  }

  @Patch('rubric-definitions/:id/status')
  @ApiOperation({ summary: 'Transition a rubric definition status' })
  async transitionRubricDefinitionStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionDefinitionStatusSchema)) dto: TransitionDefinitionStatusDto,
  ): Promise<RubricDefinitionResponseDto> {
    return this.definitionsService.transitionRubricDefinitionStatus(id, dto.status);
  }

  @Post('rubric-definitions/:rubricId/criteria')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a criterion to a rubric definition' })
  async createRubricCriterion(
    @Param('rubricId') rubricId: string,
    @Body(new ZodValidationPipe(createRubricCriterionSchema)) dto: CreateRubricCriterionOutput,
  ): Promise<RubricCriterionResponseDto> {
    return this.definitionsService.createRubricCriterion(rubricId, dto);
  }

  @Get('rubric-definitions/:rubricId/criteria')
  @ApiOperation({ summary: 'List criteria for a rubric definition' })
  async listRubricCriteria(@Param('rubricId') rubricId: string): Promise<RubricCriterionResponseDto[]> {
    return this.definitionsService.listRubricCriteria(rubricId);
  }

  // Evidence Type Definitions
  @Post('evidence-type-definitions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an evidence type definition' })
  async createEvidenceTypeDefinition(
    @Body(new ZodValidationPipe(createEvidenceTypeDefinitionSchema)) dto: CreateEvidenceTypeDefinitionOutput,
  ): Promise<EvidenceTypeDefinitionResponseDto> {
    return this.definitionsService.createEvidenceTypeDefinition(dto);
  }

  @Get('evidence-type-definitions')
  @ApiOperation({ summary: 'List evidence type definitions' })
  async listEvidenceTypeDefinitions(): Promise<EvidenceTypeDefinitionResponseDto[]> {
    return this.definitionsService.listEvidenceTypeDefinitions();
  }

  @Patch('evidence-type-definitions/:id/status')
  @ApiOperation({ summary: 'Transition an evidence type definition status' })
  async transitionEvidenceTypeDefinitionStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionDefinitionStatusSchema)) dto: TransitionDefinitionStatusDto,
  ): Promise<EvidenceTypeDefinitionResponseDto> {
    return this.definitionsService.transitionEvidenceTypeDefinitionStatus(id, dto.status);
  }

  // Curriculum Definitions
  @Post('curriculum-definitions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a curriculum definition' })
  async createCurriculumDefinition(
    @Body(new ZodValidationPipe(createCurriculumDefinitionSchema)) dto: CreateCurriculumDefinitionOutput,
  ): Promise<CurriculumDefinitionResponseDto> {
    return this.definitionsService.createCurriculumDefinition(dto);
  }

  @Get('curriculum-definitions')
  @ApiOperation({ summary: 'List curriculum definitions' })
  async listCurriculumDefinitions(): Promise<CurriculumDefinitionResponseDto[]> {
    return this.definitionsService.listCurriculumDefinitions();
  }

  @Patch('curriculum-definitions/:id/status')
  @ApiOperation({ summary: 'Transition a curriculum definition status' })
  async transitionCurriculumDefinitionStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionDefinitionStatusSchema)) dto: TransitionDefinitionStatusDto,
  ): Promise<CurriculumDefinitionResponseDto> {
    return this.definitionsService.transitionCurriculumDefinitionStatus(id, dto.status);
  }

  @Post('curriculum-definitions/:curriculumId/domains')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Link a learning domain to a curriculum definition' })
  async addCurriculumDefinitionDomain(
    @Param('curriculumId') curriculumId: string,
    @Body(new ZodValidationPipe(addCurriculumDefinitionDomainSchema)) dto: AddCurriculumDefinitionDomainOutput,
  ): Promise<CurriculumDefinitionDomainResponseDto> {
    return this.definitionsService.addCurriculumDefinitionDomain(curriculumId, dto);
  }

  @Get('curriculum-definitions/:curriculumId/domains')
  @ApiOperation({ summary: 'List learning domains linked to a curriculum definition' })
  async listCurriculumDefinitionDomains(
    @Param('curriculumId') curriculumId: string,
  ): Promise<CurriculumDefinitionDomainResponseDto[]> {
    return this.definitionsService.listCurriculumDefinitionDomains(curriculumId);
  }

  @Post('curriculum-definitions/:curriculumId/competencies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Link a competency definition to a curriculum definition' })
  async addCurriculumDefinitionCompetency(
    @Param('curriculumId') curriculumId: string,
    @Body(new ZodValidationPipe(addCurriculumDefinitionCompetencySchema))
    dto: AddCurriculumDefinitionCompetencyOutput,
  ): Promise<CurriculumDefinitionCompetencyResponseDto> {
    return this.definitionsService.addCurriculumDefinitionCompetency(curriculumId, dto);
  }

  @Get('curriculum-definitions/:curriculumId/competencies')
  @ApiOperation({ summary: 'List competency definitions linked to a curriculum definition' })
  async listCurriculumDefinitionCompetencies(
    @Param('curriculumId') curriculumId: string,
  ): Promise<CurriculumDefinitionCompetencyResponseDto[]> {
    return this.definitionsService.listCurriculumDefinitionCompetencies(curriculumId);
  }

  @Post('curriculum-definitions/:curriculumId/rubrics')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Link a rubric definition to a curriculum definition' })
  async addCurriculumDefinitionRubric(
    @Param('curriculumId') curriculumId: string,
    @Body(new ZodValidationPipe(addCurriculumDefinitionRubricSchema)) dto: AddCurriculumDefinitionRubricOutput,
  ): Promise<CurriculumDefinitionRubricResponseDto> {
    return this.definitionsService.addCurriculumDefinitionRubric(curriculumId, dto);
  }

  @Get('curriculum-definitions/:curriculumId/rubrics')
  @ApiOperation({ summary: 'List rubric definitions linked to a curriculum definition' })
  async listCurriculumDefinitionRubrics(
    @Param('curriculumId') curriculumId: string,
  ): Promise<CurriculumDefinitionRubricResponseDto[]> {
    return this.definitionsService.listCurriculumDefinitionRubrics(curriculumId);
  }

  @Post('curriculum-definitions/:curriculumId/activities')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Link an activity definition to a curriculum definition' })
  async addCurriculumDefinitionActivity(
    @Param('curriculumId') curriculumId: string,
    @Body(new ZodValidationPipe(addCurriculumDefinitionActivitySchema)) dto: AddCurriculumDefinitionActivityOutput,
  ): Promise<CurriculumDefinitionActivityResponseDto> {
    return this.definitionsService.addCurriculumDefinitionActivity(curriculumId, dto);
  }

  @Get('curriculum-definitions/:curriculumId/activities')
  @ApiOperation({ summary: 'List activity definitions linked to a curriculum definition' })
  async listCurriculumDefinitionActivities(
    @Param('curriculumId') curriculumId: string,
  ): Promise<CurriculumDefinitionActivityResponseDto[]> {
    return this.definitionsService.listCurriculumDefinitionActivities(curriculumId);
  }

  // Activity Definitions
  @Post('activity-definitions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an activity definition' })
  async createActivityDefinition(
    @Body(new ZodValidationPipe(createActivityDefinitionSchema)) dto: CreateActivityDefinitionOutput,
  ): Promise<ActivityDefinitionResponseDto> {
    return this.definitionsService.createActivityDefinition(dto);
  }

  @Get('activity-definitions')
  @ApiOperation({ summary: 'List activity definitions' })
  async listActivityDefinitions(): Promise<ActivityDefinitionResponseDto[]> {
    return this.definitionsService.listActivityDefinitions();
  }

  @Patch('activity-definitions/:id/status')
  @ApiOperation({ summary: 'Transition an activity definition status' })
  async transitionActivityDefinitionStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionDefinitionStatusSchema)) dto: TransitionDefinitionStatusDto,
  ): Promise<ActivityDefinitionResponseDto> {
    return this.definitionsService.transitionActivityDefinitionStatus(id, dto.status);
  }

  @Post('activity-definitions/:activityId/competencies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Link a competency definition to an activity definition' })
  async addActivityDefinitionCompetency(
    @Param('activityId') activityId: string,
    @Body(new ZodValidationPipe(addActivityDefinitionCompetencySchema)) dto: AddActivityDefinitionCompetencyOutput,
  ): Promise<ActivityDefinitionCompetencyResponseDto> {
    return this.definitionsService.addActivityDefinitionCompetency(activityId, dto);
  }

  @Get('activity-definitions/:activityId/competencies')
  @ApiOperation({ summary: 'List competency definitions linked to an activity definition' })
  async listActivityDefinitionCompetencies(
    @Param('activityId') activityId: string,
  ): Promise<ActivityDefinitionCompetencyResponseDto[]> {
    return this.definitionsService.listActivityDefinitionCompetencies(activityId);
  }

  @Post('activity-definitions/:activityId/evidence-types')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Link an evidence type definition to an activity definition' })
  async addActivityDefinitionEvidenceType(
    @Param('activityId') activityId: string,
    @Body(new ZodValidationPipe(addActivityDefinitionEvidenceTypeSchema))
    dto: AddActivityDefinitionEvidenceTypeOutput,
  ): Promise<ActivityDefinitionEvidenceTypeResponseDto> {
    return this.definitionsService.addActivityDefinitionEvidenceType(activityId, dto);
  }

  @Get('activity-definitions/:activityId/evidence-types')
  @ApiOperation({ summary: 'List evidence type definitions linked to an activity definition' })
  async listActivityDefinitionEvidenceTypes(
    @Param('activityId') activityId: string,
  ): Promise<ActivityDefinitionEvidenceTypeResponseDto[]> {
    return this.definitionsService.listActivityDefinitionEvidenceTypes(activityId);
  }

  // Theological Tradition Definitions
  @Post('theological-tradition-definitions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a theological tradition definition' })
  async createTheologicalTraditionDefinition(
    @Body(new ZodValidationPipe(createTheologicalTraditionDefinitionSchema))
    dto: CreateTheologicalTraditionDefinitionOutput,
  ): Promise<TheologicalTraditionDefinitionResponseDto> {
    return this.definitionsService.createTheologicalTraditionDefinition(dto);
  }

  @Get('theological-tradition-definitions')
  @ApiOperation({ summary: 'List theological tradition definitions' })
  async listTheologicalTraditionDefinitions(): Promise<TheologicalTraditionDefinitionResponseDto[]> {
    return this.definitionsService.listTheologicalTraditionDefinitions();
  }

  @Patch('theological-tradition-definitions/:id/status')
  @ApiOperation({ summary: 'Transition a theological tradition definition status' })
  async transitionTheologicalTraditionDefinitionStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionDefinitionStatusSchema)) dto: TransitionDefinitionStatusDto,
  ): Promise<TheologicalTraditionDefinitionResponseDto> {
    return this.definitionsService.transitionTheologicalTraditionDefinitionStatus(id, dto.status);
  }

  // Theological Position Definitions
  @Post('theological-position-definitions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a theological position definition' })
  async createTheologicalPositionDefinition(
    @Body(new ZodValidationPipe(createTheologicalPositionDefinitionSchema))
    dto: CreateTheologicalPositionDefinitionOutput,
  ): Promise<TheologicalPositionDefinitionResponseDto> {
    return this.definitionsService.createTheologicalPositionDefinition(dto);
  }

  @Get('theological-position-definitions')
  @ApiOperation({ summary: 'List theological position definitions' })
  async listTheologicalPositionDefinitions(): Promise<TheologicalPositionDefinitionResponseDto[]> {
    return this.definitionsService.listTheologicalPositionDefinitions();
  }

  @Patch('theological-position-definitions/:id/status')
  @ApiOperation({ summary: 'Transition a theological position definition status' })
  async transitionTheologicalPositionDefinitionStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionDefinitionStatusSchema)) dto: TransitionDefinitionStatusDto,
  ): Promise<TheologicalPositionDefinitionResponseDto> {
    return this.definitionsService.transitionTheologicalPositionDefinitionStatus(id, dto.status);
  }

  // Progression Policies
  @Post('progression-policies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a progression policy' })
  async createProgressionPolicy(
    @Body(new ZodValidationPipe(createProgressionPolicySchema)) dto: CreateProgressionPolicyOutput,
  ): Promise<ProgressionPolicyResponseDto> {
    return this.definitionsService.createProgressionPolicy(dto);
  }

  @Get('progression-policies')
  @ApiOperation({ summary: 'List progression policies' })
  async listProgressionPolicies(): Promise<ProgressionPolicyResponseDto[]> {
    return this.definitionsService.listProgressionPolicies();
  }

  @Patch('progression-policies/:id/status')
  @ApiOperation({ summary: 'Transition a progression policy status' })
  async transitionProgressionPolicyStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionDefinitionStatusSchema)) dto: TransitionDefinitionStatusDto,
  ): Promise<ProgressionPolicyResponseDto> {
    return this.definitionsService.transitionProgressionPolicyStatus(id, dto.status);
  }

  // Bible Translation Definitions
  @Post('bible-translation-definitions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a Bible translation definition' })
  async createBibleTranslationDefinition(
    @Body(new ZodValidationPipe(createBibleTranslationDefinitionSchema)) dto: CreateBibleTranslationDefinitionOutput,
  ): Promise<BibleTranslationDefinitionResponseDto> {
    return this.definitionsService.createBibleTranslationDefinition(dto);
  }

  @Get('bible-translation-definitions')
  @ApiOperation({ summary: 'List Bible translation definitions' })
  async listBibleTranslationDefinitions(): Promise<BibleTranslationDefinitionResponseDto[]> {
    return this.definitionsService.listBibleTranslationDefinitions();
  }

  @Patch('bible-translation-definitions/:id/status')
  @ApiOperation({ summary: 'Transition a Bible translation definition status' })
  async transitionBibleTranslationDefinitionStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionDefinitionStatusSchema)) dto: TransitionDefinitionStatusDto,
  ): Promise<BibleTranslationDefinitionResponseDto> {
    return this.definitionsService.transitionBibleTranslationDefinitionStatus(id, dto.status);
  }
}
