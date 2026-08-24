import { JwtService } from '@nestjs/jwt';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { PasswordHasher } from './password.hasher.js';
import { UserRepository } from '../infrastructure/user.repository.js';
import { UserEntity } from '../domain/user.entity.js';

describe('AuthService', () => {
  let authService: AuthService;
  let fakeUsers: Map<string, UserEntity>;
  let hasher: PasswordHasher;
  let jwtService: JwtService;

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

    authService = new AuthService(mockRepo, hasher, jwtService);
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

  it('registers a guardian and returns accessToken + user summary', async () => {
    const result = await authService.register({
      email: 'guardian@example.com',
      fullName: 'Faithful Guardian',
      password: 'strongPassword123!',
    });

    expect(result.accessToken).toBeDefined();
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
});
