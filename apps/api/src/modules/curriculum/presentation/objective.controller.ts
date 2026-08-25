import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard, FamilyTenantGuard } from '../../../platform/auth/index.js';
import { ObjectiveService } from '../application/objective.service.js';
import {
  createObjectiveSchema,
  updateObjectiveSchema,
  type CreateObjectiveDto,
  type ObjectiveResponseDto,
  type ObjectiveStatus,
  type UpdateObjectiveDto,
} from '@aletheia/contracts';

@Controller('families/:familyId/curriculum/objectives')
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
export class ObjectiveController {
  constructor(private readonly objectiveService: ObjectiveService) {}

  @Post()
  async createObjective(
    @Param('familyId') familyId: string,
    @Body() body: unknown,
  ): Promise<ObjectiveResponseDto> {
    const dto = createObjectiveSchema.parse(body) as CreateObjectiveDto;
    return this.objectiveService.createObjective(familyId, dto);
  }

  @Get()
  async listObjectives(
    @Param('familyId') familyId: string,
    @Query('learnerId') learnerId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('status') status?: string,
  ): Promise<ObjectiveResponseDto[]> {
    return this.objectiveService.listObjectives(familyId, {
      ...(learnerId ? { learnerId } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(academicYearId ? { academicYearId } : {}),
      ...(status ? { status: status as ObjectiveStatus } : {}),
    });
  }

  @Patch(':id')
  async updateObjective(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<ObjectiveResponseDto> {
    const dto = updateObjectiveSchema.parse(body) as UpdateObjectiveDto;
    return this.objectiveService.updateObjective(familyId, id, dto);
  }

  @Delete(':id')
  async deleteObjective(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const success = await this.objectiveService.deleteObjective(familyId, id);
    return { success };
  }
}
