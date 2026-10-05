import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  listAdminFeedbackQuerySchema,
  approveFeedbackSchema,
  rejectFeedbackSchema,
  type ListAdminFeedbackQueryDto,
  type ApproveFeedbackDto,
  type RejectFeedbackDto,
  type AdminFeedbackListResponseDto,
  type AdminFeedbackResponseDto,
} from '@aletheia/contracts';
import { FeedbackService } from '../application/feedback.service.js';
import {
  CurrentUser,
  JwtAuthGuard,
  PlatformAdminGuard,
} from '../../../platform/auth/index.js';
import type { AuthenticatedUserPayload } from '../../identity/application/public-api.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';

@ApiTags('Admin: Feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Controller({ path: 'admin/feedback', version: '1' })
export class FeedbackAdminController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  @ApiOperation({ summary: 'List feedback submissions for triage' })
  @ApiResponse({ status: 200, description: 'List of feedback submissions.' })
  async list(
    @Query(new ZodValidationPipe(listAdminFeedbackQuerySchema))
    query: ListAdminFeedbackQueryDto,
    @CurrentUser() caller: AuthenticatedUserPayload,
  ): Promise<AdminFeedbackListResponseDto> {
    return this.feedbackService.list(query, caller.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single feedback submission' })
  @ApiResponse({ status: 200, description: 'Feedback submission details.' })
  async getOne(
    @Param('id') id: string,
    @CurrentUser() caller: AuthenticatedUserPayload,
  ): Promise<AdminFeedbackResponseDto> {
    return this.feedbackService.getById(id, caller.userId);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve feedback and create GitHub issue' })
  @ApiResponse({ status: 200, description: 'Feedback approved.' })
  async approve(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(approveFeedbackSchema))
    dto: ApproveFeedbackDto,
    @CurrentUser() caller: AuthenticatedUserPayload,
  ): Promise<AdminFeedbackResponseDto> {
    const output = approveFeedbackSchema.parse(dto);
    return this.feedbackService.approve(id, caller.userId, output);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject feedback submission' })
  @ApiResponse({ status: 200, description: 'Feedback rejected.' })
  async reject(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(rejectFeedbackSchema))
    dto: RejectFeedbackDto,
    @CurrentUser() caller: AuthenticatedUserPayload,
  ): Promise<AdminFeedbackResponseDto> {
    const output = rejectFeedbackSchema.parse(dto);
    return this.feedbackService.reject(id, caller.userId, output);
  }
}
