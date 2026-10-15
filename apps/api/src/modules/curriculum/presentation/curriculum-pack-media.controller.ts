import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type CurriculumPackMediaResponseDto,
} from '@aletheia/contracts';
import { CurriculumPackMediaService } from '../application/curriculum-pack-media.service.js';

@ApiTags('Curriculum Packs (Community)')
@Controller({ path: 'curriculum-packs/:packId/media', version: '1' })
export class CurriculumPackMediaController {
  constructor(private readonly service: CurriculumPackMediaService) {}

  @Get()
  @ApiOperation({ summary: 'List media for an approved public curriculum pack' })
  async list(@Param('packId') packId: string): Promise<CurriculumPackMediaResponseDto[]> {
    return this.service.listPublic(packId);
  }
}
