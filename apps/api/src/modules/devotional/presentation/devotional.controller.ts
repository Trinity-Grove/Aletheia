import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  upsertDailyDevotionalSchema,
  type BiblePassageDto,
  type BibleVersionDto,
  type DailyDevotionalResponseDto,
  type UpsertDailyDevotionalDto,
} from '@aletheia/contracts';
import { DevotionalService } from '../application/devotional.service.js';
import { JwtAuthGuard, FamilyTenantGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';

@ApiTags('Devotionals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/devotionals', version: '1' })
export class DevotionalController {
  constructor(private readonly devotionalService: DevotionalService) {}

  @Get('by-date')
  @ApiOperation({ summary: 'Get daily devotional by date' })
  @ApiResponse({ status: 200, description: 'Daily devotional details or null.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getDevotional(
    @Param('familyId') familyId: string,
    @Query('date') date: string,
  ): Promise<DailyDevotionalResponseDto | null> {
    return this.devotionalService.getDevotionalByDate(familyId, date);
  }

  @Put('by-date')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update a daily devotional for a family' })
  @ApiResponse({ status: 200, description: 'Devotional saved successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async upsertDevotional(
    @Param('familyId') familyId: string,
    @Body(new ZodValidationPipe(upsertDailyDevotionalSchema)) dto: UpsertDailyDevotionalDto,
  ): Promise<DailyDevotionalResponseDto> {
    return this.devotionalService.upsertDevotional(familyId, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get recent devotional history' })
  @ApiResponse({ status: 200, description: 'List of recent devotionals.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getHistory(
    @Param('familyId') familyId: string,
    @Query('limit') limit?: string,
  ): Promise<DailyDevotionalResponseDto[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 30;
    return this.devotionalService.getRecentDevotionals(familyId, parsedLimit);
  }

  @Get('scripture/lookup')
  @ApiOperation({ summary: 'Look up Scripture text via YouVersion / BSB' })
  @ApiResponse({ status: 200, description: 'Scripture passage details.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async lookupScripture(
    @Query('reference') reference: string,
    @Query('versionId') versionId?: string,
  ): Promise<BiblePassageDto | null> {
    return this.devotionalService.lookupScripture(reference, versionId);
  }

  @Get('scripture/bibles')
  @ApiOperation({ summary: 'Get available Bible translations' })
  @ApiResponse({ status: 200, description: 'List of available Bible translations.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getAvailableBibles(): Promise<BibleVersionDto[]> {
    return this.devotionalService.getAvailableBibles();
  }
}
