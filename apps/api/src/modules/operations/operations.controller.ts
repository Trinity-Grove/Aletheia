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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  AcknowledgeAlertSchema,
  type OperationalAlertEventDto,
  type OperationalStatusResponseDto,
} from '@aletheia/contracts';
import { CurrentUser, JwtAuthGuard, PlatformAdminGuard } from '../../platform/auth/index.js';
import { OperationsService } from './operations.service.js';

@ApiTags('Operations (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Controller({ path: 'admin/operations', version: '1' })
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get current operational health, probes, and resource metrics' })
  @ApiResponse({ status: 200, description: 'Operational status report' })
  async getStatus(): Promise<OperationalStatusResponseDto> {
    return this.operationsService.getStatus();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'List recent operational alerts and webhook events' })
  @ApiResponse({ status: 200, description: 'List of operational alert events' })
  async listAlerts(
    @Query('limit') limit?: string,
    @Query('acknowledged') acknowledged?: string,
  ): Promise<OperationalAlertEventDto[]> {
    const parsedLimit =
      limit !== undefined && !Number.isNaN(Number.parseInt(limit, 10))
        ? Math.max(1, Number.parseInt(limit, 10))
        : undefined;
    const parsedAcknowledged = acknowledged !== undefined ? acknowledged === 'true' : undefined;
    return this.operationsService.listAlerts({
      ...(parsedLimit !== undefined ? { limit: parsedLimit } : {}),
      ...(parsedAcknowledged !== undefined ? { acknowledged: parsedAcknowledged } : {}),
    });
  }

  @Post('alerts/:id/acknowledge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acknowledge an operational alert event' })
  @ApiResponse({ status: 200, description: 'Acknowledged operational alert event' })
  async acknowledgeAlert(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() body?: unknown,
  ): Promise<OperationalAlertEventDto> {
    const parsed = body ? AcknowledgeAlertSchema.parse(body) : undefined;
    return this.operationsService.acknowledgeAlert(id, userId, parsed?.notes);
  }
}
