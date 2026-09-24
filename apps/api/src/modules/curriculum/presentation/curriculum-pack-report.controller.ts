import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import {
  createPackReportSchema,
  type CreatePackReportOutput,
  type PackReportResponseDto,
} from '@aletheia/contracts';
import { CurrentUser, FamilyTenantGuard, JwtAuthGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { CurriculumPackReportService } from '../application/curriculum-pack-report.service.js';

@ApiTags('Curriculum Packs (Reports)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'curriculum-packs/:packId/reports', version: '1' })
export class CurriculumPackReportController {
  constructor(private readonly reportService: CurriculumPackReportService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a community report against a curriculum pack' })
  async createReport(
    @Param('packId') packId: string,
    @CurrentUser('userId') userId: string,
    @Req() req: FastifyRequest,
    @Body(new ZodValidationPipe(createPackReportSchema)) dto: CreatePackReportOutput,
  ): Promise<PackReportResponseDto> {
    const familyId =
      (req as unknown as { family?: { familyId?: string } }).family?.familyId ??
      (req.headers?.['x-family-id'] as string | undefined);

    if (!familyId) {
      throw new BadRequestException('Family tenancy scope is required.');
    }

    return this.reportService.createReport(packId, userId, familyId, dto);
  }
}
