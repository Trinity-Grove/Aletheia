import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import {
  createCurriculumPackSchema,
  type CreateCurriculumPackOutput,
  type CurriculumPackResponseDto,
  type AuthorTrustProfileResponseDto,
} from '@aletheia/contracts';
import type { AuthorTrustProfile } from '@prisma/client';
import { CurrentUser, JwtAuthGuard } from '../../../platform/auth/index.js';
import { SESSION_COOKIE_NAME } from '../../../platform/auth/session-cookie.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import {
  IDENTITY_PUBLIC_API,
  type IdentityPublicApi,
} from '../../identity/application/public-api.js';
import { CurriculumPackService } from '../application/curriculum-pack.service.js';
import { AuthorTrustService } from '../application/author-trust.service.js';

function extractToken(request: {
  headers: Record<string, unknown>;
  cookies?: Record<string, string | undefined>;
}): string | null {
  const cookieToken = request.cookies?.[SESSION_COOKIE_NAME];
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = request.headers['authorization'];
  if (typeof authHeader === 'string') {
    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() === 'bearer' && token) {
      return token;
    }
  }

  return null;
}

function toAuthorProfileDto(profile: AuthorTrustProfile): AuthorTrustProfileResponseDto {
  return {
    userId: profile.userId,
    trustScore: profile.trustScore,
    tier: profile.tier,
    approvedPacksCount: profile.approvedPacksCount,
    rejectedPacksCount: profile.rejectedPacksCount,
    upheldReportsCount: profile.upheldReportsCount,
    lastEvaluatedAt: profile.lastEvaluatedAt.toISOString(),
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

// Community endpoints for Curriculum Packs (Issue #102, Task 4).
// Public gallery listing, author-specific submissions, trust profile queries,
// and conditional visibility by pack approval or authorship.
@ApiTags('Curriculum Packs (Community)')
@Controller({ path: 'curriculum-packs', version: '1' })
export class CurriculumPackCommunityController {
  constructor(
    private readonly packService: CurriculumPackService,
    private readonly authorTrustService: AuthorTrustService,
    @Inject(IDENTITY_PUBLIC_API)
    private readonly identityPublicApi: IdentityPublicApi,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List public curriculum packs in gallery (approved & published)' })
  async listPublicPacks(): Promise<CurriculumPackResponseDto[]> {
    return this.packService.listPublicPacks();
  }

  @Get('my-packs')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List curriculum packs authored by the logged-in user' })
  async listMyAuthoredPacks(
    @CurrentUser('userId') userId: string,
  ): Promise<CurriculumPackResponseDto[]> {
    return this.packService.listMyAuthoredPacks(userId);
  }

  @Get('author-profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get AuthorTrustProfile of the logged-in user' })
  async getAuthorProfile(
    @CurrentUser('userId') userId: string,
  ): Promise<AuthorTrustProfileResponseDto> {
    const profile = await this.authorTrustService.getOrCreateProfile(userId);
    return toAuthorProfileDto(profile);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a community curriculum pack in DRAFT status' })
  async createCommunityPack(
    @CurrentUser('userId') userId: string,
    @Body(new ZodValidationPipe(createCurriculumPackSchema)) dto: CreateCurriculumPackOutput,
  ): Promise<CurriculumPackResponseDto> {
    return this.packService.createCommunityPack(userId, dto);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit a curriculum pack for moderation' })
  async submitPack(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ): Promise<CurriculumPackResponseDto> {
    return this.packService.submitPack(id, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get curriculum pack by ID (public if approved, or if user is author/admin)' })
  async getPack(
    @Param('id') id: string,
    @Req() req: FastifyRequest,
  ): Promise<CurriculumPackResponseDto> {
    const pack = await this.packService.getPack(id);
    if (pack.status === 'PUBLISHED' && pack.moderationStatus === 'APPROVED') {
      return pack;
    }

    const token = extractToken(req as unknown as { headers: Record<string, unknown>; cookies?: Record<string, string | undefined> });
    if (token) {
      const payload = await this.identityPublicApi.verifyToken(token);
      if (payload) {
        if (pack.authorUserId === payload.userId) {
          return pack;
        }
        const isAdmin = await this.identityPublicApi.isPlatformAdmin(payload.userId);
        if (isAdmin) {
          return pack;
        }
      }
    }

    throw new NotFoundException('Curriculum pack not found.');
  }
}
