import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  upsertPedagogicalProfileSchema,
  upsertTheologicalProfileSchema,
  type PedagogicalProfileResponseDto,
  type TheologicalProfileResponseDto,
  type UpsertPedagogicalProfileOutput,
  type UpsertTheologicalProfileOutput,
} from '@aletheia/contracts';
import { JwtAuthGuard, FamilyTenantGuard, CurrentUser } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { ProfilesService } from '../application/profiles.service.js';

// Family-scoped pedagogical/theological profile CRUD (issue #96 Fase 1,
// sections 13/14). Same guard pair as every other family-scoped route on
// CurriculumController -- no new authorization. Read + upsert only; an
// "upsert" always creates a new version (see ProfilesRepository), so
// history endpoints exist to inspect prior versions rather than a
// separate audit log.
//
// Deliberately NOT wired into any content-resolution read path yet.
@ApiTags('Curriculum Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/curriculum', version: '1' })
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('pedagogical-profile')
  @ApiOperation({ summary: 'Get the current pedagogical profile for family' })
  async getPedagogicalProfile(
    @Param('familyId') familyId: string,
  ): Promise<PedagogicalProfileResponseDto | null> {
    return this.profilesService.getPedagogicalProfile(familyId);
  }

  @Put('pedagogical-profile')
  @ApiOperation({ summary: 'Create a new version of the family pedagogical profile' })
  async upsertPedagogicalProfile(
    @Param('familyId') familyId: string,
    @CurrentUser('userId') actorId: string,
    @Body(new ZodValidationPipe(upsertPedagogicalProfileSchema)) dto: UpsertPedagogicalProfileOutput,
  ): Promise<PedagogicalProfileResponseDto> {
    return this.profilesService.upsertPedagogicalProfile(familyId, dto, actorId);
  }

  @Get('pedagogical-profile/history')
  @ApiOperation({ summary: 'List every version of the family pedagogical profile, most recent first' })
  async listPedagogicalProfileHistory(
    @Param('familyId') familyId: string,
  ): Promise<PedagogicalProfileResponseDto[]> {
    return this.profilesService.listPedagogicalProfileHistory(familyId);
  }

  @Get('theological-profile')
  @ApiOperation({ summary: 'Get the current theological profile for family' })
  async getTheologicalProfile(
    @Param('familyId') familyId: string,
  ): Promise<TheologicalProfileResponseDto | null> {
    return this.profilesService.getTheologicalProfile(familyId);
  }

  @Put('theological-profile')
  @ApiOperation({ summary: 'Create a new version of the family theological profile' })
  async upsertTheologicalProfile(
    @Param('familyId') familyId: string,
    @CurrentUser('userId') actorId: string,
    @Body(new ZodValidationPipe(upsertTheologicalProfileSchema)) dto: UpsertTheologicalProfileOutput,
  ): Promise<TheologicalProfileResponseDto> {
    return this.profilesService.upsertTheologicalProfile(familyId, dto, actorId);
  }

  @Get('theological-profile/history')
  @ApiOperation({ summary: 'List every version of the family theological profile, most recent first' })
  async listTheologicalProfileHistory(
    @Param('familyId') familyId: string,
  ): Promise<TheologicalProfileResponseDto[]> {
    return this.profilesService.listTheologicalProfileHistory(familyId);
  }
}
