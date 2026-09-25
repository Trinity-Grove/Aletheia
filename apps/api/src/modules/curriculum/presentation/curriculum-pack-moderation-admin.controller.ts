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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  adminModeratePackSchema,
  adminResolveReportSchema,
  type AdminModeratePackOutput,
  type AdminResolveReportOutput,
  type CurriculumPackResponseDto,
  type PackReportResponseDto,
  type PackReportStatus,
} from '@aletheia/contracts';
import { CurrentUser, JwtAuthGuard, PlatformAdminGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import {
  CurriculumPackModerationService,
  type ModerationQueueItem,
} from '../application/curriculum-pack-moderation.service.js';

@ApiTags('Curriculum Packs (Moderation Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Controller({ path: 'admin/moderation', version: '1' })
export class CurriculumPackModerationAdminController {
  constructor(private readonly moderationService: CurriculumPackModerationService) {}

  @Get('queue')
  @ApiOperation({ summary: 'Get moderation review queue (pending review and suspended packs)' })
  async getModerationQueue(): Promise<ModerationQueueItem[]> {
    return this.moderationService.getModerationQueue();
  }

  @Post('packs/:id/moderate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Perform a moderation action on a curriculum pack (APPROVE, REJECT, SUSPEND, RESTORE)' })
  async moderatePack(
    @Param('id') packId: string,
    @CurrentUser('userId') adminUserId: string,
    @Body(new ZodValidationPipe(adminModeratePackSchema)) dto: AdminModeratePackOutput,
  ): Promise<CurriculumPackResponseDto> {
    return this.moderationService.moderatePack(packId, adminUserId, dto);
  }

  @Get('reports')
  @ApiOperation({ summary: 'List curriculum pack reports with optional status and packId filters' })
  async listReports(
    @Query('status') status?: PackReportStatus,
    @Query('packId') packId?: string,
  ): Promise<PackReportResponseDto[]> {
    return this.moderationService.listReports({
      ...(status !== undefined && { status }),
      ...(packId !== undefined && { packId }),
    });
  }

  @Post('reports/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a curriculum pack report (UPHELD, DISMISSED)' })
  async resolveReport(
    @Param('id') reportId: string,
    @CurrentUser('userId') adminUserId: string,
    @Body(new ZodValidationPipe(adminResolveReportSchema)) dto: AdminResolveReportOutput,
  ): Promise<PackReportResponseDto> {
    return this.moderationService.resolveReport(reportId, adminUserId, dto);
  }
}
