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
import type { MailMessage, MailSender } from '../../../platform/mail/mail-sender.js';
import type { Environment } from '../../../platform/config/environment.js';

describe('AuthService', () => {
  let authService: AuthService;
  let fakeUsers: Map<string, UserEntity>;
  let hasher: PasswordHasher;
  let jwtService: JwtService;
  let fakeRefreshTokens: Map<string, RefreshTokenRecord & { plainToken: string }>;
  let refreshTokenRepository: RefreshTokenRepository;
  let fakeVerificationTokens: Map<string, EmailVerificationTokenRecord & { plainToken: string }>;
  let emailVerificationTokenRepository: EmailVerificationTokenRepository;
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

  it('rejects duplicate email registration', async () => {
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
    ).rejects.toThrow(ConflictException);
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
});
