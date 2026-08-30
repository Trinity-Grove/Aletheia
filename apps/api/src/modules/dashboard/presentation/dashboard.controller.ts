import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  dashboardQuerySchema,
  type DashboardResponseDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, FamilyTenantGuard } from '../../../platform/auth/index.js';
import { DashboardService } from '../application/dashboard.service.js';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get the family dashboard for a selected date' })
  async getDashboard(
    @Req() req: { user: { userId: string } },
    @Param('familyId') familyId: string,
    @Query() query: Record<string, unknown>,
  ): Promise<DashboardResponseDto> {
    const parsed = dashboardQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException('Invalid dashboard query.');
    }

    return this.dashboardService.getDashboard(req.user.userId, familyId, parsed.data);
  }
}
