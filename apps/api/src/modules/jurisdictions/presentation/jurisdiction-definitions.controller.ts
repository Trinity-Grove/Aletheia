import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createJurisdictionDefinitionSchema,
  transitionDefinitionStatusSchema,
  type CreateJurisdictionDefinitionOutput,
  type JurisdictionDefinitionResponseDto,
  type TransitionDefinitionStatusDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, PlatformAdminGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { JurisdictionDefinitionsService } from '../application/jurisdiction-definitions.service.js';

// Admin CRUD surface for the versioned jurisdiction/compliance catalog
// (issue #26). Platform-wide, not family-scoped -- gated by
// PlatformAdminGuard, same pairing as /api/v1/admin/curriculum-definitions/*.
// Nothing here is read by any family-facing request path yet.
@ApiTags('Jurisdiction Definitions (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Controller({ path: 'admin/jurisdiction-definitions', version: '1' })
export class JurisdictionDefinitionsController {
  constructor(private readonly service: JurisdictionDefinitionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a jurisdiction definition' })
  async create(
    @Body(new ZodValidationPipe(createJurisdictionDefinitionSchema)) dto: CreateJurisdictionDefinitionOutput,
  ): Promise<JurisdictionDefinitionResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List jurisdiction definitions, optionally filtered by code' })
  async list(@Query('code') code?: string): Promise<JurisdictionDefinitionResponseDto[]> {
    if (code) {
      return this.service.findByCode(code);
    }
    return this.service.list();
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transition a jurisdiction definition status (DRAFT -> PUBLISHED -> DEPRECATED -> ARCHIVED)' })
  async transitionStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionDefinitionStatusSchema)) dto: TransitionDefinitionStatusDto,
  ): Promise<JurisdictionDefinitionResponseDto> {
    return this.service.transitionStatus(id, dto.status);
  }
}
