import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import {
  grantConsentSchema,
  revokeConsentSchema,
  type ConsentComplianceCheckDto,
  type ConsentRecordResponseDto,
  type FamilyConsentOverviewDto,
  type GrantConsentDto,
  type RevokeConsentDto,
} from '@aletheia/contracts';
import { CurrentUser, FamilyTenantGuard, JwtAuthGuard } from '../../../platform/auth/index.js';
import type { AuthenticatedUserPayload } from '../../identity/application/public-api.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { FamilyConsentService } from '../application/family-consent.service.js';

@ApiTags('Family Consents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/consents', version: '1' })
export class FamilyConsentController {
  constructor(private readonly service: FamilyConsentService) {}

  @Get()
  @ApiOperation({ summary: 'Get family consent overview' })
  async getOverview(@Param('familyId') familyId: string): Promise<FamilyConsentOverviewDto> {
    return this.service.getFamilyConsentOverview(familyId);
  }

  @Get('compliance')
  @ApiOperation({ summary: 'Check mandatory consent compliance for family and optional learner' })
  async checkCompliance(
    @Param('familyId') familyId: string,
    @Query('learnerId') learnerId?: string,
  ): Promise<ConsentComplianceCheckDto> {
    return this.service.checkMandatoryCompliance(familyId, learnerId);
  }

  @Post('grant')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Grant consent for a definition (family or learner scoped)' })
  async grantConsent(
    @Param('familyId') familyId: string,
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body(new ZodValidationPipe(grantConsentSchema)) dto: GrantConsentDto,
    @Req() req: FastifyRequest,
  ): Promise<ConsentRecordResponseDto> {
    const context = this.extractContext(req);
    const userId = typeof user === 'string' ? user : user.userId;
    return this.service.grantConsent(familyId, userId, dto, context);
  }

  @Post('revoke')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Revoke an optional consent for a definition' })
  async revokeConsent(
    @Param('familyId') familyId: string,
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body(new ZodValidationPipe(revokeConsentSchema)) dto: RevokeConsentDto,
    @Req() req: FastifyRequest,
  ): Promise<ConsentRecordResponseDto> {
    const context = this.extractContext(req);
    const userId = typeof user === 'string' ? user : user.userId;
    return this.service.revokeConsent(familyId, userId, dto, context);
  }

  private extractContext(req: FastifyRequest): { ipAddress: string | null; userAgent: string | null } {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = req.ip || (Array.isArray(forwarded) ? forwarded[0] : forwarded) || null;
    const rawAgent = req.headers['user-agent'] || null;
    const userAgent = Array.isArray(rawAgent) ? rawAgent[0] : rawAgent;
    return {
      ipAddress: (ip as string) || null,
      userAgent: (userAgent as string) || null,
    };
  }
}
