import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import {
  generateReportSchema,
  type GenerateReportDto,
  type OfficialReportResponseDto,
  type ReportType,
} from '@aletheia/contracts';
import { JwtAuthGuard, FamilyTenantGuard, CurrentUser } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { ReportService } from '../application/report.service.js';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/reports', version: '1' })
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate an official report or academic transcript' })
  async generateReport(
    @Param('familyId') familyId: string,
    @Body(new ZodValidationPipe(generateReportSchema)) dto: GenerateReportDto,
    @CurrentUser('userId') userId?: string,
  ): Promise<OfficialReportResponseDto> {
    return this.reportService.generateReport(familyId, dto, userId ?? null);
  }

  @Get()
  @ApiOperation({ summary: 'List generated official reports' })
  async getReports(
    @Param('familyId') familyId: string,
    @Query('learnerId') learnerId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('type') type?: ReportType,
  ): Promise<OfficialReportResponseDto[]> {
    return this.reportService.listReports(familyId, {
      ...(learnerId ? { learnerId } : {}),
      ...(academicYearId ? { academicYearId } : {}),
      ...(type ? { type } : {}),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get official report by ID' })
  async getReportById(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<OfficialReportResponseDto> {
    return this.reportService.getReport(familyId, id);
  }

  @Get(':id/export/csv')
  @ApiOperation({ summary: 'Export report content as CSV' })
  async exportCsv(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<{ content: string; mimeType: string; filename: string }> {
    return this.reportService.exportReport(familyId, id, 'CSV');
  }

  @Get(':id/export/pdf')
  @ApiOperation({ summary: 'Export an academic transcript report as a real, hashed PDF document' })
  async exportPdf(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<Buffer> {
    const { bytes, filename, documentHash } = await this.reportService.exportReportPdf(familyId, id);
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="${filename}"`);
    reply.header('X-Document-Hash', documentHash);
    return Buffer.from(bytes);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an official report' })
  async deleteReport(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const success = await this.reportService.deleteReport(familyId, id);
    return { success };
  }
}
