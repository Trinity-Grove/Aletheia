import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  createFeedbackSchema,
  type CreateFeedbackDto,
  type SubmitterFeedbackResponseDto,
} from '@aletheia/contracts';
import { FeedbackService } from '../application/feedback.service.js';
import {
  JwtAuthGuard,
  FamilyTenantGuard,
  CurrentUser,
} from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';

@ApiTags('Feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/feedback', version: '1' })
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit family feedback' })
  @ApiResponse({ status: 201, description: 'Feedback submitted successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(
    @Param('familyId') familyId: string,
    @CurrentUser('userId') currentUserId: string,
    @Body(new ZodValidationPipe(createFeedbackSchema))
    dto: CreateFeedbackDto,
  ): Promise<SubmitterFeedbackResponseDto> {
    const output = createFeedbackSchema.parse(dto);
    return this.feedbackService.create(familyId, currentUserId, output);
  }
}
