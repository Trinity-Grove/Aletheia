import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  applyCurriculumTemplateSchema,
  createAcademicYearSchema,
  createSubjectSchema,
  updateSubjectSchema,
  upsertLearnerPlanSchema,
  type AcademicYearResponseDto,
  type ApplyCurriculumTemplateDto,
  type CreateAcademicYearDto,
  type CreateSubjectDto,
  type CurriculumDefinitionCatalogEntryDto,
  type EvidenceTypeCatalogEntryDto,
  type ProgressionPolicyCatalogEntryDto,
  type RubricCatalogEntryDto,
  type LearnerPlanResponseDto,
  type PedagogicalModelCatalogEntryDto,
  type SubjectResponseDto,
  type TheologicalTraditionCatalogEntryDto,
  type UpdateSubjectDto,
  type UpsertLearnerPlanDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, FamilyTenantGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { CurriculumService } from '../application/curriculum.service.js';

@ApiTags('Curriculum')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/curriculum', version: '1' })
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  // Academic Years
  @Post('academic-years')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an academic year for family' })
  async createAcademicYear(
    @Param('familyId') familyId: string,
    @Body(new ZodValidationPipe(createAcademicYearSchema)) dto: CreateAcademicYearDto,
  ): Promise<AcademicYearResponseDto> {
    return this.curriculumService.createAcademicYear(familyId, dto);
  }

  @Get('academic-years')
  @ApiOperation({ summary: 'List academic years for family' })
  async listAcademicYears(@Param('familyId') familyId: string): Promise<AcademicYearResponseDto[]> {
    return this.curriculumService.listAcademicYears(familyId);
  }

  @Get('academic-years/current')
  @ApiOperation({ summary: 'Get or create current academic year for family' })
  async getCurrentAcademicYear(@Param('familyId') familyId: string): Promise<AcademicYearResponseDto> {
    return this.curriculumService.getOrCreateCurrentYear(familyId);
  }

  // Subjects
  @Post('subjects')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a subject in curriculum' })
  async createSubject(
    @Param('familyId') familyId: string,
    @Body(new ZodValidationPipe(createSubjectSchema)) dto: CreateSubjectDto,
  ): Promise<SubjectResponseDto> {
    return this.curriculumService.createSubject(familyId, dto);
  }

  @Get('subjects')
  @ApiOperation({ summary: 'List subjects in curriculum' })
  async listSubjects(
    @Param('familyId') familyId: string,
    @Query('includeArchived') includeArchived?: string,
  ): Promise<SubjectResponseDto[]> {
    return this.curriculumService.listSubjects(familyId, includeArchived === 'true');
  }

  @Patch('subjects/:id')
  @ApiOperation({ summary: 'Update subject details' })
  async updateSubject(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSubjectSchema)) dto: UpdateSubjectDto,
  ): Promise<SubjectResponseDto> {
    return this.curriculumService.updateSubject(familyId, id, dto);
  }

  @Post('subjects/:id/archive')
  @ApiOperation({ summary: 'Archive subject from active curriculum' })
  async archiveSubject(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<SubjectResponseDto> {
    return this.curriculumService.archiveSubject(familyId, id);
  }

  // Learner Plans
  @Put('plans')
  @ApiOperation({ summary: 'Upsert learner curriculum plan' })
  async upsertLearnerPlan(
    @Param('familyId') familyId: string,
    @Body(new ZodValidationPipe(upsertLearnerPlanSchema)) dto: UpsertLearnerPlanDto,
  ): Promise<LearnerPlanResponseDto> {
    return this.curriculumService.upsertLearnerPlan(familyId, dto);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get learner curriculum plan for year' })
  async getLearnerPlan(
    @Param('familyId') familyId: string,
    @Query('learnerId') learnerId: string,
    @Query('academicYearId') academicYearId: string,
  ): Promise<LearnerPlanResponseDto | null> {
    return this.curriculumService.getLearnerPlan(familyId, learnerId, academicYearId);
  }

  // Template Catalog (issue #96 section 35: UI data-driven -- a family
  // discovers a new PUBLISHED pedagogical model without a release. NOT the
  // platform-admin CRUD -- same guard as every other route on this
  // controller, no platform-admin access required.)
  @Get('templates/catalog')
  @ApiOperation({ summary: 'List published pedagogical model templates a family can apply' })
  async listTemplateCatalog(): Promise<PedagogicalModelCatalogEntryDto[]> {
    return this.curriculumService.listPublishedTemplateCatalog();
  }

  // Theological Tradition Catalog (issue #126 item 1) -- same reasoning
  // and guard pattern as the template catalog above: a family discovers
  // a new PUBLISHED tradition without a release, to populate the
  // pedagogical/theological profile settings UI's "preferred tradition"
  // dropdown.
  @Get('theological-traditions/catalog')
  @ApiOperation({ summary: 'List published theological traditions a family can prefer' })
  async listTheologicalTraditionCatalog(): Promise<TheologicalTraditionCatalogEntryDto[]> {
    return this.curriculumService.listPublishedTheologicalTraditionCatalog();
  }

  // Curriculum Definition Catalog (issue #126 item 3) -- populates the
  // "activate curriculum for this learner" flow's dropdown. Unlike the
  // two catalogs above, entries carry a real `id` (see
  // curriculumDefinitionCatalogEntrySchema's comment for why).
  @Get('curriculum-definitions/catalog')
  @ApiOperation({ summary: 'List published curriculum definitions a family can activate for a learner' })
  async listCurriculumDefinitionCatalog(): Promise<CurriculumDefinitionCatalogEntryDto[]> {
    return this.curriculumService.listPublishedCurriculumDefinitionCatalog();
  }

  // Evidence Type Catalog (issue #126 item 3) -- populates the evidence
  // submission form's "type of evidence" dropdown.
  @Get('evidence-types/catalog')
  @ApiOperation({ summary: 'List published evidence types a family can submit as' })
  async listEvidenceTypeCatalog(): Promise<EvidenceTypeCatalogEntryDto[]> {
    return this.curriculumService.listPublishedEvidenceTypeCatalog();
  }

  @Get('progression-policies/catalog')
  @ApiOperation({ summary: 'List published progression policies a family can use for competency tracking' })
  async listProgressionPolicyCatalog(): Promise<ProgressionPolicyCatalogEntryDto[]> {
    return this.curriculumService.listPublishedProgressionPolicyCatalog();
  }

  @Get('rubrics/catalog')
  @ApiOperation({ summary: 'List published rubrics a family can use for assessments' })
  async listRubricCatalog(): Promise<RubricCatalogEntryDto[]> {
    return this.curriculumService.listPublishedRubricCatalog();
  }

  // Apply Template Accelerator
  @Post('templates/apply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Apply a pre-built pedagogical curriculum template' })
  async applyTemplate(
    @Param('familyId') familyId: string,
    @Body(new ZodValidationPipe(applyCurriculumTemplateSchema)) dto: ApplyCurriculumTemplateDto,
  ): ReturnType<CurriculumService['applyTemplate']> {
    return this.curriculumService.applyTemplate(familyId, dto);
  }
}
