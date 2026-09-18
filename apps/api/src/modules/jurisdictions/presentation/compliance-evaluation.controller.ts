import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createManualComplianceOverrideSchema,
  type ComplianceEvaluationResponseDto,
  type CreateManualComplianceOverrideDto,
  type ManualComplianceOverrideResponseDto,
} from '@aletheia/contracts';
import { CurrentUser, FamilyTenantGuard, JwtAuthGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { ComplianceEvaluationService } from '../application/compliance-evaluation.service.js';

@ApiTags('Compliance Evaluation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/compliance', version: '1' })
export class ComplianceEvaluationController {
  constructor(private readonly service: ComplianceEvaluationService) {}

  @Get('evaluate')
  @ApiOperation({
    summary: 'Evaluate compliance requirements against versioned jurisdiction rules and attendance',
  })
  async evaluate(
    @Param('familyId') familyId: string,
    @Query('learnerId') learnerId?: string,
    @Query('academicYearId') academicYearId?: string,
  ): Promise<ComplianceEvaluationResponseDto> {
    if (!learnerId) {
      throw new BadRequestException('O parâmetro learnerId é obrigatório para avaliação de conformidade.');
    }
    return this.service.evaluateCompliance(familyId, learnerId, academicYearId);
  }

  @Post('override')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record an audited manual compliance override with required justification',
  })
  async override(
    @Param('familyId') familyId: string,
    @CurrentUser('userId') actorId: string,
    @Body(new ZodValidationPipe(createManualComplianceOverrideSchema))
    dto: CreateManualComplianceOverrideDto,
  ): Promise<ManualComplianceOverrideResponseDto> {
    return this.service.recordManualOverride(familyId, actorId, dto);
  }
}
