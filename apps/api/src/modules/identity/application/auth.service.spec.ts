import { JwtService } from '@nestjs/jwt';
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { verifySync } from 'otplib';
import { AuthService, type AuthSession, type LoginResult } from './auth.service.js';
import { PasswordHasher } from './password.hasher.js';
import { UserRepository } from '../infrastructure/user.repository.js';
import { UserEntity } from '../domain/user.entity.js';
import type {
  RefreshTokenRecord,
  RefreshTokenRepository,
} from '../infrastructure/refresh-token.repository.js';
import type {
  EmailVerificationTokenRecord,
  EmailVerificationTokenRepository,
} from '../infrastructure/email-verification-token.repository.js';
import type {
  PasswordResetTokenRecord,
  PasswordResetTokenRepository,
} from '../infrastructure/password-reset-token.repository.js';
import type {
  AccountAuditLogRecord,
  AccountAuditLogRepository,
} from '../infrastructure/account-audit-log.repository.js';
import type { MfaSecretRepository } from '../infrastructure/mfa-secret.repository.js';
import type { MfaRecoveryCodeRepository } from '../infrastructure/mfa-recovery-code.repository.js';
import type { MfaSetupChallengeRepository } from '../infrastructure/mfa-setup-challenge.repository.js';
import type { MfaLoginChallengeRepository } from '../infrastructure/mfa-login-challenge.repository.js';
import type { RegistrationVerificationChallengeRepository } from '../infrastructure/registration-verification-challenge.repository.js';
import { TotpSecretCipher } from '../../../platform/security/totp-secret-cipher.js';
import { hashRecoveryCode } from '../../../platform/security/totp.js';
import type { MailMessage, MailSender } from '../../../platform/mail/mail-sender.js';
import type { Environment } from '../../../platform/config/environment.js';
import type { AccountAuditEventType, ConsentDefinitionResponseDto } from '@aletheia/contracts';
import type { PrivacyPublicApi } from '../../privacy/application/public-api.js';

const NOW_ISO = new Date().toISOString();

function fakeConsentDefinition(code: string): ConsentDefinitionResponseDto {
  return {
    id: `consent-def-${code}`,
    code,
    version: 1,
    status: 'PUBLISHED',
    schemaVersion: 1,
    scope: 'FAMILY',
    mandatory: true,
    title: code,
    description: null,
    content: 'placeholder',
    purposes: ['test'],
    metadata: null,
    publishedAt: NOW_ISO,
    deprecatedAt: null,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  };
}

// Tests register with countryCode: 'BRA' by default, so LGPD must always
// be resolvable; a couple of tests exercise other regimes explicitly.
const FAKE_PUBLISHED_FAMILY_DEFINITIONS: ConsentDefinitionResponseDto[] = [
  fakeConsentDefinition('TERMS_OF_USE_LGPD'),
  fakeConsentDefinition('PRIVACY_POLICY_LGPD'),
  fakeConsentDefinition('TERMS_OF_USE_GDPR'),
  fakeConsentDefinition('PRIVACY_POLICY_GDPR'),
  fakeConsentDefinition('TERMS_OF_USE_GENERIC'),
  fakeConsentDefinition('PRIVACY_POLICY_GENERIC'),
];

const fakePrivacyPublicApi: PrivacyPublicApi = {
  getPublishedDefinitions: async () => FAKE_PUBLISHED_FAMILY_DEFINITIONS,
  checkMandatoryCompliance: async () => ({ compliant: true, pendingMandatoryTerms: [] }),
  grantConsent: async () => {
    throw new Error('not used by AuthService tests');
  },
  recordSensitiveDataAccess: async () => {
    // not used by AuthService tests
  },
};

