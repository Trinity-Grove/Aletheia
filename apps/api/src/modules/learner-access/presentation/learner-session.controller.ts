import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { FastifyReply } from 'fastify';
import {
  learnerLoginSchema,
  learnerTokenLoginSchema,
  type LearnerAccessOptionDto,
  type LearnerLoginDto,
  type LearnerTokenLoginDto,
  type LearnerSessionResponseDto,
} from '@aletheia/contracts';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { ENVIRONMENT, type Environment } from '../../../platform/config/environment.js';
import { setLearnerSessionCookie, clearLearnerSessionCookie } from '../../../platform/auth/session-cookie.js';
import { LearnerAccessService } from '../application/learner-access.service.js';

// Unauthenticated by design: this is the entry point a child uses before
// any session exists. Authorization is the code itself (rate-limited and
// lockout-protected in the service), not a guard here.
@ApiTags('Learner Access (learner)')
@Controller({ path: 'learner-access', version: '1' })
export class LearnerSessionController {
  constructor(
    private readonly learnerAccessService: LearnerAccessService,
    @Inject(ENVIRONMENT) private readonly environment: Environment,
  ) {}

  @Get('families/:familyId/learners')
  @ApiOperation({ summary: 'List learners in a family with access enabled (names only)' })
  @ApiResponse({ status: 200, description: 'Learner id + display name, nothing else.' })
  async listLearners(@Param('familyId') familyId: string): Promise<LearnerAccessOptionDto[]> {
    return this.learnerAccessService.listAccessEnabledLearners(familyId);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @ApiOperation({ summary: "Exchange a learner's access code for a learner session cookie" })
  @ApiResponse({ status: 200, description: 'Session established; cookie set.' })
  @ApiResponse({ status: 401, description: 'Invalid learner id or code.' })
  @ApiResponse({ status: 403, description: 'Access disabled, or locked out after repeated failures.' })
  async login(
    @Body(new ZodValidationPipe(learnerLoginSchema)) dto: LearnerLoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<LearnerSessionResponseDto> {
    const { session, token } = await this.learnerAccessService.login(dto.learnerId, dto.code);
    setLearnerSessionCookie(reply, token, this.environment);
    return session;
  }

  @Post('token-login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: "Exchange a learner's access token for a learner session cookie" })
  @ApiResponse({ status: 200, description: 'Session established; cookie set.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired access token.' })
  @ApiResponse({ status: 403, description: 'Access disabled or revoked.' })
  async tokenLogin(
    @Body(new ZodValidationPipe(learnerTokenLoginSchema)) dto: LearnerTokenLoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<LearnerSessionResponseDto> {
    const { session, token } = await this.learnerAccessService.loginWithToken(dto.token);
    setLearnerSessionCookie(reply, token, this.environment);
    return session;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear the learner session cookie' })
  @ApiResponse({ status: 200, description: 'Cookie cleared.' })
  async logout(@Res({ passthrough: true }) reply: FastifyReply): Promise<{ success: true }> {
    clearLearnerSessionCookie(reply);
    return { success: true };
  }
}
