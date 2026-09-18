import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ReportVerificationResponseDto } from '@aletheia/contracts';
import { ReportService } from '../application/report.service.js';

@ApiTags('Public Report Verification')
@Controller({ path: 'reports/verify', version: '1' })
export class PublicReportVerificationController {
  constructor(private readonly reportService: ReportService) {}

  @Get(':identifier')
  @ApiOperation({
    summary: 'Publicly verify an official report or educational dossier authenticity by hash or ID',
  })
  async verifyReport(
    @Param('identifier') identifier: string,
  ): Promise<ReportVerificationResponseDto> {
    return this.reportService.verifyReport(identifier);
  }
}