// otplib v13 ships ESM-only runtime deps that ts-jest can't transform. The
// unit tests assert service orchestration, not real TOTP math (that's the
// integration suite), so mock the library and drive verifyTotpToken's
// outcome by controlling verifySync per test.
jest.mock('otplib', () => ({
  generateSecret: jest.fn(() => 'FAKESECRET'),
  generateURI: jest.fn(() => 'otpauth://totp/Aletheia:user?secret=FAKESECRET'),
  verifySync: jest.fn(() => ({ valid: false, delta: undefined })),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let fakeUsers: Map<string, UserEntity>;
  let hasher: PasswordHasher;
  let jwtService: JwtService;
  let fakeRefreshTokens: Map<string, RefreshTokenRecord & { plainToken: string }>;
  let refreshTokenRepository: RefreshTokenRepository;
  let fakeVerificationTokens: Map<string, EmailVerificationTokenRecord & { plainToken: string }>;
  let emailVerificationTokenRepository: EmailVerificationTokenRepository;
  let fakePasswordResetTokens: Map<string, PasswordResetTokenRecord & { plainToken: string }>;
  let passwordResetTokenRepository: PasswordResetTokenRepository;
  let auditLog: (AccountAuditLogRecord & { userId: string })[];
  let accountAuditLogRepository: AccountAuditLogRepository;
  let sentEmails: MailMessage[];
  let mailSender: MailSender;
  let environment: Environment;
  let mfaSecretRepository: MfaSecretRepository;
  let mfaRecoveryCodeRepository: MfaRecoveryCodeRepository;
  let mfaSetupChallengeRepository: MfaSetupChallengeRepository;
  let mfaLoginChallengeRepository: MfaLoginChallengeRepository;
  let registrationChallengeRepository: RegistrationVerificationChallengeRepository;
  let fakeRegistrationChallenges: Map<string, { id: string; userId: string; codeHash: string; plainCode: string; attemptCount: number; expiresAt: Date }>;
  let totpSecretCipher: TotpSecretCipher;
  let capturedCreateCalls: Array<{
    termsOfUseDefinitionId: string;
    privacyPolicyDefinitionId: string;
  }>;
  let fakeSetupChallenges: Map<
    string,
    { id: string; encryptedSecret: string; recoveryCodeHashes: string[]; expiresAt: Date }
  >;
  let fakeLoginChallenges: Map<
    string,
    { id: string; userId: string; attemptCount: number; expiresAt: Date }
  >;
  let fakeMfaSecrets: Map<
    string,
    { userId: string; encryptedSecret: string; createdAt: Date }
  >;
  let fakeRecoveryCodes: Map<string, Array<{ userId: string; codeHash: string; usedAt: Date | null }>>;
  let setUserMfa: (mfaEnabled: boolean, userId?: string) => void;

  function expectAuthSession(result: LoginResult): asserts result is AuthSession {
    if (!('accessToken' in result)) {
      throw new Error('Expected an AuthSession, but login returned an MFA challenge.');
    }
  }

  // The fake repository stashes the plaintext code directly (unlike the
  // real one, which only exposes it through the environment-gated debug
  // endpoint) -- fine for a unit test that already fully controls this map.
  function getPendingRegistrationCode(challengeToken: string): string {
    const record = fakeRegistrationChallenges.get(challengeToken);
    if (!record) {
      throw new Error(`No pending registration challenge for token ${challengeToken}`);
    }
    return record.plainCode;
  }

  // Setup helper for every other describe block that just needs "a
  // confirmed, logged-in guardian" and isn't itself testing the
  // register()/confirmRegistrationCode() flow -- register() alone no
  // longer returns a session (see the 'register' describe block below
  // for tests of that flow directly).
  type RegisterGuardianArgs = Parameters<AuthService['register']>[0];
  async function registerAndConfirm(dto: RegisterGuardianArgs): Promise<AuthSession> {
    const challenge = await authService.register(dto);
    const code = getPendingRegistrationCode(challenge.challengeToken);
    return authService.confirmRegistrationCode({ challengeToken: challenge.challengeToken, code });
  }

  it.each([false, true])('exposes persisted platform admin=%s in registration, login, refresh and profile', async (isAdmin) => {
    environment.platformAdminEmails = isAdmin ? ['admin@example.com'] : [];
    const registered = await registerAndConfirm({ email: 'admin@example.com', fullName: 'Admin', password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
    expect(registered.user).toHaveProperty('isPlatformAdmin', isAdmin);
    const loggedIn = await authService.login({ email: 'admin@example.com', password: 'password12345' });
    expectAuthSession(loggedIn);
    expect(loggedIn.user).toHaveProperty('isPlatformAdmin', isAdmin);
    expect((await authService.refresh(loggedIn.refreshToken)).user).toHaveProperty('isPlatformAdmin', isAdmin);
    expect(await authService.getProfile(registered.user.id)).toHaveProperty('isPlatformAdmin', isAdmin);
  });

  it('returns the newly granted platform admin flag on the first login after bootstrap changes', async () => {
    await registerAndConfirm({ email: 'admin@example.com', fullName: 'Admin', password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
    environment.platformAdminEmails = ['admin@example.com'];
    const result = await authService.login({ email: 'admin@example.com', password: 'password12345' });
    expectAuthSession(result);
    expect(result.user).toHaveProperty('isPlatformAdmin', true);
  });

  beforeEach(() => {
    fakeUsers = new Map();
    capturedCreateCalls = [];
    hasher = new PasswordHasher();
    jwtService = new JwtService({ secret: 'test-secret' });

    const mockRepo = {
      findByEmail: async (email: string) => fakeUsers.get(email.toLowerCase().trim()) ?? null,
      findById: async (id: string) => {
        for (const user of fakeUsers.values()) {
          if (user.id === id) return user;
        }
        return null;
      },
      create: async (data: {
        email: string;
        passwordHash: string;
        fullName: string;
        termsOfUseDefinitionId: string;
        privacyPolicyDefinitionId: string;
        emailVerificationRequired?: boolean;
      }) => {
        capturedCreateCalls.push({
          termsOfUseDefinitionId: data.termsOfUseDefinitionId,
          privacyPolicyDefinitionId: data.privacyPolicyDefinitionId,
        });
        const entity = new UserEntity({
          id: 'user-uuid-1',
          email: data.email.toLowerCase().trim(),
          passwordHash: data.passwordHash,
          fullName: data.fullName,
          emailVerifiedAt: null,
          emailVerificationRequired: data.emailVerificationRequired ?? false,
          mfaEnabled: false,
          isPlatformAdmin: false,
          disabledAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        fakeUsers.set(entity.email, entity);
        return entity;
      },
      markEmailVerified: async (id: string) => {
        for (const [email, user] of fakeUsers.entries()) {
          if (user.id === id) {
            fakeUsers.set(
              email,
              new UserEntity({
                id: user.id,
                email: user.email,
                passwordHash: user.passwordHash,
                fullName: user.fullName,
                emailVerifiedAt: new Date(),
                emailVerificationRequired: false,
                mfaEnabled: user.mfaEnabled,
                isPlatformAdmin: user.isPlatformAdmin,
                disabledAt: user.disabledAt,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              }),
            );
          }
        }
      },
      updatePassword: async (id: string, passwordHash: string) => {
        for (const [email, user] of fakeUsers.entries()) {
          if (user.id === id) {
            fakeUsers.set(
              email,
              new UserEntity({
                id: user.id,
                email: user.email,
                passwordHash,
                fullName: user.fullName,
                emailVerifiedAt: user.emailVerifiedAt,
                emailVerificationRequired: user.emailVerificationRequired,
                mfaEnabled: user.mfaEnabled,
                isPlatformAdmin: user.isPlatformAdmin,
                disabledAt: user.disabledAt,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              }),
            );
          }
        }
      },
      updateEmail: async (id: string, email: string) => {
        // Find the entry first, then mutate the map — deleting and
        // inserting while iterating a live Map risks revisiting the newly
        // inserted entry (same id) and looping forever.
        const match = [...fakeUsers.entries()].find(([, user]) => user.id === id);
        if (match) {
          const [oldEmail, user] = match;
          fakeUsers.delete(oldEmail);
          fakeUsers.set(
            email,
            new UserEntity({
              id: user.id,
              email,
              passwordHash: user.passwordHash,
              fullName: user.fullName,
              emailVerifiedAt: null,
              emailVerificationRequired: user.emailVerificationRequired,
              mfaEnabled: user.mfaEnabled,
              isPlatformAdmin: user.isPlatformAdmin,
              disabledAt: user.disabledAt,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            }),
          );
        }
      },
      grantPlatformAdmin: async (id: string) => {
        for (const [email, user] of fakeUsers.entries()) {
          if (user.id === id) {
            fakeUsers.set(
              email,
              new UserEntity({
                id: user.id,
                email: user.email,
                passwordHash: user.passwordHash,
                fullName: user.fullName,
                emailVerifiedAt: user.emailVerifiedAt,
                emailVerificationRequired: user.emailVerificationRequired,
                mfaEnabled: user.mfaEnabled,
                isPlatformAdmin: true,
                disabledAt: user.disabledAt,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              }),
            );
          }
        }
      },
      revokePlatformAdmin: async (id: string) => {
        for (const [email, user] of fakeUsers.entries()) {
          if (user.id === id) {
            fakeUsers.set(
              email,
              new UserEntity({
                id: user.id,
                email: user.email,
                passwordHash: user.passwordHash,
                fullName: user.fullName,
                emailVerifiedAt: user.emailVerifiedAt,
                emailVerificationRequired: user.emailVerificationRequired,
                mfaEnabled: user.mfaEnabled,
                isPlatformAdmin: false,
                disabledAt: user.disabledAt,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              }),
            );
          }
        }
      },
      updateFullName: async (id: string, fullName: string) => {
        for (const [email, user] of fakeUsers.entries()) {
          if (user.id === id) {
            fakeUsers.set(
              email,
              new UserEntity({
                id: user.id,
                email: user.email,
                passwordHash: user.passwordHash,
                fullName,
                emailVerifiedAt: user.emailVerifiedAt,
                emailVerificationRequired: user.emailVerificationRequired,
                mfaEnabled: user.mfaEnabled,
                isPlatformAdmin: user.isPlatformAdmin,
                disabledAt: user.disabledAt,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              }),
            );
          }
        }
      },
      setDisabled: async (id: string, disabledAt: Date | null) => {
        for (const [email, user] of fakeUsers.entries()) {
          if (user.id === id) {
            fakeUsers.set(
              email,
              new UserEntity({
                id: user.id,
                email: user.email,
                passwordHash: user.passwordHash,
                fullName: user.fullName,
                emailVerifiedAt: user.emailVerifiedAt,
                emailVerificationRequired: user.emailVerificationRequired,
                mfaEnabled: user.mfaEnabled,
                isPlatformAdmin: user.isPlatformAdmin,
                disabledAt,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              }),
            );
          }
        }
      },
      findAll: async (params: { skip: number; take: number; search?: string }) => {
        let all = [...fakeUsers.values()];
        if (params.search) {
          const needle = params.search.toLowerCase();
          all = all.filter(
            (user) =>
              user.email.toLowerCase().includes(needle) || user.fullName.toLowerCase().includes(needle),
          );
        }
        all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const totalCount = all.length;
        const users = all.slice(params.skip, params.skip + params.take);
        return { users, totalCount };
      },
    } as unknown as UserRepository;

    fakeRefreshTokens = new Map();
    let refreshSequence = 0;
    refreshTokenRepository = {
      issue: async (userId: string) => {
        refreshSequence += 1;
        const token = `refresh-token-${refreshSequence}`;
        fakeRefreshTokens.set(token, {
          id: `rt-${refreshSequence}`,
          userId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          revokedAt: null,
          plainToken: token,
        });
        return { token, expiresAt: fakeRefreshTokens.get(token)!.expiresAt };
      },
      findByToken: async (token: string) => fakeRefreshTokens.get(token) ?? null,
      revokeByToken: async (token: string) => {
        const record = fakeRefreshTokens.get(token);
        if (record && !record.revokedAt) {
          record.revokedAt = new Date();
        }
      },
      revokeAllForUser: async (userId: string) => {
        for (const record of fakeRefreshTokens.values()) {
          if (record.userId === userId && !record.revokedAt) {
            record.revokedAt = new Date();
          }
        }
      },
    } as unknown as RefreshTokenRepository;

    fakeVerificationTokens = new Map();
    let verificationSequence = 0;
    emailVerificationTokenRepository = {
      issue: async (userId: string) => {
        verificationSequence += 1;
        const token = `verify-token-${verificationSequence}`;
        fakeVerificationTokens.set(token, {
          id: `evt-${verificationSequence}`,
          userId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          usedAt: null,
          plainToken: token,
        });
        return { token, expiresAt: fakeVerificationTokens.get(token)!.expiresAt };
      },
      findByToken: async (token: string) => fakeVerificationTokens.get(token) ?? null,
      markUsed: async (id: string) => {
        for (const record of fakeVerificationTokens.values()) {
          if (record.id === id) {
            record.usedAt = new Date();
          }
        }
      },
    } as unknown as EmailVerificationTokenRepository;

    fakePasswordResetTokens = new Map();
    let resetSequence = 0;
    passwordResetTokenRepository = {
      issue: async (userId: string) => {
        resetSequence += 1;
        const token = `reset-token-${resetSequence}`;
        fakePasswordResetTokens.set(token, {
          id: `prt-${resetSequence}`,
          userId,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          usedAt: null,
          plainToken: token,
        });
        return { token, expiresAt: fakePasswordResetTokens.get(token)!.expiresAt };
      },
      findByToken: async (token: string) => fakePasswordResetTokens.get(token) ?? null,
      markUsed: async (id: string) => {
        for (const record of fakePasswordResetTokens.values()) {
          if (record.id === id) {
            record.usedAt = new Date();
          }
        }
      },
    } as unknown as PasswordResetTokenRepository;

    auditLog = [];
    let auditSequence = 0;
    accountAuditLogRepository = {
      record: async (userId: string, eventType: AccountAuditEventType) => {
        auditSequence += 1;
        auditLog.push({ id: `audit-${auditSequence}`, userId, eventType, createdAt: new Date() });
      },
      listForUser: async (userId: string) =>
        auditLog
          .filter((entry) => entry.userId === userId)
          .slice()
          .reverse(),
    } as unknown as AccountAuditLogRepository;

    sentEmails = [];
    mailSender = {
      send: async (message: MailMessage) => {
        sentEmails.push(message);
      },
    };

    environment = {
      webOrigin: 'http://localhost:3000',
      nodeEnv: 'test' as string,
      platformAdminEmails: [] as string[],
      platformAdminDomains: [] as string[],
    } as unknown as Environment;

    fakeSetupChallenges = new Map();
    fakeLoginChallenges = new Map();
    fakeMfaSecrets = new Map();
    fakeRecoveryCodes = new Map();
    setUserMfa = (mfaEnabled: boolean, userId: string = 'user-uuid-1') => {
      const match = [...fakeUsers.entries()].find(([, user]) => user.id === userId);
      if (!match) return;
      const [email, user] = match;
      fakeUsers.set(
        email,
        new UserEntity({
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
          fullName: user.fullName,
          emailVerifiedAt: user.emailVerifiedAt,
          emailVerificationRequired: user.emailVerificationRequired,
          mfaEnabled,
          isPlatformAdmin: user.isPlatformAdmin,
          disabledAt: user.disabledAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }),
      );
    };
    let setupSequence = 0;
    let loginSequence = 0;

    mfaSecretRepository = {
      findByUserId: async (userId: string) => fakeMfaSecrets.get(userId) ?? null,
      activateMfa: async (
        userId: string,
        encryptedSecret: string,
        recoveryCodeHashes: string[],
      ) => {
        fakeMfaSecrets.set(userId, { userId, encryptedSecret, createdAt: new Date() });
        fakeRecoveryCodes.set(
          userId,
          recoveryCodeHashes.map((codeHash: string) => ({ userId, codeHash, usedAt: null })),
        );
        fakeSetupChallenges.delete(userId);
        setUserMfa(true, userId);
      },
      deactivateMfa: async (userId: string) => {
        fakeMfaSecrets.delete(userId);
        fakeRecoveryCodes.delete(userId);
        setUserMfa(false, userId);
      },
    } as unknown as MfaSecretRepository;

    mfaRecoveryCodeRepository = {
      markUsed: async (userId: string, code: string) => {
        const codeHash = hashRecoveryCode(code);
        const list = fakeRecoveryCodes.get(userId) ?? [];
        const idx = list.findIndex(
          (entry) => entry.codeHash === codeHash && !entry.usedAt,
        );
        if (idx === -1) return false;
        list[idx]!.usedAt = new Date();
        fakeRecoveryCodes.set(userId, list);
        return true;
      },
    } as unknown as MfaRecoveryCodeRepository;

    mfaSetupChallengeRepository = {
      findByUserId: async (userId: string) => fakeSetupChallenges.get(userId) ?? null,
      upsert: async (
        userId: string,
        encryptedSecret: string,
        recoveryCodeHashes: string[],
        expiresAt: Date,
      ) => {
        const record = { userId, encryptedSecret, recoveryCodeHashes, expiresAt, id: `sc-${++setupSequence}` };
        fakeSetupChallenges.set(userId, record);
        return record;
      },
    } as unknown as MfaSetupChallengeRepository;

    mfaLoginChallengeRepository = {
      issue: async (userId: string) => {
        const token = `mfa-challenge-token-${++loginSequence}`;
        fakeLoginChallenges.set(token, {
          id: `lc-${loginSequence}`,
          userId,
          attemptCount: 0,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        return { token, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
      },
      findByToken: async (token: string) => fakeLoginChallenges.get(token) ?? null,
      deleteByToken: async (token: string) => {
        fakeLoginChallenges.delete(token);
      },
      recordFailedAttempt: async (token: string) => {
        const record = fakeLoginChallenges.get(token);
        // Simulates the atomic cap: once the 5th attempt is reached the
        // challenge is deleted and can no longer be used.
        if (!record) {
          return { exhausted: true };
        }
        record.attemptCount += 1;
        if (record.attemptCount >= 5) {
          fakeLoginChallenges.delete(token);
          return { exhausted: true };
        }
        return { exhausted: false };
      },
    } as unknown as MfaLoginChallengeRepository;

    fakeRegistrationChallenges = new Map();
    let registrationChallengeSequence = 0;
    registrationChallengeRepository = {
      issue: async (userId: string) => {
        // Mirrors the real repository: reissuing replaces any prior
        // pending challenge for the same user, invalidating its code.
        for (const [token, record] of fakeRegistrationChallenges.entries()) {
          if (record.userId === userId) {
            fakeRegistrationChallenges.delete(token);
          }
        }
        registrationChallengeSequence += 1;
        const token = `registration-challenge-token-${registrationChallengeSequence}`;
        const code = String(registrationChallengeSequence).padStart(6, '0');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        fakeRegistrationChallenges.set(token, {
          id: `rc-${registrationChallengeSequence}`,
          userId,
          codeHash: `hash:${code}`,
          plainCode: code,
          attemptCount: 0,
          expiresAt,
        });
        return { token, code, expiresAt };
      },
      findByToken: async (token: string) => {
        const record = fakeRegistrationChallenges.get(token);
        if (!record) return null;
        return { id: record.id, userId: record.userId, codeHash: record.codeHash, expiresAt: record.expiresAt };
      },
      matchesCode: (record: { codeHash: string }, code: string) => `hash:${code}` === record.codeHash,
      findPlainCodeForDebugOnly: async (token: string) => {
        if (environment.nodeEnv === 'production') return null;
        return fakeRegistrationChallenges.get(token)?.plainCode ?? null;
      },
      deleteByToken: async (token: string) => {
        fakeRegistrationChallenges.delete(token);
      },
      recordFailedAttempt: async (token: string) => {
        const record = fakeRegistrationChallenges.get(token);
        if (!record) {
          return { exhausted: true };
        }
        record.attemptCount += 1;
        if (record.attemptCount >= 5) {
          fakeRegistrationChallenges.delete(token);
          return { exhausted: true };
        }
        return { exhausted: false };
      },
    } as unknown as RegistrationVerificationChallengeRepository;

    totpSecretCipher = new TotpSecretCipher(
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    );

    authService = new AuthService(
      mockRepo,
      hasher,
      jwtService,
      refreshTokenRepository,
      emailVerificationTokenRepository,
      passwordResetTokenRepository,
      accountAuditLogRepository,
      mfaSecretRepository,
      mfaRecoveryCodeRepository,
      mfaSetupChallengeRepository,
      mfaLoginChallengeRepository,
      registrationChallengeRepository,
      totpSecretCipher,
      fakePrivacyPublicApi,
      mailSender,
      environment,
    );
  });

  it('rejects passwords shorter than 8 characters', async () => {
    await expect(
      authService.register({
        email: 'parent@example.com',
        fullName: 'Parent User',
        password: 'short', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true }),
    ).rejects.toThrow(BadRequestException);
  });

  it('registers a guardian and returns an email confirmation challenge, not a session', async () => {
    const result = await authService.register({
      email: 'guardian@example.com',
      fullName: 'Faithful Guardian',
      password: 'strongPassword123!', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

    expect(result).toStrictEqual({ emailConfirmationRequired: true, challengeToken: expect.any(String) });
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0]!.to).toBe('guardian@example.com');

    const createdUser = fakeUsers.get('guardian@example.com');
    expect(createdUser?.emailVerifiedAt).toBeNull();
    expect(createdUser?.emailVerificationRequired).toBe(true);
  });

  it('confirms registration with the emailed 6-digit code and issues a full session', async () => {
    const challenge = await authService.register({
      email: 'guardian@example.com',
      fullName: 'Faithful Guardian',
      password: 'strongPassword123!', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

    const code = getPendingRegistrationCode(challenge.challengeToken);
    const session = await authService.confirmRegistrationCode({
      challengeToken: challenge.challengeToken,
      code,
    });

    expect(session.accessToken).toBeDefined();
    expect(session.refreshToken).toBeDefined();
    expect(session.user.email).toBe('guardian@example.com');
    expect(session.user.emailVerified).toBe(true);
  });

  it('rejects the wrong 6-digit code and locks the challenge out after 5 attempts', async () => {
    const challenge = await authService.register({
      email: 'guardian@example.com',
      fullName: 'Faithful Guardian',
      password: 'strongPassword123!', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
    // Captured before exhausting attempts -- the challenge (and its
    // record backing this helper) is deleted once the cap is hit.
    const code = getPendingRegistrationCode(challenge.challengeToken);

    for (let attempt = 0; attempt < 5; attempt++) {
      await expect(
        authService.confirmRegistrationCode({ challengeToken: challenge.challengeToken, code: '000000' }),
      ).rejects.toThrow(BadRequestException);
    }

    // The challenge is now exhausted/deleted -- even the real code no longer works.
    await expect(
      authService.confirmRegistrationCode({ challengeToken: challenge.challengeToken, code }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects an expired registration challenge', async () => {
    const challenge = await authService.register({
      email: 'guardian@example.com',
      fullName: 'Faithful Guardian',
      password: 'strongPassword123!', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

    const record = fakeRegistrationChallenges.get(challenge.challengeToken);
    record!.expiresAt = new Date(Date.now() - 1000);

    const code = getPendingRegistrationCode(challenge.challengeToken);
    await expect(
      authService.confirmRegistrationCode({ challengeToken: challenge.challengeToken, code }),
    ).rejects.toThrow(NotFoundException);
  });

  it('resend-code invalidates the previous code and issues a new challengeToken', async () => {
    const challenge = await authService.register({
      email: 'guardian@example.com',
      fullName: 'Faithful Guardian',
      password: 'strongPassword123!', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

    const oldCode = getPendingRegistrationCode(challenge.challengeToken);
    const resent = await authService.resendRegistrationCode(challenge.challengeToken);

    expect(resent.challengeToken).not.toBe(challenge.challengeToken);
    await expect(
      authService.confirmRegistrationCode({ challengeToken: challenge.challengeToken, code: oldCode }),
    ).rejects.toThrow(NotFoundException);

    const newCode = getPendingRegistrationCode(resent.challengeToken);
    const session = await authService.confirmRegistrationCode({
      challengeToken: resent.challengeToken,
      code: newCode,
    });
    expect(session.accessToken).toBeDefined();
  });

  it('reissues a fresh challenge when logging in before confirming, instead of a session', async () => {
    await authService.register({
      email: 'guardian@example.com',
      fullName: 'Faithful Guardian',
      password: 'strongPassword123!', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

    const loginResult = await authService.login({
      email: 'guardian@example.com',
      password: 'strongPassword123!',
    });

    expect('emailConfirmationRequired' in loginResult).toBe(true);
    const { challengeToken } = loginResult as { challengeToken: string };
    const code = getPendingRegistrationCode(challengeToken);
    const session = await authService.confirmRegistrationCode({ challengeToken, code });
    expect(session.accessToken).toBeDefined();
  });

  it('never exposes the pending code through findPendingRegistrationCodeForDebugOnly in production', async () => {
    const challenge = await authService.register({
      email: 'guardian@example.com',
      fullName: 'Faithful Guardian',
      password: 'strongPassword123!', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

    environment.nodeEnv = 'production';
    await expect(
      authService.findPendingRegistrationCodeForDebugOnly(challenge.challengeToken),
    ).resolves.toBeNull();
  });

  it('does not fail registration when the mail sender throws', async () => {
    mailSender.send = async () => {
      throw new Error('Resend is down');
    };

    await expect(
      authService.register({
        email: 'guardian@example.com',
        fullName: 'Faithful Guardian',
        password: 'strongPassword123!', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true }),
    ).resolves.toMatchObject({ emailConfirmationRequired: true });
    expect(fakeUsers.get('guardian@example.com')).toBeDefined();
  });

  it('rejects duplicate email registration with a generic, non-revealing message', async () => {
    await registerAndConfirm({
      email: 'duplicate@example.com',
      fullName: 'First',
      password: 'password123', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

    await expect(
      authService.register({
        email: 'duplicate@example.com',
        fullName: 'Second',
        password: 'password123', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true }),
    ).rejects.toThrow(BadRequestException);

    // Anti-enumeration: the message must not confirm an account exists —
    // a caller probing emails should see the same shape of error a weak
    // password already produces, not a distinct "already exists" signal.
    expect.assertions(4);
    try {
      await registerAndConfirm({
        email: 'duplicate@example.com',
        fullName: 'Second',
        password: 'password123', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const message = (error as BadRequestException).message;
      expect(message.toLowerCase()).not.toContain('already exist');
      expect(message.toLowerCase()).not.toContain('já existe');
    }
  });

  it('authenticates valid credentials on login', async () => {
    await registerAndConfirm({
      email: 'login@example.com',
      fullName: 'User',
      password: 'securePassword888', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

    const loginResult = await authService.login({
      email: 'login@example.com',
      password: 'securePassword888',
    });

    expectAuthSession(loginResult);
    expect(loginResult.accessToken).toBeDefined();
    expect(loginResult.user.email).toBe('login@example.com');
  });

  it('issues a session token that verifyToken accepts', async () => {
    await registerAndConfirm({
      email: 'verify@example.com',
      fullName: 'User',
      password: 'securePassword888', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

    const loginResult = await authService.login({
      email: 'verify@example.com',
      password: 'securePassword888',
    });

    const payload = await authService.verifyToken(
      (loginResult as { accessToken: string }).accessToken,
    );
    expect(payload?.email).toBe('verify@example.com');
  });

  it('rejects a token missing the guardian_session typ claim', async () => {
    const tokenWithoutTyp = await jwtService.signAsync({
      sub: 'some-user-id',
      email: 'someone@example.com',
    });

    await expect(authService.verifyToken(tokenWithoutTyp)).resolves.toBeNull();
  });

  it('rejects invalid password on login', async () => {
    await registerAndConfirm({
      email: 'wrongpass@example.com',
      fullName: 'User',
      password: 'correctPassword123', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

    await expect(
      authService.login({
        email: 'wrongpass@example.com',
        password: 'incorrectPassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  describe('refresh', () => {
    it('exchanges a valid refresh token for a new access/refresh pair and rotates the old one', async () => {
      const { refreshToken } = await registerAndConfirm({
        email: 'refresh@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      const refreshed = await authService.refresh(refreshToken);

      expect(refreshed.accessToken).toBeDefined();
      expect(refreshed.refreshToken).toBeDefined();
      expect(refreshed.refreshToken).not.toBe(refreshToken);
      expect(fakeRefreshTokens.get(refreshToken)?.revokedAt).not.toBeNull();
    });

    it('rejects an unknown refresh token', async () => {
      await expect(authService.refresh('not-a-real-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an expired refresh token', async () => {
      const { refreshToken } = await registerAndConfirm({
        email: 'expired@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      fakeRefreshTokens.get(refreshToken)!.expiresAt = new Date(Date.now() - 1000);

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('treats reuse of an already-rotated refresh token as compromised and revokes the whole session family', async () => {
      const { refreshToken } = await registerAndConfirm({
        email: 'reuse@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      const first = await authService.refresh(refreshToken);

      // Replaying the now-rotated-out original token should fail...
      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);

      // ...and the legitimate successor issued by the first refresh should
      // have been revoked too, as a precaution against token theft.
      await expect(authService.refresh(first.refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revokeRefreshToken', () => {
    it('invalidates the token so it can no longer be refreshed', async () => {
      const { refreshToken } = await registerAndConfirm({
        email: 'logout@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      await authService.revokeRefreshToken(refreshToken);

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  // register() no longer sends a link-based verification email at all —
  // that mechanism now exists only for changeEmail() (a new address must
  // be reproven, same as at signup, but through the pre-existing
  // link/token flow rather than the new registration code). So these
  // tests set up their EmailVerificationToken via changeEmail() on an
  // already-confirmed account, not via register() directly.
  describe('verifyEmail', () => {
    it('marks the new email verified when the token is valid', async () => {
      const session = await registerAndConfirm({
        email: 'verify@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      await authService.changeEmail(session.user.id, 'password12345', 'verify-new@example.com');
      const [, token] = [...fakeVerificationTokens.entries()][0]!;

      await authService.verifyEmail(token.plainToken);

      const profile = await authService.getProfile(session.user.id);
      expect(profile.emailVerified).toBe(true);
    });

    it('rejects an unknown token', async () => {
      await expect(authService.verifyEmail('not-a-real-token')).rejects.toThrow(BadRequestException);
    });

    it('rejects a token that was already used', async () => {
      const session = await registerAndConfirm({
        email: 'verify-twice@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      await authService.changeEmail(session.user.id, 'password12345', 'verify-twice-new@example.com');
      const [, token] = [...fakeVerificationTokens.entries()][0]!;

      await authService.verifyEmail(token.plainToken);

      await expect(authService.verifyEmail(token.plainToken)).rejects.toThrow(BadRequestException);
    });

    it('rejects an expired token', async () => {
      const session = await registerAndConfirm({
        email: 'verify-expired@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      await authService.changeEmail(session.user.id, 'password12345', 'verify-expired-new@example.com');
      const [, token] = [...fakeVerificationTokens.entries()][0]!;
      token.expiresAt = new Date(Date.now() - 1000);

      await expect(authService.verifyEmail(token.plainToken)).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendVerificationEmail', () => {
    it('sends a new verification email for an unverified (post-email-change) account', async () => {
      const session = await registerAndConfirm({
        email: 'resend@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      await authService.changeEmail(session.user.id, 'password12345', 'resend-new@example.com');
      sentEmails.length = 0;

      await authService.resendVerificationEmail(session.user.id);

      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]!.to).toBe('resend-new@example.com');
    });

    it('does nothing for an already-verified account', async () => {
      const session = await registerAndConfirm({
        email: 'already-verified@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      sentEmails.length = 0;

      await authService.resendVerificationEmail(session.user.id);

      expect(sentEmails).toHaveLength(0);
    });
  });

  describe('forgotPassword', () => {
    it('sends a password reset email for an existing account', async () => {
      await registerAndConfirm({
        email: 'forgot@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      sentEmails.length = 0;

      await authService.forgotPassword('forgot@example.com');

      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]!.to).toBe('forgot@example.com');
      expect(sentEmails[0]!.text).toContain('http://localhost:3000/reset-password?token=');
    });

    it('does nothing observable for an unknown email (anti-enumeration)', async () => {
      await expect(
        authService.forgotPassword('nobody@example.com'),
      ).resolves.toBeUndefined();

      expect(sentEmails).toHaveLength(0);
    });
  });

  describe('resetPassword', () => {
    it('updates the password, allows login with the new password, and rejects the old one', async () => {
      await registerAndConfirm({
        email: 'reset@example.com',
        fullName: 'User',
        password: 'oldPassword123', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      await authService.forgotPassword('reset@example.com');
      const [, token] = [...fakePasswordResetTokens.entries()][0]!;

      await authService.resetPassword(token.plainToken, 'newPassword456');

      await expect(
        authService.login({ email: 'reset@example.com', password: 'oldPassword123' }),
      ).rejects.toThrow(UnauthorizedException);

      const loginResult = await authService.login({
        email: 'reset@example.com',
        password: 'newPassword456',
      });
      expectAuthSession(loginResult);
      expect(loginResult.accessToken).toBeDefined();
    });

    it('revokes every existing refresh token for the user', async () => {
      const { refreshToken } = await registerAndConfirm({
        email: 'reset-revoke@example.com',
        fullName: 'User',
        password: 'oldPassword123', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      await authService.forgotPassword('reset-revoke@example.com');
      const [, token] = [...fakePasswordResetTokens.entries()][0]!;

      await authService.resetPassword(token.plainToken, 'newPassword456');

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a weak new password', async () => {
      await registerAndConfirm({
        email: 'reset-weak@example.com',
        fullName: 'User',
        password: 'oldPassword123', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      await authService.forgotPassword('reset-weak@example.com');
      const [, token] = [...fakePasswordResetTokens.entries()][0]!;

      await expect(authService.resetPassword(token.plainToken, 'short')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an unknown token', async () => {
      await expect(
        authService.resetPassword('not-a-real-token', 'newPassword456'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a token that was already used', async () => {
      await registerAndConfirm({
        email: 'reset-twice@example.com',
        fullName: 'User',
        password: 'oldPassword123', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      await authService.forgotPassword('reset-twice@example.com');
      const [, token] = [...fakePasswordResetTokens.entries()][0]!;

      await authService.resetPassword(token.plainToken, 'newPassword456');

      await expect(
        authService.resetPassword(token.plainToken, 'anotherPassword789'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an expired token', async () => {
      await registerAndConfirm({
        email: 'reset-expired@example.com',
        fullName: 'User',
        password: 'oldPassword123', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      await authService.forgotPassword('reset-expired@example.com');
      const [, token] = [...fakePasswordResetTokens.entries()][0]!;
      token.expiresAt = new Date(Date.now() - 1000);

      await expect(
        authService.resetPassword(token.plainToken, 'newPassword456'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('changePassword', () => {
    it('updates the password when the current password is correct', async () => {
      await registerAndConfirm({
        email: 'change-pw@example.com',
        fullName: 'User',
        password: 'oldPassword123', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      await authService.changePassword('user-uuid-1', 'oldPassword123', 'newPassword456');

      await expect(
        authService.login({ email: 'change-pw@example.com', password: 'oldPassword123' }),
      ).rejects.toThrow(UnauthorizedException);
      const loginResult = await authService.login({
        email: 'change-pw@example.com',
        password: 'newPassword456',
      });
      expectAuthSession(loginResult);
      expect(loginResult.accessToken).toBeDefined();
    });

    it('revokes every existing refresh token', async () => {
      const { refreshToken } = await registerAndConfirm({
        email: 'change-pw-revoke@example.com',
        fullName: 'User',
        password: 'oldPassword123', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      await authService.changePassword('user-uuid-1', 'oldPassword123', 'newPassword456');

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an incorrect current password', async () => {
      await registerAndConfirm({
        email: 'change-pw-wrong@example.com',
        fullName: 'User',
        password: 'oldPassword123', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      await expect(
        authService.changePassword('user-uuid-1', 'wrongPassword', 'newPassword456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a weak new password', async () => {
      await registerAndConfirm({
        email: 'change-pw-weak@example.com',
        fullName: 'User',
        password: 'oldPassword123', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      await expect(
        authService.changePassword('user-uuid-1', 'oldPassword123', 'short'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('changeEmail', () => {
    it('updates the email, resets verification, and sends a new verification email', async () => {
      await registerAndConfirm({
        email: 'change-email@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      sentEmails.length = 0;

      await authService.changeEmail('user-uuid-1', 'password12345', 'new-address@example.com');

      const profile = await authService.getProfile('user-uuid-1');
      expect(profile.email).toBe('new-address@example.com');
      expect(profile.emailVerified).toBe(false);
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]!.to).toBe('new-address@example.com');
    });

    it('revokes every existing refresh token', async () => {
      const { refreshToken } = await registerAndConfirm({
        email: 'change-email-revoke@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      await authService.changeEmail('user-uuid-1', 'password12345', 'new-address-2@example.com');

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an incorrect current password', async () => {
      await registerAndConfirm({
        email: 'change-email-wrong@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      await expect(
        authService.changeEmail('user-uuid-1', 'wrongPassword', 'new-address-3@example.com'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects changing to the same email', async () => {
      await registerAndConfirm({
        email: 'change-email-same@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      await expect(
        authService.changeEmail('user-uuid-1', 'password12345', 'change-email-same@example.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an email already used by another account', async () => {
      await registerAndConfirm({
        email: 'change-email-taken@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      await registerAndConfirm({
        email: 'change-email-target@example.com',
        fullName: 'Other User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      await expect(
        authService.changeEmail('user-uuid-1', 'password12345', 'change-email-target@example.com'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('audit log', () => {
    it('records LOGIN_SUCCEEDED and LOGIN_FAILED', async () => {
      await registerAndConfirm({
        email: 'audit-login@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      auditLog.length = 0;

      await expect(
        authService.login({ email: 'audit-login@example.com', password: 'wrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
      await authService.login({ email: 'audit-login@example.com', password: 'password12345' });

      const eventTypes = auditLog.map((entry) => entry.eventType);
      expect(eventTypes).toEqual(['LOGIN_FAILED', 'LOGIN_SUCCEEDED']);
    });

    it('records LOGOUT with the correct userId', async () => {
      const { refreshToken } = await registerAndConfirm({
        email: 'audit-logout@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      auditLog.length = 0;

      await authService.revokeRefreshToken(refreshToken);

      expect(auditLog.map((entry) => entry.eventType)).toEqual(['LOGOUT']);
      expect(auditLog[0]!.userId).toBe('user-uuid-1');
    });

    it('records REFRESH_TOKEN_REUSE_DETECTED on a replayed refresh token', async () => {
      const { refreshToken } = await registerAndConfirm({
        email: 'audit-reuse@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      await authService.refresh(refreshToken);
      auditLog.length = 0;

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);

      expect(auditLog.map((entry) => entry.eventType)).toEqual(['REFRESH_TOKEN_REUSE_DETECTED']);
    });

    it('records EMAIL_VERIFIED, LOGIN_SUCCEEDED, PASSWORD_RESET_REQUESTED/COMPLETED, PASSWORD_CHANGED, and EMAIL_CHANGED', async () => {
      const challenge = await authService.register({
        email: 'audit-full@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      const code = getPendingRegistrationCode(challenge.challengeToken);
      // Confirming the registration code is what now emits EMAIL_VERIFIED
      // (and LOGIN_SUCCEEDED, from the session it issues) -- the old
      // link-based verifyEmail() is no longer part of this flow.
      await authService.confirmRegistrationCode({ challengeToken: challenge.challengeToken, code });
      const userId = fakeUsers.get('audit-full@example.com')!.id;

      await authService.forgotPassword('audit-full@example.com');
      const [, resetToken] = [...fakePasswordResetTokens.entries()][0]!;
      await authService.resetPassword(resetToken.plainToken, 'resetPassword456');
      await authService.changePassword(userId, 'resetPassword456', 'changedPassword789');
      await authService.changeEmail(userId, 'changedPassword789', 'audit-full-new@example.com');

      expect(auditLog.map((entry) => entry.eventType)).toEqual([
        'EMAIL_VERIFIED',
        'LOGIN_SUCCEEDED',
        'PASSWORD_RESET_REQUESTED',
        'PASSWORD_RESET_COMPLETED',
        'PASSWORD_CHANGED',
        'EMAIL_CHANGED',
      ]);
    });

    it('does not fail the underlying action when audit recording throws', async () => {
      await registerAndConfirm({
        email: 'audit-broken@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      accountAuditLogRepository.record = async () => {
        throw new Error('Audit store is down');
      };

      await expect(
        authService.login({ email: 'audit-broken@example.com', password: 'password12345' }),
      ).resolves.toMatchObject({ user: { email: 'audit-broken@example.com' } });
    });
  });

  describe('getAuditLog', () => {
    it('returns the most recent entries for the user, most recent first', async () => {
      await registerAndConfirm({
        email: 'audit-list@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      auditLog.length = 0;

      await authService.login({ email: 'audit-list@example.com', password: 'password12345' });
      await authService.changePassword('user-uuid-1', 'password12345', 'newPassword456');

      const entries = await authService.getAuditLog('user-uuid-1');

      expect(entries.map((entry) => entry.eventType)).toEqual(['PASSWORD_CHANGED', 'LOGIN_SUCCEEDED']);
      expect(entries[0]!.id).toBeDefined();
      expect(entries[0]!.createdAt).toBeDefined();
    });
  });

  describe('MFA (TOTP)', () => {
    async function makeMfaUser() {
      await registerAndConfirm({
        email: 'mfa@example.com',
        fullName: 'MFA User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      return 'user-uuid-1';
    }

    function challengeOf(result: Awaited<ReturnType<AuthService['login']>>) {
      if (!('challengeToken' in result)) {
        throw new Error('Expected an MFA login challenge.');
      }
      return result;
    }

    beforeEach(() => {
      (verifySync as jest.Mock).mockReturnValue({ valid: false, delta: undefined });
    });

    it('mfaSetup returns an otpauth URI + recovery codes and stores a pending challenge', async () => {
      const userId = await makeMfaUser();

      const result = await authService.mfaSetup(userId, 'password12345');

      expect(result.otpauthUri).toContain('otpauth://totp/');
      expect(result.recoveryCodes).toHaveLength(10);
      expect(fakeSetupChallenges.has(userId)).toBe(true);
    });

    it('mfaSetup rejects an incorrect password', async () => {
      const userId = await makeMfaUser();

      await expect(authService.mfaSetup(userId, 'wrongpass123')).rejects.toThrow(UnauthorizedException);
    });

    it('mfaSetup rejects when MFA is already enabled', async () => {
      const userId = await makeMfaUser();
      setUserMfa(true, userId);

      await expect(authService.mfaSetup(userId, 'password12345')).rejects.toThrow(BadRequestException);
    });

    it('mfaConfirm enables MFA and stores the secret + recovery codes after a valid code', async () => {
      const userId = await makeMfaUser();
      await authService.mfaSetup(userId, 'password12345');
      (verifySync as jest.Mock).mockReturnValue({ valid: true, delta: 0 });

      await authService.mfaConfirm(userId, '123456');

      expect(([...fakeUsers.values()][0]!).mfaEnabled).toBe(true);
      expect(fakeMfaSecrets.has(userId)).toBe(true);
      expect(fakeRecoveryCodes.has(userId)).toBe(true);
      expect(auditLog.map((entry) => entry.eventType)).toContain('MFA_ENABLED');
    });

    it('mfaConfirm rejects an invalid code', async () => {
      const userId = await makeMfaUser();
      await authService.mfaSetup(userId, 'password12345');

      await expect(authService.mfaConfirm(userId, '000000')).rejects.toThrow(BadRequestException);
    });

    it('mfaConfirm rejects when no pending challenge exists', async () => {
      const userId = await makeMfaUser();

      await expect(authService.mfaConfirm(userId, '123456')).rejects.toThrow(BadRequestException);
    });

    it('mfaDisable requires the current password and clears MFA state', async () => {
      const userId = await makeMfaUser();
      setUserMfa(true, userId);
      fakeMfaSecrets.set(userId, { userId, encryptedSecret: 'enc', createdAt: new Date() });
      fakeRecoveryCodes.set(userId, [{ userId, codeHash: 'h', usedAt: null }]);

      await authService.mfaDisable(userId, 'password12345');

      expect(fakeMfaSecrets.has(userId)).toBe(false);
      expect(fakeRecoveryCodes.has(userId)).toBe(false);
      expect(([...fakeUsers.values()][0]!).mfaEnabled).toBe(false);
      expect(auditLog.map((entry) => entry.eventType)).toContain('MFA_DISABLED');
    });

    it('mfaDisable rejects an incorrect password', async () => {
      const userId = await makeMfaUser();
      setUserMfa(true, userId);

      await expect(authService.mfaDisable(userId, 'wrongpass123')).rejects.toThrow(UnauthorizedException);
    });

    it('mfaDisable rejects when MFA is not enabled', async () => {
      const userId = await makeMfaUser();

      await expect(authService.mfaDisable(userId, 'password12345')).rejects.toThrow(BadRequestException);
    });

    it('login returns a login challenge instead of a session when MFA is enabled', async () => {
      await makeMfaUser();
      setUserMfa(true);

      const result = await authService.login({
        email: 'mfa@example.com',
        password: 'password12345',
      });

      expect('challengeToken' in result).toBe(true);
      expect('accessToken' in result).toBe(false);
    });

    it('mfaVerify completes login with a valid TOTP code and destroys the challenge', async () => {
      environment.platformAdminEmails = ['mfa@example.com'];
      const userId = await makeMfaUser();
      await authService.mfaSetup(userId, 'password12345');
      (verifySync as jest.Mock).mockReturnValue({ valid: true, delta: 0 });
      await authService.mfaConfirm(userId, '123456');

      const challenge = challengeOf(
        await authService.login({ email: 'mfa@example.com', password: 'password12345' }),
      );
      const session = await authService.mfaVerify({
        challengeToken: challenge.challengeToken,
        code: '123456',
      });

      expect(session.accessToken).toBeDefined();
      expect(session.user.email).toBe('mfa@example.com');
      expect(session.user.isPlatformAdmin).toBe(true);
      expect(fakeLoginChallenges.size).toBe(0);
    });

    it('mfaVerify completes login with a recovery code, which is single-use', async () => {
      environment.platformAdminEmails = ['mfa@example.com'];
      const userId = await makeMfaUser();
      const setup = await authService.mfaSetup(userId, 'password12345');
      (verifySync as jest.Mock).mockReturnValue({ valid: true, delta: 0 });
      await authService.mfaConfirm(userId, '123456');
      // Force the recovery-code fallback rather than the TOTP path.
      (verifySync as jest.Mock).mockReturnValue({ valid: false, delta: undefined });

      const code = setup.recoveryCodes[0]!;

      const firstChallenge = challengeOf(
        await authService.login({ email: 'mfa@example.com', password: 'password12345' }),
      );
      const session = await authService.mfaVerify({
        challengeToken: firstChallenge.challengeToken,
        code,
      });
      expect(session.accessToken).toBeDefined();

      const secondChallenge = challengeOf(
        await authService.login({ email: 'mfa@example.com', password: 'password12345' }),
      );
      expect(session.user.isPlatformAdmin).toBe(true);
      await expect(
        authService.mfaVerify({ challengeToken: secondChallenge.challengeToken, code }),
      ).rejects.toThrow(BadRequestException);
    });

    it('mfaVerify rejects an invalid code with no MFA secret', async () => {
      await makeMfaUser();
      setUserMfa(true);

      const challenge = challengeOf(
        await authService.login({ email: 'mfa@example.com', password: 'password12345' }),
      );

      await expect(
        authService.mfaVerify({ challengeToken: challenge.challengeToken, code: '000000' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('mfaVerify rejects an unknown or expired login challenge', async () => {
      await makeMfaUser();

      await expect(
        authService.mfaVerify({ challengeToken: 'does-not-exist', code: '123456' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('mfaVerify destroys the challenge after 5 failed attempts', async () => {
      const userId = await makeMfaUser();
      setUserMfa(true);
      fakeMfaSecrets.set(userId, { userId, encryptedSecret: 'enc', createdAt: new Date() });

      const challenge = challengeOf(
        await authService.login({ email: 'mfa@example.com', password: 'password12345' }),
      );

      for (let i = 0; i < 5; i += 1) {
        await expect(
          authService.mfaVerify({ challengeToken: challenge.challengeToken, code: '000000' }),
        ).rejects.toThrow(BadRequestException);
      }

      expect(fakeLoginChallenges.size).toBe(0);
    });
  });

  describe('Terms of Use / Privacy Policy acceptance on registration', () => {
    it('records the LGPD-regime definitions when countryCode is BRA', async () => {
      await registerAndConfirm({
        email: 'guardian-lgpd@example.com',
        fullName: 'Guardian',
        password: 'strongPassword123!',
        countryCode: 'BRA',
        acceptedTermsOfUse: true,
        acceptedPrivacyPolicy: true,
      });

      expect(capturedCreateCalls).toHaveLength(1);
      expect(capturedCreateCalls[0]?.termsOfUseDefinitionId).toBe('consent-def-TERMS_OF_USE_LGPD');
      expect(capturedCreateCalls[0]?.privacyPolicyDefinitionId).toBe('consent-def-PRIVACY_POLICY_LGPD');
    });

    it('records the GDPR-regime definitions for an EU country', async () => {
      await registerAndConfirm({
        email: 'guardian-gdpr@example.com',
        fullName: 'Guardian',
        password: 'strongPassword123!',
        countryCode: 'DEU',
        acceptedTermsOfUse: true,
        acceptedPrivacyPolicy: true,
      });

      expect(capturedCreateCalls[0]?.termsOfUseDefinitionId).toBe('consent-def-TERMS_OF_USE_GDPR');
      expect(capturedCreateCalls[0]?.privacyPolicyDefinitionId).toBe('consent-def-PRIVACY_POLICY_GDPR');
    });

    it('records the GENERIC-regime definitions for a country outside every specific regime', async () => {
      await registerAndConfirm({
        email: 'guardian-generic@example.com',
        fullName: 'Guardian',
        password: 'strongPassword123!',
        countryCode: 'JPN',
        acceptedTermsOfUse: true,
        acceptedPrivacyPolicy: true,
      });

      expect(capturedCreateCalls[0]?.termsOfUseDefinitionId).toBe('consent-def-TERMS_OF_USE_GENERIC');
      expect(capturedCreateCalls[0]?.privacyPolicyDefinitionId).toBe('consent-def-PRIVACY_POLICY_GENERIC');
    });

    it('rejects registration when the required consent definitions are not published for the resolved regime', async () => {
      const originalGetPublished = fakePrivacyPublicApi.getPublishedDefinitions;
      fakePrivacyPublicApi.getPublishedDefinitions = async () => [];

      await expect(
        authService.register({
          email: 'guardian-missing-seed@example.com',
          fullName: 'Guardian',
          password: 'strongPassword123!',
          countryCode: 'BRA',
          acceptedTermsOfUse: true,
          acceptedPrivacyPolicy: true,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(capturedCreateCalls).toHaveLength(0);
      fakePrivacyPublicApi.getPublishedDefinitions = originalGetPublished;
    });
  });

  describe('platform-admin bootstrap (issue #101)', () => {
    it('promotes a matching email on register', async () => {
      environment.platformAdminEmails = ['admin@example.com'];

      const result = await registerAndConfirm({
        email: 'admin@example.com',
        fullName: 'Admin User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      expectAuthSession(result);

      await expect(authService.isPlatformAdmin(result.user.id)).resolves.toBe(true);
    });

    it('does not promote an email that is not in the list', async () => {
      environment.platformAdminEmails = ['someone-else@example.com'];

      const result = await registerAndConfirm({
        email: 'parent@example.com',
        fullName: 'Parent User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      expectAuthSession(result);

      await expect(authService.isPlatformAdmin(result.user.id)).resolves.toBe(false);
    });

    it('promotes an existing user at login time once added to the list', async () => {
      const registered = await registerAndConfirm({
        email: 'later-admin@example.com',
        fullName: 'Later Admin',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      expectAuthSession(registered);
      await expect(authService.isPlatformAdmin(registered.user.id)).resolves.toBe(false);

      environment.platformAdminEmails = ['later-admin@example.com'];
      await authService.login({ email: 'later-admin@example.com', password: 'password12345' });

      await expect(authService.isPlatformAdmin(registered.user.id)).resolves.toBe(true);
    });

    it('never auto-demotes once promoted, even if removed from the list', async () => {
      environment.platformAdminEmails = ['sticky-admin@example.com'];
      const result = await registerAndConfirm({
        email: 'sticky-admin@example.com',
        fullName: 'Sticky Admin',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      expectAuthSession(result);
      await expect(authService.isPlatformAdmin(result.user.id)).resolves.toBe(true);

      environment.platformAdminEmails = [];
      await authService.login({ email: 'sticky-admin@example.com', password: 'password12345' });

      await expect(authService.isPlatformAdmin(result.user.id)).resolves.toBe(true);
    });

    it('does not promote a user registering with an admin domain until email is verified', async () => {
      environment.platformAdminDomains = ['trinitygrove.org'];

      const challenge = await authService.register({
        email: 'leader@trinitygrove.org',
        fullName: 'Leader',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      const userId = fakeUsers.get('leader@trinitygrove.org')!.id;
      await expect(authService.isPlatformAdmin(userId)).resolves.toBe(false);
      expect(challenge.emailConfirmationRequired).toBe(true);
    });

    it('promotes a user with an admin domain when email verification succeeds', async () => {
      environment.platformAdminDomains = ['trinitygrove.org'];

      const challenge = await authService.register({
        email: 'leader@trinitygrove.org',
        fullName: 'Leader',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      const userId = fakeUsers.get('leader@trinitygrove.org')!.id;
      await expect(authService.isPlatformAdmin(userId)).resolves.toBe(false);

      const code = getPendingRegistrationCode(challenge.challengeToken);
      await authService.confirmRegistrationCode({ challengeToken: challenge.challengeToken, code });

      await expect(authService.isPlatformAdmin(userId)).resolves.toBe(true);
    });

    it('promotes an already verified user with an admin domain at login time', async () => {
      const registered = await registerAndConfirm({
        email: 'staff@aletheiaphos.app',
        fullName: 'Staff',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      await expect(authService.isPlatformAdmin(registered.user.id)).resolves.toBe(false);

      environment.platformAdminDomains = ['aletheiaphos.app'];
      await authService.login({ email: 'staff@aletheiaphos.app', password: 'password12345' });

      await expect(authService.isPlatformAdmin(registered.user.id)).resolves.toBe(true);
    });

    it('does not promote a verified user whose domain does not match', async () => {
      environment.platformAdminDomains = ['trinitygrove.org'];

      const registered = await registerAndConfirm({
        email: 'someone@otherdomain.com',
        fullName: 'Other User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      await expect(authService.isPlatformAdmin(registered.user.id)).resolves.toBe(false);
    });
  });

  describe('admin user management (backoffice)', () => {
    it('login rejects a disabled account even with the correct password', async () => {
      const session = await registerAndConfirm({
        email: 'disabled-login@example.com',
        fullName: 'Disabled Login',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      await authService.disableUser(session.user.id);

      await expect(
        authService.login({ email: 'disabled-login@example.com', password: 'password12345' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('listUsers paginates and filters by search', async () => {
      await registerAndConfirm({
        email: 'alice@example.com',
        fullName: 'Alice Guardian',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      await registerAndConfirm({
        email: 'bob@example.com',
        fullName: 'Bob Guardian',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      const all = await authService.listUsers({ skip: 0, take: 20 });
      expect(all.totalCount).toBe(2);
      expect(all.users).toHaveLength(2);

      const filtered = await authService.listUsers({ skip: 0, take: 20, search: 'alice' });
      expect(filtered.totalCount).toBe(1);
      expect(filtered.users[0]?.email).toBe('alice@example.com');

      const firstPage = await authService.listUsers({ skip: 0, take: 1 });
      expect(firstPage.users).toHaveLength(1);
      expect(firstPage.totalCount).toBe(2);
    });

    it('updateUserFullName changes the target account name', async () => {
      const session = await registerAndConfirm({
        email: 'rename-me@example.com',
        fullName: 'Old Name',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      const updated = await authService.updateUserFullName(session.user.id, 'New Name');

      expect(updated.fullName).toBe('New Name');
    });

    it('updateUserFullName rejects an unknown user id', async () => {
      await expect(authService.updateUserFullName('not-a-real-id', 'New Name')).rejects.toThrow(NotFoundException);
    });

    it('grantPlatformAdminByAdmin promotes and audits the action', async () => {
      const session = await registerAndConfirm({
        email: 'promote-me@example.com',
        fullName: 'Promote Me',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      auditLog.length = 0;

      const updated = await authService.grantPlatformAdminByAdmin(session.user.id);

      expect(updated.isPlatformAdmin).toBe(true);
      expect(auditLog.map((entry) => entry.eventType)).toEqual(['PLATFORM_ADMIN_GRANTED_BY_ADMIN']);
    });

    it('revokePlatformAdminByAdmin demotes and audits the action', async () => {
      const session = await registerAndConfirm({
        email: 'demote-me@example.com',
        fullName: 'Demote Me',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      await authService.grantPlatformAdminByAdmin(session.user.id);
      auditLog.length = 0;

      const updated = await authService.revokePlatformAdminByAdmin(session.user.id);

      expect(updated.isPlatformAdmin).toBe(false);
      expect(auditLog.map((entry) => entry.eventType)).toEqual(['PLATFORM_ADMIN_REVOKED_BY_ADMIN']);
    });

    it('disableUser marks the account disabled, revokes sessions, and audits the action', async () => {
      const session = await registerAndConfirm({
        email: 'disable-me@example.com',
        fullName: 'Disable Me',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      auditLog.length = 0;

      const updated = await authService.disableUser(session.user.id);

      expect(updated.disabled).toBe(true);
      expect(auditLog.map((entry) => entry.eventType)).toEqual(['ACCOUNT_DISABLED_BY_ADMIN']);
      const record = fakeRefreshTokens.get(session.refreshToken);
      expect(record?.revokedAt).not.toBeNull();
    });

    it('reactivateUser clears disabled status and audits the action', async () => {
      const session = await registerAndConfirm({
        email: 'reactivate-me@example.com',
        fullName: 'Reactivate Me',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      await authService.disableUser(session.user.id);
      auditLog.length = 0;

      const updated = await authService.reactivateUser(session.user.id);

      expect(updated.disabled).toBe(false);
      expect(auditLog.map((entry) => entry.eventType)).toEqual(['ACCOUNT_REACTIVATED_BY_ADMIN']);

      await expect(
        authService.login({ email: 'reactivate-me@example.com', password: 'password12345' }),
      ).resolves.toBeDefined();
    });

    it('forcePasswordReset emails a reset link for the target account', async () => {
      const session = await registerAndConfirm({
        email: 'force-reset-me@example.com',
        fullName: 'Force Reset Me',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      sentEmails.length = 0;

      await authService.forcePasswordReset(session.user.id);

      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]!.to).toBe('force-reset-me@example.com');
    });
  });
});
