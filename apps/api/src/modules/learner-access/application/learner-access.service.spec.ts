import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LearnerAccessService } from './learner-access.service.js';
import { CodeHasher } from './code-hasher.js';
import { LearnerAccessGrantRepository } from '../infrastructure/learner-access-grant.repository.js';
import { LearnerAccessAttemptRepository } from '../infrastructure/learner-access-attempt.repository.js';
import { LearnerAccessGrantEntity } from '../domain/learner-access-grant.entity.js';
import type { LearnersPublicApi } from '../../learners/application/public-api.js';

const FAMILY_ID = 'fam-1';
const LEARNER_ID = 'learner-1';
const GUARDIAN_ID = 'guardian-1';

describe('LearnerAccessService', () => {
  let service: LearnerAccessService;
  let grants: Map<string, LearnerAccessGrantEntity>;
  let attempts: Map<string, { attemptCount: number; lockedUntil: Date | null }>;
  let learnersApi: jest.Mocked<LearnersPublicApi>;
  let codeHasher: CodeHasher;
  let jwtService: JwtService;

  beforeEach(() => {
    grants = new Map();
    attempts = new Map();
    codeHasher = new CodeHasher();
    jwtService = new JwtService({ secret: 'test-learner-secret' });

    const grantRepository = {
      findByLearnerId: async (learnerId: string) => grants.get(learnerId) ?? null,
      findEnabledByFamilyId: async (familyId: string) =>
        Array.from(grants.values()).filter((g) => g.familyId === familyId && g.enabled),
      upsertForLearner: async (params: {
        learnerId: string;
        familyId: string;
        codeHash: string;
        createdBy: string;
        isRegeneration: boolean;
      }) => {
        const existing = grants.get(params.learnerId);
        const entity = new LearnerAccessGrantEntity({
          id: existing?.id ?? `grant-${grants.size + 1}`,
          learnerId: params.learnerId,
          familyId: params.familyId,
          codeHash: params.codeHash,
          enabled: true,
          createdBy: params.createdBy,
          createdAt: existing?.createdAt ?? new Date(),
          regeneratedAt: params.isRegeneration ? new Date() : (existing?.regeneratedAt ?? null),
          revokedAt: null,
          lastUsedAt: existing?.lastUsedAt ?? null,
        });
        grants.set(params.learnerId, entity);
        return entity;
      },
      setEnabled: async (learnerId: string, enabled: boolean) => {
        const existing = grants.get(learnerId);
        if (!existing) return null;
        const entity = new LearnerAccessGrantEntity({
          id: existing.id,
          learnerId: existing.learnerId,
          familyId: existing.familyId,
          codeHash: existing.codeHash,
          enabled,
          createdBy: existing.createdBy,
          createdAt: existing.createdAt,
          regeneratedAt: existing.regeneratedAt,
          revokedAt: enabled ? null : new Date(),
          lastUsedAt: existing.lastUsedAt,
        });
        grants.set(learnerId, entity);
        return entity;
      },
      recordUsage: async (learnerId: string) => {
        const existing = grants.get(learnerId);
        if (!existing) return;
        grants.set(
          learnerId,
          new LearnerAccessGrantEntity({
            id: existing.id,
            learnerId: existing.learnerId,
            familyId: existing.familyId,
            codeHash: existing.codeHash,
            enabled: existing.enabled,
            createdBy: existing.createdBy,
            createdAt: existing.createdAt,
            regeneratedAt: existing.regeneratedAt,
            revokedAt: existing.revokedAt,
            lastUsedAt: new Date(),
          }),
        );
      },
    } as unknown as LearnerAccessGrantRepository;

    const attemptRepository = {
      isLocked: async (learnerId: string) => {
        const record = attempts.get(learnerId);
        return Boolean(record?.lockedUntil && record.lockedUntil > new Date());
      },
      recordFailure: async (learnerId: string) => {
        const existing = attempts.get(learnerId) ?? { attemptCount: 0, lockedUntil: null };
        const attemptCount = existing.attemptCount + 1;
        const lockedUntil = attemptCount >= 5 ? new Date(Date.now() + 5 * 60 * 1000) : existing.lockedUntil;
        attempts.set(learnerId, { attemptCount, lockedUntil });
      },
      reset: async (learnerId: string) => {
        attempts.set(learnerId, { attemptCount: 0, lockedUntil: null });
      },
    } as unknown as LearnerAccessAttemptRepository;

    learnersApi = {
      findLearnerById: jest.fn().mockResolvedValue({
        id: LEARNER_ID,
        firstName: 'Joana',
        lastName: null,
        preferredName: null,
        stage: 'PRIMARY_GRAMMAR',
        avatarColor: null,
      }),
      listActiveLearners: jest.fn().mockResolvedValue([
        {
          id: LEARNER_ID,
          firstName: 'Joana',
          lastName: null,
          preferredName: null,
          stage: 'PRIMARY_GRAMMAR',
          avatarColor: null,
        },
      ]),
    };

    service = new LearnerAccessService(grantRepository, attemptRepository, codeHasher, jwtService, learnersApi);
  });

  describe('grantAccess', () => {
    it('issues a plaintext code once and enables the grant', async () => {
      const result = await service.grantAccess(FAMILY_ID, LEARNER_ID, GUARDIAN_ID);

      expect(result.code).toHaveLength(8);
      expect(result.grant.enabled).toBe(true);
      expect(result.grant.learnerId).toBe(LEARNER_ID);
      expect(typeof result.accessToken).toBe('string');
      expect(result.accessUrl).toBe(`/aluno/login?token=${result.accessToken}`);
    });

    it('throws NotFoundException for a learner outside the family', async () => {
      learnersApi.findLearnerById.mockResolvedValue(null);

      await expect(service.grantAccess(FAMILY_ID, LEARNER_ID, GUARDIAN_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('login', () => {
    it('accepts the correct code and returns a session + token', async () => {
      const { code } = await service.grantAccess(FAMILY_ID, LEARNER_ID, GUARDIAN_ID);

      const result = await service.login(LEARNER_ID, code);

      expect(result.session.learnerId).toBe(LEARNER_ID);
      expect(result.session.familyId).toBe(FAMILY_ID);
      expect(result.session.displayName).toBe('Joana');
      expect(typeof result.token).toBe('string');
    });

    it('rejects an incorrect code', async () => {
      await service.grantAccess(FAMILY_ID, LEARNER_ID, GUARDIAN_ID);

      await expect(service.login(LEARNER_ID, 'WRONGCODE')).rejects.toThrow(UnauthorizedException);
    });

    it('rejects login when the grant is disabled', async () => {
      const { code } = await service.grantAccess(FAMILY_ID, LEARNER_ID, GUARDIAN_ID);
      await service.setEnabled(FAMILY_ID, LEARNER_ID, false);

      await expect(service.login(LEARNER_ID, code)).rejects.toThrow(ForbiddenException);
    });

    it('locks out after repeated failures, even with the correct code', async () => {
      const { code } = await service.grantAccess(FAMILY_ID, LEARNER_ID, GUARDIAN_ID);

      for (let i = 0; i < 5; i += 1) {
        await expect(service.login(LEARNER_ID, 'WRONGCODE')).rejects.toThrow(UnauthorizedException);
      }

      await expect(service.login(LEARNER_ID, code)).rejects.toThrow(ForbiddenException);
    });

    it('invalidates the old code once a new one is regenerated', async () => {
      const first = await service.grantAccess(FAMILY_ID, LEARNER_ID, GUARDIAN_ID);
      const second = await service.regenerateCode(FAMILY_ID, LEARNER_ID, GUARDIAN_ID);

      await expect(service.login(LEARNER_ID, first.code)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(LEARNER_ID, second.code)).resolves.toBeDefined();
    });
  });

  describe('loginWithToken', () => {
    it('accepts a valid access token and establishes a learner session', async () => {
      const { accessToken } = await service.grantAccess(FAMILY_ID, LEARNER_ID, GUARDIAN_ID);
      expect(accessToken).toBeDefined();

      const result = await service.loginWithToken(accessToken!);

      expect(result.session.learnerId).toBe(LEARNER_ID);
      expect(result.session.familyId).toBe(FAMILY_ID);
      expect(result.session.displayName).toBe('Joana');
      expect(typeof result.token).toBe('string');
    });

    it('rejects an invalid or malformed token', async () => {
      await expect(service.loginWithToken('invalid-jwt-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an access token if the grant was disabled', async () => {
      const { accessToken } = await service.grantAccess(FAMILY_ID, LEARNER_ID, GUARDIAN_ID);
      await service.setEnabled(FAMILY_ID, LEARNER_ID, false);

      await expect(service.loginWithToken(accessToken!)).rejects.toThrow(ForbiddenException);
    });

    it('rejects an old access token after code regeneration', async () => {
      const first = await service.grantAccess(FAMILY_ID, LEARNER_ID, GUARDIAN_ID);
      const second = await service.regenerateCode(FAMILY_ID, LEARNER_ID, GUARDIAN_ID);

      await expect(service.loginWithToken(first.accessToken!)).rejects.toThrow(UnauthorizedException);
      await expect(service.loginWithToken(second.accessToken!)).resolves.toBeDefined();
    });
  });

  describe('verifyLearnerToken', () => {
    it('accepts a token for a currently-enabled grant', async () => {
      const { code } = await service.grantAccess(FAMILY_ID, LEARNER_ID, GUARDIAN_ID);
      const { token } = await service.login(LEARNER_ID, code);

      const session = await service.verifyLearnerToken(token);
      expect(session).toEqual({ learnerId: LEARNER_ID, familyId: FAMILY_ID });
    });

    it('rejects a token whose grant was disabled after issuance', async () => {
      const { code } = await service.grantAccess(FAMILY_ID, LEARNER_ID, GUARDIAN_ID);
      const { token } = await service.login(LEARNER_ID, code);
      await service.setEnabled(FAMILY_ID, LEARNER_ID, false);

      await expect(service.verifyLearnerToken(token)).resolves.toBeNull();
    });

    it('rejects a token signed with a different secret', async () => {
      const foreignJwt = new JwtService({ secret: 'a-different-secret' });
      const foreignToken = await foreignJwt.signAsync({
        sub: LEARNER_ID,
        familyId: FAMILY_ID,
        typ: 'learner_session',
      });

      await expect(service.verifyLearnerToken(foreignToken)).resolves.toBeNull();
    });

    it('rejects a token missing the learner_session typ claim', async () => {
      const tokenWithoutTyp = await jwtService.signAsync({ sub: LEARNER_ID, familyId: FAMILY_ID });

      await expect(service.verifyLearnerToken(tokenWithoutTyp)).resolves.toBeNull();
    });
  });

  describe('listAccessEnabledLearners', () => {
    it('returns only learners with an enabled grant', async () => {
      await service.grantAccess(FAMILY_ID, LEARNER_ID, GUARDIAN_ID);

      const result = await service.listAccessEnabledLearners(FAMILY_ID);

      expect(result).toEqual([{ learnerId: LEARNER_ID, displayName: 'Joana' }]);
    });

    it('excludes a learner whose grant is disabled', async () => {
      await service.grantAccess(FAMILY_ID, LEARNER_ID, GUARDIAN_ID);
      await service.setEnabled(FAMILY_ID, LEARNER_ID, false);

      const result = await service.listAccessEnabledLearners(FAMILY_ID);

      expect(result).toEqual([]);
    });
  });
});
