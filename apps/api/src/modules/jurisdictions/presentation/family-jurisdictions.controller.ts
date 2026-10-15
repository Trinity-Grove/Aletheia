import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FamilyJurisdictionResponseDto } from '@aletheia/contracts';
import { FamilyTenantGuard, JwtAuthGuard } from '../../../platform/auth/index.js';
import { JurisdictionDefinitionsService } from '../application/jurisdiction-definitions.service.js';

@ApiTags('Family Jurisdictions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/jurisdiction', version: '1' })
export class FamilyJurisdictionsController {
  constructor(private readonly service: JurisdictionDefinitionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve active legal jurisdiction requirements and instructional thresholds for a family',
  })
  async getFamilyJurisdiction(@Param('familyId') familyId: string): Promise<FamilyJurisdictionResponseDto> {
    return this.service.getFamilyJurisdiction(familyId);
  }
}
