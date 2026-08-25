import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard, FamilyTenantGuard } from '../../../platform/auth/index.js';
import { CurriculumService } from '../application/curriculum.service.js';
import {
  createAcademicYearSchema,
  createSubjectSchema,
  updateSubjectSchema,
  upsertLearnerPlanSchema,
  applyCurriculumTemplateSchema,
  type AcademicYearResponseDto,
  type SubjectResponseDto,
  type LearnerPlanResponseDto,
  type CreateAcademicYearDto,
  type CreateSubjectDto,
  type UpdateSubjectDto,
  type UpsertLearnerPlanDto,
  type ApplyCurriculumTemplateDto,
} from '@aletheia/contracts';

@Controller('families/:familyId/curriculum')
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  // Academic Years
  @Post('academic-years')
  async createAcademicYear(
    @Param('familyId') familyId: string,
    @Body() body: unknown,
  ): Promise<AcademicYearResponseDto> {
    const dto = createAcademicYearSchema.parse(body) as CreateAcademicYearDto;
    return this.curriculumService.createAcademicYear(familyId, dto);
  }

  @Get('academic-years')
  async listAcademicYears(@Param('familyId') familyId: string): Promise<AcademicYearResponseDto[]> {
    return this.curriculumService.listAcademicYears(familyId);
  }

  @Get('academic-years/current')
  async getCurrentAcademicYear(@Param('familyId') familyId: string): Promise<AcademicYearResponseDto> {
    return this.curriculumService.getOrCreateCurrentYear(familyId);
  }

  // Subjects
  @Post('subjects')
  async createSubject(
    @Param('familyId') familyId: string,
    @Body() body: unknown,
  ): Promise<SubjectResponseDto> {
    const dto = createSubjectSchema.parse(body) as CreateSubjectDto;
    return this.curriculumService.createSubject(familyId, dto);
  }

  @Get('subjects')
  async listSubjects(
    @Param('familyId') familyId: string,
    @Query('includeArchived') includeArchived?: string,
  ): Promise<SubjectResponseDto[]> {
    return this.curriculumService.listSubjects(familyId, includeArchived === 'true');
  }

  @Patch('subjects/:id')
  async updateSubject(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<SubjectResponseDto> {
    const dto = updateSubjectSchema.parse(body) as UpdateSubjectDto;
    return this.curriculumService.updateSubject(familyId, id, dto);
  }

  @Post('subjects/:id/archive')
  async archiveSubject(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<SubjectResponseDto> {
    return this.curriculumService.archiveSubject(familyId, id);
  }

  // Learner Plans
  @Put('plans')
  async upsertLearnerPlan(
    @Param('familyId') familyId: string,
    @Body() body: unknown,
  ): Promise<LearnerPlanResponseDto> {
    const dto = upsertLearnerPlanSchema.parse(body) as UpsertLearnerPlanDto;
    return this.curriculumService.upsertLearnerPlan(familyId, dto);
  }

  @Get('plans')
  async getLearnerPlan(
    @Param('familyId') familyId: string,
    @Query('learnerId') learnerId: string,
    @Query('academicYearId') academicYearId: string,
  ): Promise<LearnerPlanResponseDto | null> {
    return this.curriculumService.getLearnerPlan(familyId, learnerId, academicYearId);
  }

  // Apply Template Accelerator
  @Post('templates/apply')
  async applyTemplate(
    @Param('familyId') familyId: string,
    @Body() body: unknown,
  ): Promise<{ subjectsCount: number; objectivesCount: number }> {
    const dto = applyCurriculumTemplateSchema.parse(body) as ApplyCurriculumTemplateDto;
    return this.curriculumService.applyTemplate(familyId, dto);
  }
}
