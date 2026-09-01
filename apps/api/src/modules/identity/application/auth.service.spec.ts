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

describe('AuthService', () => {
  let authService: AuthService;
  let fakeUsers: Map<string, UserEntity>;
  let hasher: PasswordHasher;
  let jwtService: JwtService;
  let fakeRefreshTokens: Map<string, RefreshTokenRecord & { plainToken: string }>;
  let refreshTokenRepository: RefreshTokenRepository;

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
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        fakeUsers.set(entity.email, entity);
        return entity;
      },
    } as unknown as UserRepository;

    fakeRefreshTokens = new Map();
    let sequence = 0;
    refreshTokenRepository = {
      issue: async (userId: string) => {
        sequence += 1;
        const token = `refresh-token-${sequence}`;
        fakeRefreshTokens.set(token, {
          id: `rt-${sequence}`,
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

    authService = new AuthService(mockRepo, hasher, jwtService, refreshTokenRepository);
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
});
