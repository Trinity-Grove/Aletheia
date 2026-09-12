import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { progressionEvaluationQuerySchema, type ProgressionEvaluationQueryDto, type ProgressionEvaluationResponseDto } from '@aletheia/contracts';
import { FamilyTenantGuard, JwtAuthGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { ProgressionService } from '../application/progression.service.js';

@ApiTags('Curriculum Progression')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/curriculum/progression', version: '1' })
export class ProgressionController {
  constructor(private readonly service: ProgressionService) {}

  @Get('evaluation')
  @ApiOperation({ summary: 'Evaluate validated evidence and prerequisites without persisting achievements' })
  evaluate(
    @Param('familyId') familyId: string,
    @Query(new ZodValidationPipe(progressionEvaluationQuerySchema)) query: ProgressionEvaluationQueryDto,
  ): Promise<ProgressionEvaluationResponseDto> {
    return this.service.evaluate(familyId, query);
  }
}
