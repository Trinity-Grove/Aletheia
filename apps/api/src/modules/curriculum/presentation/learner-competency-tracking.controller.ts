import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  activateCurriculumForLearnerSchema,
  type ActivateCurriculumForLearnerDto,
  type ActivateCurriculumForLearnerResultDto,
  type LearnerCompetencyTrackingResponseDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, FamilyTenantGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { LearnerCompetencyTrackingService } from '../application/learner-competency-tracking.service.js';

// Family-scoped learner competency tracking (issue #126 item 3). Same
// guard pair as every other family-scoped route in this module -- no new
// authorization design.
//
// This is the successor path to "apply a template creates
// Subjects+LearningObjectives": activating a CurriculumDefinition here
// creates the per-learner competency working set that the
// EvidenceSubmission/AssessmentResult flow (Fase 2) is actually assessed
// against. It is additive alongside the existing plan/template flow, not
// a replacement of it in this slice.
@ApiTags('Curriculum Competency Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/curriculum/competency-tracking', version: '1' })
export class LearnerCompetencyTrackingController {
  constructor(private readonly trackingService: LearnerCompetencyTrackingService) {}

  @Post('activate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Activate a curriculum definition for a learner, creating tracked competencies' })
  async activateCurriculumForLearner(
    @Param('familyId') familyId: string,
    @Body(new ZodValidationPipe(activateCurriculumForLearnerSchema)) dto: ActivateCurriculumForLearnerDto,
  ): Promise<ActivateCurriculumForLearnerResultDto> {
    return this.trackingService.activateCurriculumForLearner(familyId, dto);
  }

  @Get()
  @ApiOperation({ summary: "List a learner's tracked competencies, optionally filtered by status" })
  async listTrackedCompetencies(
    @Param('familyId') familyId: string,
    @Query('learnerId') learnerId?: string,
    @Query('status') status?: 'ACTIVE' | 'RETIRED',
  ): Promise<LearnerCompetencyTrackingResponseDto[]> {
    return this.trackingService.listTrackedCompetencies(familyId, learnerId, status);
  }

  @Patch(':id/retire')
  @ApiOperation({ summary: 'Retire a tracked competency (e.g. curriculum changed, no longer pursued)' })
  async retireTrackedCompetency(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<LearnerCompetencyTrackingResponseDto> {
    return this.trackingService.retireTrackedCompetency(familyId, id);
  }
}
