import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  rollbackDefinitionVersionSchema,
  migrateCompetencyTrackingReferencesSchema,
  type RollbackDefinitionVersionDto,
  type RollbackDefinitionVersionResultDto,
  type MigrateCompetencyTrackingReferencesDto,
  type MigrateCompetencyTrackingReferencesResultDto,
  type DefinitionVersionOperationLogResponseDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, PlatformAdminGuard, CurrentUser } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { DefinitionVersionOperationsService } from '../application/definition-version-operations.service.js';

// Admin surface for the two explicit Definition/Version operations added
// in issue #96 section 24 (controlled migration + logical rollback). Same
// PlatformAdminGuard pairing as /api/v1/admin/curriculum-definitions/*
// (DefinitionsController) -- no new authorization design.
//
// Both operations are deliberately NOT exposed as part of the generic
// status-transition endpoint: they are more consequential (repoint live
// family data / change what "current" resolves to across the platform),
// so they get their own explicit, narrowly-scoped routes and are always
// logged to DefinitionVersionOperationLog.
@ApiTags('Curriculum Definitions (Admin) - Version Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Controller({ path: 'admin/curriculum-definitions/version-operations', version: '1' })
export class DefinitionVersionOperationsController {
  constructor(private readonly service: DefinitionVersionOperationsService) {}

  @Post('rollback')
  @ApiOperation({ summary: 'Roll back a PUBLISHED definition version to DEPRECATED (logical rollback)' })
  async rollback(
    @CurrentUser('userId') actorId: string,
    @Body(new ZodValidationPipe(rollbackDefinitionVersionSchema)) dto: RollbackDefinitionVersionDto,
  ): Promise<RollbackDefinitionVersionResultDto> {
    return this.service.rollbackDefinitionVersion(dto.entityType, dto.code, dto.version, actorId, dto.reason);
  }

  @Post('competency-tracking-migrations')
  @ApiOperation({
    summary:
      'Re-point an explicitly selected set of LearnerCompetencyTracking rows from one CompetencyDefinition version to another',
  })
  async migrateCompetencyTrackingReferences(
    @CurrentUser('userId') actorId: string,
    @Body(new ZodValidationPipe(migrateCompetencyTrackingReferencesSchema))
    dto: MigrateCompetencyTrackingReferencesDto,
  ): Promise<MigrateCompetencyTrackingReferencesResultDto> {
    return this.service.migrateCompetencyTrackingReferences(
      dto.code,
      dto.fromVersion,
      dto.toVersion,
      dto.trackingIds,
      actorId,
      dto.reason,
    );
  }

  @Get('logs')
  @ApiOperation({ summary: 'List Definition/Version operation log entries (traceability), optionally filtered by code' })
  async listLogs(@Query('code') code?: string): Promise<DefinitionVersionOperationLogResponseDto[]> {
    return this.service.listOperationLogs(code);
  }
}
