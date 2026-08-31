import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  answerPrayerSchema,
  createPrayerSchema,
  updatePrayerSchema,
  type AnswerPrayerDto,
  type CreatePrayerDto,
  type PrayerResponseDto,
  type UpdatePrayerDto,
} from '@aletheia/contracts';
import { PrayerService } from '../application/prayer.service.js';
import { JwtAuthGuard, FamilyTenantGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';

@ApiTags('Prayers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/prayers', version: '1' })
export class PrayerController {
  constructor(private readonly prayerService: PrayerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new prayer request in family journal' })
  @ApiResponse({ status: 201, description: 'Prayer request created successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createPrayer(
    @Param('familyId') familyId: string,
    @Body(new ZodValidationPipe(createPrayerSchema)) dto: CreatePrayerDto,
  ): Promise<PrayerResponseDto> {
    return this.prayerService.createPrayer(familyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List prayer requests for family' })
  @ApiResponse({ status: 200, description: 'List of prayer requests.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async listPrayers(
    @Param('familyId') familyId: string,
    @Query('isAnswered') isAnswered?: string,
    @Query('includeArchived') includeArchived?: string,
  ): Promise<PrayerResponseDto[]> {
    const filter: { isAnswered?: boolean; includeArchived?: boolean } = {};
    if (isAnswered !== undefined) {
      filter.isAnswered = isAnswered === 'true';
    }
    if (includeArchived !== undefined) {
      filter.includeArchived = includeArchived === 'true';
    }
    return this.prayerService.getFamilyPrayers(familyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a prayer request by ID' })
  @ApiResponse({ status: 200, description: 'Prayer request details.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Prayer not found.' })
  async getPrayer(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<PrayerResponseDto> {
    return this.prayerService.getPrayerById(familyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a prayer request' })
  @ApiResponse({ status: 200, description: 'Prayer request updated.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Prayer not found.' })
  async updatePrayer(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePrayerSchema)) dto: UpdatePrayerDto,
  ): Promise<PrayerResponseDto> {
    return this.prayerService.updatePrayer(familyId, id, dto);
  }

  @Post(':id/answer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a prayer request as answered' })
  @ApiResponse({ status: 200, description: 'Prayer marked as answered.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Prayer not found.' })
  async answerPrayer(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(answerPrayerSchema)) dto: AnswerPrayerDto,
  ): Promise<PrayerResponseDto> {
    return this.prayerService.answerPrayer(familyId, id, dto);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a prayer request' })
  @ApiResponse({ status: 200, description: 'Prayer request archived.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Prayer not found.' })
  async archivePrayer(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<PrayerResponseDto> {
    return this.prayerService.archivePrayer(familyId, id);
  }
}
