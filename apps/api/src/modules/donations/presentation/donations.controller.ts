import {
  Body,
  Controller,
  Delete,
  Get,
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
  createDonationIntentSchema,
  type CreateDonationIntentDto,
  type DonationIntentResponseDto,
  type DonationRecordResponseDto,
  type SupporterSubscriptionResponseDto,
} from '@aletheia/contracts';
import { DonationsService } from '../application/donations.service.js';
import { JwtAuthGuard, FamilyTenantGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';

@ApiTags('Donations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/donations', version: '1' })
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post('create-intent')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create voluntary support donation or subscription intent' })
  @ApiResponse({ status: 201, description: 'Donation intent created successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid amount.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createIntent(
    @Param('familyId') familyId: string,
    @Body(new ZodValidationPipe(createDonationIntentSchema))
    dto: CreateDonationIntentDto,
  ): Promise<DonationIntentResponseDto> {
    return this.donationsService.createIntent(familyId, dto);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get current status of a donation record' })
  @ApiResponse({ status: 200, description: 'Donation record status.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Donation not found.' })
  async getStatus(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<DonationRecordResponseDto> {
    return this.donationsService.getStatus(familyId, id);
  }

  @Get('history')
  @ApiOperation({ summary: 'List donation history for the family aggregate' })
  @ApiResponse({ status: 200, description: 'List of donation records.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getHistory(
    @Param('familyId') familyId: string,
  ): Promise<DonationRecordResponseDto[]> {
    return this.donationsService.getHistory(familyId);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'List recurring supporter subscriptions for the family' })
  @ApiResponse({ status: 200, description: 'List of supporter subscriptions.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getSubscriptions(
    @Param('familyId') familyId: string,
  ): Promise<SupporterSubscriptionResponseDto[]> {
    return this.donationsService.getSubscriptions(familyId);
  }

  @Delete('subscriptions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel recurring supporter subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  async cancelSubscription(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<SupporterSubscriptionResponseDto> {
    return this.donationsService.cancelSubscription(familyId, id);
  }
}
