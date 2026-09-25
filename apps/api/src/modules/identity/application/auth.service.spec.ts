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

  it.each([false, true])('exposes persisted platform admin=%s in registration, login, refresh and profile', async (isAdmin) => {
    environment.platformAdminEmails = isAdmin ? ['admin@example.com'] : [];
    const registered = await authService.register({ email: 'admin@example.com', fullName: 'Admin', password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
    expect(registered.user).toHaveProperty('isPlatformAdmin', isAdmin);
    const loggedIn = await authService.login({ email: 'admin@example.com', password: 'password12345' });
    expectAuthSession(loggedIn);
    expect(loggedIn.user).toHaveProperty('isPlatformAdmin', isAdmin);
    expect((await authService.refresh(loggedIn.refreshToken)).user).toHaveProperty('isPlatformAdmin', isAdmin);
    expect(await authService.getProfile(registered.user.id)).toHaveProperty('isPlatformAdmin', isAdmin);
  });

  it('returns the newly granted platform admin flag on the first login after bootstrap changes', async () => {
    await authService.register({ email: 'admin@example.com', fullName: 'Admin', password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
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
          mfaEnabled: false,
          isPlatformAdmin: false,
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
                mfaEnabled: user.mfaEnabled,
                isPlatformAdmin: user.isPlatformAdmin,
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
                mfaEnabled: user.mfaEnabled,
                isPlatformAdmin: user.isPlatformAdmin,
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
              mfaEnabled: user.mfaEnabled,
              isPlatformAdmin: user.isPlatformAdmin,
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
                mfaEnabled: user.mfaEnabled,
                isPlatformAdmin: true,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              }),
            );
          }
        }
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
          mfaEnabled,
          isPlatformAdmin: user.isPlatformAdmin,
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

  it('registers a guardian and returns accessToken + refreshToken + user summary', async () => {
    const result = await authService.register({
      email: 'guardian@example.com',
      fullName: 'Faithful Guardian',
      password: 'strongPassword123!', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toBe('guardian@example.com');
    expect(result.user.fullName).toBe('Faithful Guardian');
    expect(result.user.emailVerified).toBe(false);
  });

  it('sends a verification email on registration with a working link', async () => {
    await authService.register({
      email: 'guardian@example.com',
      fullName: 'Faithful Guardian',
      password: 'strongPassword123!', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0]!.to).toBe('guardian@example.com');
    expect(sentEmails[0]!.text).toContain('http://localhost:3000/verify-email?token=');
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
    ).resolves.toMatchObject({ user: { email: 'guardian@example.com' } });
  });

  it('rejects duplicate email registration with a generic, non-revealing message', async () => {
    await authService.register({
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
      await authService.register({
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
    await authService.register({
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
    await authService.register({
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
    await authService.register({
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
      const { refreshToken } = await authService.register({
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
      const { refreshToken } = await authService.register({
        email: 'expired@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      fakeRefreshTokens.get(refreshToken)!.expiresAt = new Date(Date.now() - 1000);

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('treats reuse of an already-rotated refresh token as compromised and revokes the whole session family', async () => {
      const { refreshToken } = await authService.register({
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
      const { refreshToken } = await authService.register({
        email: 'logout@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      await authService.revokeRefreshToken(refreshToken);

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyEmail', () => {
    it('marks the account verified when the token is valid', async () => {
      await authService.register({
        email: 'verify@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      const [, token] = [...fakeVerificationTokens.entries()][0]!;

      await authService.verifyEmail(token.plainToken);

      const profile = await authService.getProfile('user-uuid-1');
      expect(profile.emailVerified).toBe(true);
    });

    it('rejects an unknown token', async () => {
      await expect(authService.verifyEmail('not-a-real-token')).rejects.toThrow(BadRequestException);
    });

    it('rejects a token that was already used', async () => {
      await authService.register({
        email: 'verify-twice@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      const [, token] = [...fakeVerificationTokens.entries()][0]!;

      await authService.verifyEmail(token.plainToken);

      await expect(authService.verifyEmail(token.plainToken)).rejects.toThrow(BadRequestException);
    });

    it('rejects an expired token', async () => {
      await authService.register({
        email: 'verify-expired@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      const [, token] = [...fakeVerificationTokens.entries()][0]!;
      token.expiresAt = new Date(Date.now() - 1000);

      await expect(authService.verifyEmail(token.plainToken)).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendVerificationEmail', () => {
    it('sends a new verification email for an unverified account', async () => {
      await authService.register({
        email: 'resend@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      sentEmails.length = 0;

      await authService.resendVerificationEmail('user-uuid-1');

      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]!.to).toBe('resend@example.com');
    });

    it('does nothing for an already-verified account', async () => {
      await authService.register({
        email: 'already-verified@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      const [, token] = [...fakeVerificationTokens.entries()][0]!;
      await authService.verifyEmail(token.plainToken);
      sentEmails.length = 0;

      await authService.resendVerificationEmail('user-uuid-1');

      expect(sentEmails).toHaveLength(0);
    });
  });

  describe('forgotPassword', () => {
    it('sends a password reset email for an existing account', async () => {
      await authService.register({
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
      await authService.register({
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
      const { refreshToken } = await authService.register({
        email: 'reset-revoke@example.com',
        fullName: 'User',
        password: 'oldPassword123', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      await authService.forgotPassword('reset-revoke@example.com');
      const [, token] = [...fakePasswordResetTokens.entries()][0]!;

      await authService.resetPassword(token.plainToken, 'newPassword456');

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a weak new password', async () => {
      await authService.register({
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
      await authService.register({
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
      await authService.register({
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
      await authService.register({
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
      const { refreshToken } = await authService.register({
        email: 'change-pw-revoke@example.com',
        fullName: 'User',
        password: 'oldPassword123', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      await authService.changePassword('user-uuid-1', 'oldPassword123', 'newPassword456');

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an incorrect current password', async () => {
      await authService.register({
        email: 'change-pw-wrong@example.com',
        fullName: 'User',
        password: 'oldPassword123', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      await expect(
        authService.changePassword('user-uuid-1', 'wrongPassword', 'newPassword456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a weak new password', async () => {
      await authService.register({
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
      await authService.register({
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
      const { refreshToken } = await authService.register({
        email: 'change-email-revoke@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      await authService.changeEmail('user-uuid-1', 'password12345', 'new-address-2@example.com');

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an incorrect current password', async () => {
      await authService.register({
        email: 'change-email-wrong@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      await expect(
        authService.changeEmail('user-uuid-1', 'wrongPassword', 'new-address-3@example.com'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects changing to the same email', async () => {
      await authService.register({
        email: 'change-email-same@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });

      await expect(
        authService.changeEmail('user-uuid-1', 'password12345', 'change-email-same@example.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an email already used by another account', async () => {
      await authService.register({
        email: 'change-email-taken@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      await authService.register({
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
      await authService.register({
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
      const { refreshToken } = await authService.register({
        email: 'audit-logout@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      auditLog.length = 0;

      await authService.revokeRefreshToken(refreshToken);

      expect(auditLog.map((entry) => entry.eventType)).toEqual(['LOGOUT']);
      expect(auditLog[0]!.userId).toBe('user-uuid-1');
    });

    it('records REFRESH_TOKEN_REUSE_DETECTED on a replayed refresh token', async () => {
      const { refreshToken } = await authService.register({
        email: 'audit-reuse@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      await authService.refresh(refreshToken);
      auditLog.length = 0;

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);

      expect(auditLog.map((entry) => entry.eventType)).toEqual(['REFRESH_TOKEN_REUSE_DETECTED']);
    });

    it('records EMAIL_VERIFIED, PASSWORD_RESET_REQUESTED/COMPLETED, PASSWORD_CHANGED, and EMAIL_CHANGED', async () => {
      await authService.register({
        email: 'audit-full@example.com',
        fullName: 'User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      const [, verifyToken] = [...fakeVerificationTokens.entries()][0]!;
      auditLog.length = 0;

      await authService.verifyEmail(verifyToken.plainToken);
      await authService.forgotPassword('audit-full@example.com');
      const [, resetToken] = [...fakePasswordResetTokens.entries()][0]!;
      await authService.resetPassword(resetToken.plainToken, 'resetPassword456');
      await authService.changePassword('user-uuid-1', 'resetPassword456', 'changedPassword789');
      await authService.changeEmail('user-uuid-1', 'changedPassword789', 'audit-full-new@example.com');

      expect(auditLog.map((entry) => entry.eventType)).toEqual([
        'EMAIL_VERIFIED',
        'PASSWORD_RESET_REQUESTED',
        'PASSWORD_RESET_COMPLETED',
        'PASSWORD_CHANGED',
        'EMAIL_CHANGED',
      ]);
    });

    it('does not fail the underlying action when audit recording throws', async () => {
      await authService.register({
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
      await authService.register({
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
      await authService.register({
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
      await authService.register({
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
      await authService.register({
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
      await authService.register({
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

      const result = await authService.register({
        email: 'admin@example.com',
        fullName: 'Admin User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      expectAuthSession(result);

      await expect(authService.isPlatformAdmin(result.user.id)).resolves.toBe(true);
    });

    it('does not promote an email that is not in the list', async () => {
      environment.platformAdminEmails = ['someone-else@example.com'];

      const result = await authService.register({
        email: 'parent@example.com',
        fullName: 'Parent User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      expectAuthSession(result);

      await expect(authService.isPlatformAdmin(result.user.id)).resolves.toBe(false);
    });

    it('promotes an existing user at login time once added to the list', async () => {
      const registered = await authService.register({
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
      const result = await authService.register({
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

      const result = await authService.register({
        email: 'leader@trinitygrove.org',
        fullName: 'Leader',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      expectAuthSession(result);
      await expect(authService.isPlatformAdmin(result.user.id)).resolves.toBe(false);
    });

    it('promotes a user with an admin domain when email verification succeeds', async () => {
      environment.platformAdminDomains = ['trinitygrove.org'];

      const result = await authService.register({
        email: 'leader@trinitygrove.org',
        fullName: 'Leader',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      expectAuthSession(result);
      await expect(authService.isPlatformAdmin(result.user.id)).resolves.toBe(false);

      const tokenRecord = Array.from(fakeVerificationTokens.values()).find(
        (t) => t.userId === result.user.id,
      );
      expect(tokenRecord).toBeDefined();

      await authService.verifyEmail(tokenRecord!.plainToken);

      await expect(authService.isPlatformAdmin(result.user.id)).resolves.toBe(true);
    });

    it('promotes an already verified user with an admin domain at login time', async () => {
      const registered = await authService.register({
        email: 'staff@aletheiaphos.app',
        fullName: 'Staff',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      const tokenRecord = Array.from(fakeVerificationTokens.values()).find(
        (t) => t.userId === registered.user.id,
      );
      await authService.verifyEmail(tokenRecord!.plainToken);
      await expect(authService.isPlatformAdmin(registered.user.id)).resolves.toBe(false);

      environment.platformAdminDomains = ['aletheiaphos.app'];
      await authService.login({ email: 'staff@aletheiaphos.app', password: 'password12345' });

      await expect(authService.isPlatformAdmin(registered.user.id)).resolves.toBe(true);
    });

    it('does not promote a verified user whose domain does not match', async () => {
      environment.platformAdminDomains = ['trinitygrove.org'];

      const registered = await authService.register({
        email: 'someone@otherdomain.com',
        fullName: 'Other User',
        password: 'password12345', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
      const tokenRecord = Array.from(fakeVerificationTokens.values()).find(
        (t) => t.userId === registered.user.id,
      );
      await authService.verifyEmail(tokenRecord!.plainToken);

      await expect(authService.isPlatformAdmin(registered.user.id)).resolves.toBe(false);
    });
  });
});
