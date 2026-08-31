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
  type LearnerPlanResponseDto,
  type SubjectResponseDto,
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

  // Apply Template Accelerator
  @Post('templates/apply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Apply a pre-built pedagogical curriculum template' })
  async applyTemplate(
    @Param('familyId') familyId: string,
    @Body(new ZodValidationPipe(applyCurriculumTemplateSchema)) dto: ApplyCurriculumTemplateDto,
  ): Promise<{ subjectsCount: number; objectivesCount: number }> {
    return this.curriculumService.applyTemplate(familyId, dto);
  }
}
