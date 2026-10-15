import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createEvidenceSubmissionSchema,
  validateEvidenceSubmissionSchema,
  type CreateEvidenceSubmissionOutput,
  type EvidenceSubmissionResponseDto,
  type EvidenceSubmissionDownloadUrlResponseDto,
  type ValidateEvidenceSubmissionDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, FamilyTenantGuard, CurrentUser } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { EvidenceSubmissionService } from '../application/evidence-submission.service.js';

// Family-scoped evidence submission CRUD (issue #96 Fase 2, section 9).
// Same guard pair as every other family-scoped route on
// CurriculumController/ProfilesController -- no new authorization.
//
// Deliberately NOT wired into LearningObjective/LearningRecord.
@ApiTags('Curriculum Evidence Submissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/curriculum/evidence-submissions', version: '1' })
export class EvidenceSubmissionController {
  constructor(private readonly evidenceSubmissionService: EvidenceSubmissionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit evidence for one or more competencies' })
  async createEvidenceSubmission(
    @Param('familyId') familyId: string,
    @CurrentUser('userId') authorId: string,
    @Body(new ZodValidationPipe(createEvidenceSubmissionSchema)) dto: CreateEvidenceSubmissionOutput,
  ): Promise<EvidenceSubmissionResponseDto> {
    return this.evidenceSubmissionService.createEvidenceSubmission(familyId, authorId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List evidence submissions for the family, optionally filtered by learner' })
  async listEvidenceSubmissions(
    @Param('familyId') familyId: string,
    @Query('learnerId') learnerId?: string,
  ): Promise<EvidenceSubmissionResponseDto[]> {
    return this.evidenceSubmissionService.listEvidenceSubmissions(familyId, learnerId);
  }

  @Get(':id/download-url')
  @ApiOperation({ summary: 'Get a short-lived preview URL for validated evidence media' })
  async getDownloadUrl(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ): Promise<EvidenceSubmissionDownloadUrlResponseDto> {
    return this.evidenceSubmissionService.getDownloadUrl(familyId, id, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one evidence submission' })
  async getEvidenceSubmission(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<EvidenceSubmissionResponseDto> {
    return this.evidenceSubmissionService.getEvidenceSubmission(familyId, id);
  }

  @Patch(':id/validation')
  @ApiOperation({ summary: 'Validate or reject an evidence submission' })
  async validateEvidenceSubmission(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @CurrentUser('userId') validatedByUserId: string,
    @Body(new ZodValidationPipe(validateEvidenceSubmissionSchema)) dto: ValidateEvidenceSubmissionDto,
  ): Promise<EvidenceSubmissionResponseDto> {
    return this.evidenceSubmissionService.validateEvidenceSubmission(familyId, id, dto.status, validatedByUserId);
  }
}
