import { JwtService } from '@nestjs/jwt';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
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
import type { MailMessage, MailSender } from '../../../platform/mail/mail-sender.js';
import type { Environment } from '../../../platform/config/environment.js';
import type { AccountAuditEventType } from '@aletheia/contracts';

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

  beforeEach(() => {
    fakeUsers = new Map();
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
      create: async (data: { email: string; passwordHash: string; fullName: string }) => {
        const entity = new UserEntity({
          id: 'user-uuid-1',
          email: data.email.toLowerCase().trim(),
          passwordHash: data.passwordHash,
          fullName: data.fullName,
          emailVerifiedAt: null,
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
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            }),
          );
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

    environment = { webOrigin: 'http://localhost:3000' } as Environment;

    authService = new AuthService(
      mockRepo,
      hasher,
      jwtService,
      refreshTokenRepository,
      emailVerificationTokenRepository,
      passwordResetTokenRepository,
      accountAuditLogRepository,
      mailSender,
      environment,
    );
  });

  it('rejects passwords shorter than 8 characters', async () => {
    await expect(
      authService.register({
        email: 'parent@example.com',
        fullName: 'Parent User',
        password: 'short',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('registers a guardian and returns accessToken + refreshToken + user summary', async () => {
    const result = await authService.register({
      email: 'guardian@example.com',
      fullName: 'Faithful Guardian',
      password: 'strongPassword123!',
    });

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
      password: 'strongPassword123!',
    });

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
        password: 'strongPassword123!',
      }),
    ).resolves.toMatchObject({ user: { email: 'guardian@example.com' } });
  });

  it('rejects duplicate email registration with a generic, non-revealing message', async () => {
    await authService.register({
      email: 'duplicate@example.com',
      fullName: 'First',
      password: 'password123',
    });

    await expect(
      authService.register({
        email: 'duplicate@example.com',
        fullName: 'Second',
        password: 'password123',
      }),
    ).rejects.toThrow(BadRequestException);

    // Anti-enumeration: the message must not confirm an account exists —
    // a caller probing emails should see the same shape of error a weak
    // password already produces, not a distinct "already exists" signal.
    expect.assertions(4);
    try {
      await authService.register({
        email: 'duplicate@example.com',
        fullName: 'Second',
        password: 'password123',
      });
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
      password: 'securePassword888',
    });

    const loginResult = await authService.login({
      email: 'login@example.com',
      password: 'securePassword888',
    });

    expect(loginResult.accessToken).toBeDefined();
    expect(loginResult.user.email).toBe('login@example.com');
  });

  it('rejects invalid password on login', async () => {
    await authService.register({
      email: 'wrongpass@example.com',
      fullName: 'User',
      password: 'correctPassword123',
    });

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
        password: 'password12345',
      });

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
        password: 'password12345',
      });
      fakeRefreshTokens.get(refreshToken)!.expiresAt = new Date(Date.now() - 1000);

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('treats reuse of an already-rotated refresh token as compromised and revokes the whole session family', async () => {
      const { refreshToken } = await authService.register({
        email: 'reuse@example.com',
        fullName: 'User',
        password: 'password12345',
      });

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
        password: 'password12345',
      });

      await authService.revokeRefreshToken(refreshToken);

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyEmail', () => {
    it('marks the account verified when the token is valid', async () => {
      await authService.register({
        email: 'verify@example.com',
        fullName: 'User',
        password: 'password12345',
      });
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
        password: 'password12345',
      });
      const [, token] = [...fakeVerificationTokens.entries()][0]!;

      await authService.verifyEmail(token.plainToken);

      await expect(authService.verifyEmail(token.plainToken)).rejects.toThrow(BadRequestException);
    });

    it('rejects an expired token', async () => {
      await authService.register({
        email: 'verify-expired@example.com',
        fullName: 'User',
        password: 'password12345',
      });
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
        password: 'password12345',
      });
      sentEmails.length = 0;

      await authService.resendVerificationEmail('user-uuid-1');

      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]!.to).toBe('resend@example.com');
    });

    it('does nothing for an already-verified account', async () => {
      await authService.register({
        email: 'already-verified@example.com',
        fullName: 'User',
        password: 'password12345',
      });
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
        password: 'password12345',
      });
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
        password: 'oldPassword123',
      });
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
      expect(loginResult.accessToken).toBeDefined();
    });

    it('revokes every existing refresh token for the user', async () => {
      const { refreshToken } = await authService.register({
        email: 'reset-revoke@example.com',
        fullName: 'User',
        password: 'oldPassword123',
      });
      await authService.forgotPassword('reset-revoke@example.com');
      const [, token] = [...fakePasswordResetTokens.entries()][0]!;

      await authService.resetPassword(token.plainToken, 'newPassword456');

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a weak new password', async () => {
      await authService.register({
        email: 'reset-weak@example.com',
        fullName: 'User',
        password: 'oldPassword123',
      });
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
        password: 'oldPassword123',
      });
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
        password: 'oldPassword123',
      });
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
        password: 'oldPassword123',
      });

      await authService.changePassword('user-uuid-1', 'oldPassword123', 'newPassword456');

      await expect(
        authService.login({ email: 'change-pw@example.com', password: 'oldPassword123' }),
      ).rejects.toThrow(UnauthorizedException);
      const loginResult = await authService.login({
        email: 'change-pw@example.com',
        password: 'newPassword456',
      });
      expect(loginResult.accessToken).toBeDefined();
    });

    it('revokes every existing refresh token', async () => {
      const { refreshToken } = await authService.register({
        email: 'change-pw-revoke@example.com',
        fullName: 'User',
        password: 'oldPassword123',
      });

      await authService.changePassword('user-uuid-1', 'oldPassword123', 'newPassword456');

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an incorrect current password', async () => {
      await authService.register({
        email: 'change-pw-wrong@example.com',
        fullName: 'User',
        password: 'oldPassword123',
      });

      await expect(
        authService.changePassword('user-uuid-1', 'wrongPassword', 'newPassword456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a weak new password', async () => {
      await authService.register({
        email: 'change-pw-weak@example.com',
        fullName: 'User',
        password: 'oldPassword123',
      });

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
        password: 'password12345',
      });
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
        password: 'password12345',
      });

      await authService.changeEmail('user-uuid-1', 'password12345', 'new-address-2@example.com');

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an incorrect current password', async () => {
      await authService.register({
        email: 'change-email-wrong@example.com',
        fullName: 'User',
        password: 'password12345',
      });

      await expect(
        authService.changeEmail('user-uuid-1', 'wrongPassword', 'new-address-3@example.com'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects changing to the same email', async () => {
      await authService.register({
        email: 'change-email-same@example.com',
        fullName: 'User',
        password: 'password12345',
      });

      await expect(
        authService.changeEmail('user-uuid-1', 'password12345', 'change-email-same@example.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an email already used by another account', async () => {
      await authService.register({
        email: 'change-email-taken@example.com',
        fullName: 'User',
        password: 'password12345',
      });
      await authService.register({
        email: 'change-email-target@example.com',
        fullName: 'Other User',
        password: 'password12345',
      });

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
        password: 'password12345',
      });
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
        password: 'password12345',
      });
      auditLog.length = 0;

      await authService.revokeRefreshToken(refreshToken);

      expect(auditLog.map((entry) => entry.eventType)).toEqual(['LOGOUT']);
      expect(auditLog[0]!.userId).toBe('user-uuid-1');
    });

    it('records REFRESH_TOKEN_REUSE_DETECTED on a replayed refresh token', async () => {
      const { refreshToken } = await authService.register({
        email: 'audit-reuse@example.com',
        fullName: 'User',
        password: 'password12345',
      });
      await authService.refresh(refreshToken);
      auditLog.length = 0;

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);

      expect(auditLog.map((entry) => entry.eventType)).toEqual(['REFRESH_TOKEN_REUSE_DETECTED']);
    });

    it('records EMAIL_VERIFIED, PASSWORD_RESET_REQUESTED/COMPLETED, PASSWORD_CHANGED, and EMAIL_CHANGED', async () => {
      await authService.register({
        email: 'audit-full@example.com',
        fullName: 'User',
        password: 'password12345',
      });
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
        password: 'password12345',
      });
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
        password: 'password12345',
      });
      auditLog.length = 0;

      await authService.login({ email: 'audit-list@example.com', password: 'password12345' });
      await authService.changePassword('user-uuid-1', 'password12345', 'newPassword456');

      const entries = await authService.getAuditLog('user-uuid-1');

      expect(entries.map((entry) => entry.eventType)).toEqual(['PASSWORD_CHANGED', 'LOGIN_SUCCEEDED']);
      expect(entries[0]!.id).toBeDefined();
      expect(entries[0]!.createdAt).toBeDefined();
    });
  });
});
