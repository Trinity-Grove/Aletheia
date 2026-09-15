import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  addFamilyCurriculumPackMediaSchema,
  type AddFamilyCurriculumPackMediaDto,
  type FamilyCurriculumPackMediaResponseDto,
} from '@aletheia/contracts';
import { FamilyTenantGuard, JwtAuthGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { FamilyCurriculumPackMediaService } from '../application/family-curriculum-pack-media.service.js';

@ApiTags('Curriculum')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/curriculum-packs/:packId/media', version: '1' })
export class FamilyCurriculumPackMediaController {
  constructor(private readonly service: FamilyCurriculumPackMediaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Attach family-owned media to an editable curriculum pack' })
  async add(
    @Param('familyId') familyId: string,
    @Param('packId') packId: string,
    @Body(new ZodValidationPipe(addFamilyCurriculumPackMediaSchema)) dto: AddFamilyCurriculumPackMediaDto,
  ): Promise<FamilyCurriculumPackMediaResponseDto> {
    return this.service.add(familyId, packId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List media attached to a family curriculum pack' })
  async list(
    @Param('familyId') familyId: string,
    @Param('packId') packId: string,
  ): Promise<FamilyCurriculumPackMediaResponseDto[]> {
    return this.service.list(familyId, packId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove media from a family curriculum pack' })
  async remove(
    @Param('familyId') familyId: string,
    @Param('packId') packId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.service.remove(familyId, packId, id);
  }
}
