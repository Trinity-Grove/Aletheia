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

// Assessment creation allows either a family member or a mentor with an
// active grant for this exact learner; reads remain family-tenant-scoped.
@ApiTags('Curriculum Assessment Results')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'families/:familyId/curriculum/assessment-results', version: '1' })
export class AssessmentResultController {
  constructor(private readonly assessmentResultService: AssessmentResultService) {}

  @Post()
  // Creation performs exact family-member / learner-scoped mentor authorization in the service.
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
  @UseGuards(FamilyTenantGuard)
  @ApiOperation({ summary: 'List assessment results for the family, optionally filtered by learner' })
  async listAssessmentResults(
    @Param('familyId') familyId: string,
    @Query('learnerId') learnerId?: string,
  ): Promise<AssessmentResultResponseDto[]> {
    return this.assessmentResultService.listAssessmentResults(familyId, learnerId);
  }

  @Get(':id')
  @UseGuards(FamilyTenantGuard)
  @ApiOperation({ summary: 'Get one assessment result' })
  async getAssessmentResult(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<AssessmentResultResponseDto> {
    return this.assessmentResultService.getAssessmentResult(familyId, id);
  }
}
