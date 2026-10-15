import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  adoptFamilyLearningResourceSchema,
  createFamilyLearningResourceSchema,
  updateFamilyLearningResourceSchema,
  type AdoptFamilyLearningResourceDto,
  type CreateFamilyLearningResourceOutput,
  type FamilyLearningResourceResponseDto,
  type UpdateFamilyLearningResourceOutput,
} from '@aletheia/contracts';
import { FamilyTenantGuard, JwtAuthGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { FamilyLearningResourceService } from '../application/family-learning-resource.service.js';

@ApiTags('Curriculum')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/learning-resources', version: '1' })
export class FamilyLearningResourceController {
  constructor(private readonly service: FamilyLearningResourceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a private family learning resource' })
  async create(
    @Param('familyId') familyId: string,
    @Body(new ZodValidationPipe(createFamilyLearningResourceSchema)) dto: CreateFamilyLearningResourceOutput,
  ): Promise<FamilyLearningResourceResponseDto> {
    return this.service.create(familyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List learning resources owned by a family' })
  async list(@Param('familyId') familyId: string): Promise<FamilyLearningResourceResponseDto[]> {
    return this.service.list(familyId);
  }

  @Post('adopt')
  @ApiOperation({ summary: 'Adopt a public resource as a private family copy' })
  async adopt(
    @Param('familyId') familyId: string,
    @Body(new ZodValidationPipe(adoptFamilyLearningResourceSchema)) dto: AdoptFamilyLearningResourceDto,
  ): Promise<FamilyLearningResourceResponseDto> {
    return this.service.adopt(familyId, dto.sourceResourceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a family learning resource' })
  async get(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<FamilyLearningResourceResponseDto> {
    return this.service.get(familyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a family learning resource' })
  async update(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateFamilyLearningResourceSchema)) dto: UpdateFamilyLearningResourceOutput,
  ): Promise<FamilyLearningResourceResponseDto> {
    return this.service.update(familyId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a family learning resource' })
  async delete(@Param('familyId') familyId: string, @Param('id') id: string): Promise<void> {
    await this.service.delete(familyId, id);
  }
}
