import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  installFamilyCurriculumPackSchema,
  updateFamilyCurriculumPackSchema,
  type FamilyCurriculumPackResponseDto,
  type FamilyCurriculumPackRevisionResponseDto,
  type InstallFamilyCurriculumPackDto,
  type UpdateFamilyCurriculumPackDto,
} from '@aletheia/contracts';
import { FamilyTenantGuard, JwtAuthGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { FamilyCurriculumPackService } from '../application/family-curriculum-pack.service.js';

@ApiTags('Curriculum')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/curriculum-packs', version: '1' })
export class FamilyCurriculumPackController {
  constructor(private readonly service: FamilyCurriculumPackService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Install a published curriculum pack as a family-owned editable copy' })
  async install(
    @Param('familyId') familyId: string,
    @Body(new ZodValidationPipe(installFamilyCurriculumPackSchema)) dto: InstallFamilyCurriculumPackDto,
  ): Promise<FamilyCurriculumPackResponseDto> {
    return this.service.install(familyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List curriculum pack copies installed by a family' })
  async list(@Param('familyId') familyId: string): Promise<FamilyCurriculumPackResponseDto[]> {
    return this.service.list(familyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a family curriculum pack copy and its current document' })
  async get(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<FamilyCurriculumPackResponseDto> {
    return this.service.get(familyId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Save a new family curriculum pack revision' })
  async update(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateFamilyCurriculumPackSchema)) dto: UpdateFamilyCurriculumPackDto,
  ): Promise<FamilyCurriculumPackResponseDto> {
    return this.service.update(familyId, id, dto);
  }

  @Get(':id/revisions')
  @ApiOperation({ summary: 'List the append-only revision history of a family curriculum pack' })
  async revisions(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<FamilyCurriculumPackRevisionResponseDto[]> {
    return this.service.revisions(familyId, id);
  }
}
