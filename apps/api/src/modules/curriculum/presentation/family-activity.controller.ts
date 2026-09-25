import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createFamilyActivitySchema,
  updateFamilyActivitySchema,
  type CreateFamilyActivityOutput,
  type FamilyActivityResponseDto,
  type UpdateFamilyActivityOutput,
} from '@aletheia/contracts';
import { FamilyTenantGuard, JwtAuthGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { FamilyActivityService } from '../application/family-activity.service.js';

@ApiTags('Curriculum')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/activities', version: '1' })
export class FamilyActivityController {
  constructor(private readonly service: FamilyActivityService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a family-owned activity (issue #96 section 7, issue #245)' })
  async create(
    @Param('familyId') familyId: string,
    @Body(new ZodValidationPipe(createFamilyActivitySchema)) dto: CreateFamilyActivityOutput,
  ): Promise<FamilyActivityResponseDto> {
    return this.service.create(familyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List activities created by a family' })
  async list(@Param('familyId') familyId: string): Promise<FamilyActivityResponseDto[]> {
    return this.service.list(familyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a family activity' })
  async get(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<FamilyActivityResponseDto> {
    return this.service.get(familyId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a family activity, including its visibility' })
  async update(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateFamilyActivitySchema)) dto: UpdateFamilyActivityOutput,
  ): Promise<FamilyActivityResponseDto> {
    return this.service.update(familyId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a family activity' })
  async delete(@Param('familyId') familyId: string, @Param('id') id: string): Promise<void> {
    await this.service.delete(familyId, id);
  }
}
