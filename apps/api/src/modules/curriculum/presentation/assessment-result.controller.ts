import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createAssessmentResultSchema,
  type AssessmentResultResponseDto,
  type CreateAssessmentResultOutput,
} from '@aletheia/contracts';
import { JwtAuthGuard, FamilyTenantGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { AssessmentResultService } from '../application/assessment-result.service.js';

// Family-scoped assessment result CRUD (issue #96 Fase 2, section 10's
// last item). Same guard pair as every other family-scoped route on
// CurriculumController/ProfilesController/EvidenceSubmissionController --
// no new authorization.
@ApiTags('Curriculum Assessment Results')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/curriculum/assessment-results', version: '1' })
export class AssessmentResultController {
  constructor(private readonly assessmentResultService: AssessmentResultService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record an assessment result against a rubric' })
  async createAssessmentResult(
    @Req() req: { user: { userId: string } },
    @Param('familyId') familyId: string,
    @Body(new ZodValidationPipe(createAssessmentResultSchema)) dto: CreateAssessmentResultOutput,
  ): Promise<AssessmentResultResponseDto> {
    return this.assessmentResultService.createAssessmentResult(familyId, req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List assessment results for the family, optionally filtered by learner' })
  async listAssessmentResults(
    @Param('familyId') familyId: string,
    @Query('learnerId') learnerId?: string,
  ): Promise<AssessmentResultResponseDto[]> {
    return this.assessmentResultService.listAssessmentResults(familyId, learnerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one assessment result' })
  async getAssessmentResult(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<AssessmentResultResponseDto> {
    return this.assessmentResultService.getAssessmentResult(familyId, id);
  }
}
