import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  learnerSubmitEvidenceSchema,
  type EvidenceSubmissionResponseDto,
  type LearnerCompetencyTrackingResponseDto,
  type LearnerSubmitEvidenceOutput,
} from '@aletheia/contracts';
import { LearnerAccessGuard, LearnerSelfGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { LearnerProgressService } from '../application/learner-progress.service.js';

interface RequestWithLearner {
  learner: { learnerId: string; familyId: string };
}

// Learner-scoped evidence submission + progress view (issue #34). Same
// guard pair, same path prefix, and same "no :learnerId route param can
// ever differ from the session's own" contract as LearnerAgendaController
// -- this module still invents no new authorization mechanism of its own.
@ApiTags('Learner Access (learner)')
@UseGuards(LearnerAccessGuard, LearnerSelfGuard)
@Controller({ path: 'learner-access/learners/:learnerId', version: '1' })
export class LearnerProgressController {
  constructor(private readonly learnerProgressService: LearnerProgressService) {}

  @Post('evidence-submissions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit evidence for one of the learner’s own tracked competencies' })
  @ApiResponse({ status: 201, description: 'Evidence submission created, UNVALIDATED by default.' })
  async submitEvidence(
    @Param('learnerId') learnerId: string,
    @Req() request: RequestWithLearner,
    @Body(new ZodValidationPipe(learnerSubmitEvidenceSchema)) dto: LearnerSubmitEvidenceOutput,
  ): Promise<EvidenceSubmissionResponseDto> {
    return this.learnerProgressService.submitEvidence(request.learner.familyId, learnerId, dto);
  }

  @Get('progress')
  @ApiOperation({ summary: "Get the learner's own tracked-competency progress" })
  @ApiResponse({ status: 200, description: "The learner's own tracked competencies, never a sibling's." })
  async getProgress(
    @Param('learnerId') learnerId: string,
    @Req() request: RequestWithLearner,
    @Query('status') status?: 'ACTIVE' | 'RETIRED',
  ): Promise<LearnerCompetencyTrackingResponseDto[]> {
    return this.learnerProgressService.getProgress(request.learner.familyId, learnerId, status);
  }
}
