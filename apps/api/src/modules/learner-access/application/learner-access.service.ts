import { createHmac, timingSafeEqual } from 'node:crypto';
import { ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  LearnerAccessCodeDto,
  LearnerAccessGrantDto,
  LearnerAccessOptionDto,
  LearnerSessionResponseDto,
} from '@aletheia/contracts';
import {
  LEARNERS_PUBLIC_API,
  type LearnersPublicApi,
} from '../../learners/application/public-api.js';
import { LearnerAccessGrantRepository } from '../infrastructure/learner-access-grant.repository.js';
import { LearnerAccessAttemptRepository } from '../infrastructure/learner-access-attempt.repository.js';
import { CodeHasher } from './code-hasher.js';
import type { VerifiedLearnerSession } from './public-api.js';

const LEARNER_SESSION_TTL = '8h';
const LEARNER_SESSION_TTL_SECONDS = 8 * 60 * 60;

interface LearnerTokenPayload {
  sub: string;
  familyId: string;
  typ: 'learner_session';
}

interface LearnerAccessTokenPayload {
  sub: string;
  familyId: string;
  codeHash: string;
  typ: 'learner_access_token';
}

function displayNameFor(learner: {
  firstName: string;
  lastName?: string | null | undefined;
  preferredName?: string | null | undefined;
}): string {
  if (learner.preferredName && learner.preferredName.trim().length > 0) {
    return learner.preferredName.trim();
  }
  if (learner.lastName && learner.lastName.trim().length > 0) {
    return `${learner.firstName.trim()} ${learner.lastName.trim()}`;
  }
  return learner.firstName.trim();
}

@Injectable()
export class LearnerAccessService {
  constructor(
    private readonly grantRepository: LearnerAccessGrantRepository,
    private readonly attemptRepository: LearnerAccessAttemptRepository,
    private readonly codeHasher: CodeHasher,
    private readonly jwtService: JwtService,
    @Inject(LEARNERS_PUBLIC_API)
    private readonly learnersApi: LearnersPublicApi,
  ) {}

  // --- Guardian-facing (caller already validated by JwtAuthGuard + FamilyTenantGuard) ---

  async grantAccess(familyId: string, learnerId: string, guardianUserId: string): Promise<LearnerAccessCodeDto> {
    return this.issueCode(familyId, learnerId, guardianUserId, false);
  }

  async regenerateCode(familyId: string, learnerId: string, guardianUserId: string): Promise<LearnerAccessCodeDto> {
    return this.issueCode(familyId, learnerId, guardianUserId, true);
  }

  private async issueCode(
    familyId: string,
    learnerId: string,
    guardianUserId: string,
    isRegeneration: boolean,
  ): Promise<LearnerAccessCodeDto> {
    const learner = await this.learnersApi.findLearnerById(familyId, learnerId);
    if (!learner) {
      throw new NotFoundException(`Learner not found: ${learnerId}`);
    }

    const code = this.codeHasher.generateCode();
    const codeHash = this.codeHasher.hash(code);
    const grant = await this.grantRepository.upsertForLearner({
      learnerId,
      familyId,
      codeHash,
      createdBy: guardianUserId,
      isRegeneration,
    });

    const accessToken = this.createCompactAccessToken(learnerId, codeHash);
    const accessUrl = `/aluno/login?t=${accessToken}`;

    return { grant: grant.toDto(), code, accessToken, accessUrl };
  }

  async setEnabled(familyId: string, learnerId: string, enabled: boolean): Promise<LearnerAccessGrantDto> {
    const grant = await this.grantRepository.setEnabled(learnerId, enabled);
    if (!grant || grant.familyId !== familyId) {
      throw new NotFoundException(`No access grant exists for learner: ${learnerId}`);
    }
    return grant.toDto();
  }

