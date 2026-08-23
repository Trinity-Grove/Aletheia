import { describe, expect, it } from 'vitest';
import {
  authResponseSchema,
  loginSchema,
  registerGuardianSchema,
  userSummarySchema,
  type AuthResponseDto,
  type LoginDto,
  type RegisterGuardianDto,
  type UserSummaryDto,
} from './auth.js';

describe('auth contracts', () => {
  describe('registerGuardianSchema', () => {
    it('validates a valid registration payload', () => {
      const payload: RegisterGuardianDto = {
        email: 'guardian@example.com',
        password: 'securePassword123!',
        fullName: 'Jane Doe',
      };

      const result = registerGuardianSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      const payload = {
        email: 'not-an-email',
        password: 'securePassword123!',
        fullName: 'Jane Doe',
      };

      const result = registerGuardianSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects passwords shorter than 8 characters', () => {
      const payload = {
        email: 'guardian@example.com',
        password: 'short',
        fullName: 'Jane Doe',
      };

      const result = registerGuardianSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects empty full name', () => {
      const payload = {
        email: 'guardian@example.com',
        password: 'securePassword123!',
        fullName: '',
      };

      const result = registerGuardianSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('validates a valid login payload', () => {
      const payload: LoginDto = {
        email: 'guardian@example.com',
        password: 'secretPassword',
      };

      const result = loginSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email or empty password', () => {
      expect(
        loginSchema.safeParse({ email: 'bad-email', password: 'pw' }).success,
      ).toBe(false);
      expect(
        loginSchema.safeParse({ email: 'valid@example.com', password: '' })
          .success,
      ).toBe(false);
    });
  });

  describe('userSummarySchema & authResponseSchema', () => {
    it('validates user summary and auth response structure', () => {
      const user: UserSummaryDto = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'guardian@example.com',
        fullName: 'Jane Doe',
        createdAt: '2026-08-23T12:00:00.000Z',
      };

      const userResult = userSummarySchema.safeParse(user);
      expect(userResult.success).toBe(true);

      const authResponse: AuthResponseDto = {
        accessToken: 'jwt.token.string',
        user,
      };

      const authResult = authResponseSchema.safeParse(authResponse);
      expect(authResult.success).toBe(true);
    });
  });
});
