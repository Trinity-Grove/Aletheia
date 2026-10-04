import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  generateLessonPlanDraftRequestSchema,
  reviewAiSuggestionRequestSchema,
  type AiLessonPlanDraftResponseDto,
  type AiUsageQuotaResponseDto,
  type GenerateLessonPlanDraftRequestDto,
  type ReviewAiSuggestionRequestDto,
} from '@aletheia/contracts';
import { CurrentUser, FamilyTenantGuard, JwtAuthGuard } from '../../../platform/auth/index.js';
import type { AuthenticatedUserPayload } from '../../identity/application/public-api.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { AiSuggestionService } from '../application/ai-suggestion.service.js';
import { AiQuotaService } from '../application/ai-quota.service.js';

@ApiTags('AI Assistance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/ai', version: '1' })
export class AiController {
  constructor(
    private readonly suggestionService: AiSuggestionService,
    private readonly quotaService: AiQuotaService,
  ) {}

  @Post('lesson-plan-draft')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate an AI-assisted lesson plan draft (pending human review)' })
  async generateLessonPlanDraft(
    @Param('familyId') familyId: string,
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body(new ZodValidationPipe(generateLessonPlanDraftRequestSchema))
    dto: GenerateLessonPlanDraftRequestDto,
  ): Promise<AiLessonPlanDraftResponseDto> {
    const actorUserId = typeof user === 'string' ? user : user.userId;
    return this.suggestionService.generateLessonPlanDraft(familyId, actorUserId, dto);
  }

  @Post('suggestions/:id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review an AI suggestion (ACCEPT, MODIFY, or REJECT)' })
  async reviewSuggestion(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body(new ZodValidationPipe(reviewAiSuggestionRequestSchema))
    dto: ReviewAiSuggestionRequestDto,
  ): Promise<{ suggestionId: string; status: string; lessonPlan?: unknown }> {
    const actorUserId = typeof user === 'string' ? user : user.userId;
    return this.suggestionService.reviewSuggestion(familyId, actorUserId, id, dto);
  }

  @Get('quota')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current AI usage quota for the family' })
  async getQuota(
    @Param('familyId') familyId: string,
  ): Promise<AiUsageQuotaResponseDto> {
    return this.quotaService.getFamilyQuota(familyId);
  }
}