  async getGrantStatus(familyId: string, learnerId: string): Promise<LearnerAccessGrantDto> {
    const grant = await this.grantRepository.findByLearnerId(learnerId);
    if (!grant || grant.familyId !== familyId) {
      return {
        learnerId,
        enabled: false,
        createdAt: null,
        regeneratedAt: null,
        lastUsedAt: null,
      };
    }
    const dto = grant.toDto();
    if (grant.enabled) {
      const accessToken = this.createCompactAccessToken(learnerId, grant.codeHash);
      dto.accessUrl = `/aluno/login?t=${accessToken}`;
    }
    return dto;
  }

  private createCompactAccessToken(learnerId: string, codeHash: string): string {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(learnerId);
    const idBuf = isUuid
      ? Buffer.from(learnerId.replace(/-/g, ''), 'hex')
      : Buffer.from(learnerId, 'utf-8');
    const secret = process.env.JWT_SECRET || 'aletheia-learner-compact-secret';
    const sig = createHmac('sha256', secret)
      .update(idBuf)
      .update(codeHash)
      .digest()
      .subarray(0, 10);
    const prefix = isUuid ? 'u_' : 's_';
    return `${prefix}${idBuf.toString('base64url')}.${sig.toString('base64url')}`;
  }

  private parseCompactAccessToken(token: string): { learnerId: string; sig: Buffer } | null {
    if (!token.startsWith('u_') && !token.startsWith('s_')) {
      return null;
    }
    const dotIndex = token.indexOf('.');
    if (dotIndex === -1) {
      return null;
    }
    try {
      const isUuid = token.startsWith('u_');
      const idPart = token.slice(2, dotIndex);
      const sigPart = token.slice(dotIndex + 1);
      const idBuf = Buffer.from(idPart, 'base64url');
      const sig = Buffer.from(sigPart, 'base64url');
      if (sig.length !== 10) {
        return null;
      }
      let learnerId: string;
      if (isUuid) {
        if (idBuf.length !== 16) return null;
        const hex = idBuf.toString('hex');
        learnerId = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
      } else {
        learnerId = idBuf.toString('utf-8');
      }
      return { learnerId, sig };
    } catch {
      return null;
    }
  }

  private verifyCompactAccessToken(learnerId: string, codeHash: string, sig: Buffer): boolean {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(learnerId);
    const idBuf = isUuid
      ? Buffer.from(learnerId.replace(/-/g, ''), 'hex')
      : Buffer.from(learnerId, 'utf-8');
    const secret = process.env.JWT_SECRET || 'aletheia-learner-compact-secret';
    const expectedSig = createHmac('sha256', secret)
      .update(idBuf)
      .update(codeHash)
      .digest()
      .subarray(0, 10);
    return sig.length === expectedSig.length && timingSafeEqual(sig, expectedSig);
  }

  // --- Public, unauthenticated (learner-facing) ---

  async listAccessEnabledLearners(familyId: string): Promise<LearnerAccessOptionDto[]> {
    const [grants, learners] = await Promise.all([
      this.grantRepository.findEnabledByFamilyId(familyId),
      this.learnersApi.listActiveLearners(familyId),
    ]);
    const enabledLearnerIds = new Set(grants.map((g) => g.learnerId));
    return learners
      .filter((learner) => enabledLearnerIds.has(learner.id))
      .map((learner) => ({ learnerId: learner.id, displayName: displayNameFor(learner) }));
  }

  async login(learnerId: string, code: string): Promise<{ session: LearnerSessionResponseDto; token: string }> {
    if (await this.attemptRepository.isLocked(learnerId)) {
      throw new ForbiddenException('Too many failed attempts. Try again in a few minutes.');
    }

    const grant = await this.grantRepository.findByLearnerId(learnerId);
    const valid = grant ? this.codeHasher.verify(code, grant.codeHash) : false;

    if (!grant || !valid) {
      await this.attemptRepository.recordFailure(learnerId);
      throw new UnauthorizedException('Invalid learner ID or code.');
    }

    if (!grant.enabled) {
      throw new ForbiddenException('Learner access is currently disabled.');
    }

    const learner = await this.learnersApi.findLearnerById(grant.familyId, learnerId);
    if (!learner) {
      throw new NotFoundException(`Learner not found: ${learnerId}`);
    }

    await Promise.all([this.attemptRepository.reset(learnerId), this.grantRepository.recordUsage(learnerId)]);

    const payload: LearnerTokenPayload = { sub: learnerId, familyId: grant.familyId, typ: 'learner_session' };
    const token = await this.jwtService.signAsync(payload, { expiresIn: LEARNER_SESSION_TTL });
    const expiresAt = new Date(Date.now() + LEARNER_SESSION_TTL_SECONDS * 1000).toISOString();

    return {
      token,
      session: {
        learnerId,
        familyId: grant.familyId,
        displayName: displayNameFor(learner),
        expiresAt,
      },
    };
  }

  async loginWithToken(token: string): Promise<{ session: LearnerSessionResponseDto; token: string }> {
    let learnerId: string;
    let expectedFamilyId: string | null = null;
    let requiredCodeHash: string | null = null;

    const compact = this.parseCompactAccessToken(token);
    if (compact) {
      learnerId = compact.learnerId;
      const grant = await this.grantRepository.findByLearnerId(learnerId);
      if (!grant) {
        throw new UnauthorizedException('Learner access grant not found.');
      }
      if (!grant.enabled) {
        throw new ForbiddenException('Learner access is currently disabled.');
      }
      if (!this.verifyCompactAccessToken(learnerId, grant.codeHash, compact.sig)) {
        throw new UnauthorizedException('This access link has expired because a new code was generated.');
      }
      expectedFamilyId = grant.familyId;
    } else {
      let payload: LearnerAccessTokenPayload;
      try {
        payload = await this.jwtService.verifyAsync<LearnerAccessTokenPayload>(token);
      } catch {
        throw new UnauthorizedException('Invalid or expired access token.');
      }

      if (payload.typ !== 'learner_access_token') {
        throw new UnauthorizedException('Invalid access token type.');
      }

      learnerId = payload.sub;
      expectedFamilyId = payload.familyId;
      requiredCodeHash = payload.codeHash;
    }

    const grant = await this.grantRepository.findByLearnerId(learnerId);
    if (!grant || (expectedFamilyId && grant.familyId !== expectedFamilyId)) {
      throw new UnauthorizedException('Learner access grant not found.');
    }

    if (!grant.enabled) {
      throw new ForbiddenException('Learner access is currently disabled.');
    }

    if (requiredCodeHash && requiredCodeHash !== grant.codeHash) {
      throw new UnauthorizedException('This access link has expired because a new code was generated.');
    }

    const learner = await this.learnersApi.findLearnerById(grant.familyId, learnerId);
    if (!learner) {
      throw new NotFoundException(`Learner not found: ${learnerId}`);
    }

    await Promise.all([this.attemptRepository.reset(learnerId), this.grantRepository.recordUsage(learnerId)]);

    const sessionPayload: LearnerTokenPayload = {
      sub: learnerId,
      familyId: grant.familyId,
      typ: 'learner_session',
    };
    const sessionToken = await this.jwtService.signAsync(sessionPayload, { expiresIn: LEARNER_SESSION_TTL });
    const expiresAt = new Date(Date.now() + LEARNER_SESSION_TTL_SECONDS * 1000).toISOString();

    return {
      token: sessionToken,
      session: {
        learnerId,
        familyId: grant.familyId,
        displayName: displayNameFor(learner),
        expiresAt,
      },
    };
  }

  // --- Consumed by LearnerAccessGuard (platform/auth) via public-api.ts ---

  async verifyLearnerToken(token: string): Promise<VerifiedLearnerSession | null> {
    let payload: LearnerTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<LearnerTokenPayload>(token);
    } catch {
      return null;
    }

    if (payload.typ !== 'learner_session') {
      return null;
    }

    // Re-checked on every request, not just at login: a guardian disabling
    // access must take effect on the learner's very next request.
    const grant = await this.grantRepository.findByLearnerId(payload.sub);
    if (!grant || !grant.enabled || grant.familyId !== payload.familyId) {
      return null;
    }

    return { learnerId: payload.sub, familyId: payload.familyId };
  }
}
