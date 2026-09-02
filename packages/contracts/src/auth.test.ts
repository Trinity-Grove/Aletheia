import { describe, expect, it } from 'vitest';
import {
  accountAuditLogEntrySchema,
  authResponseSchema,
  changeEmailSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerGuardianSchema,
  resetPasswordSchema,
  userSummarySchema,
  type AccountAuditLogEntryDto,
  type AuthResponseDto,
  type ChangeEmailDto,
  type ChangePasswordDto,
  type ForgotPasswordDto,
  type LoginDto,
  type RegisterGuardianDto,
  type ResetPasswordDto,
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
        emailVerified: false,
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

  describe('forgotPasswordSchema', () => {
    it('validates a valid email', () => {
      const payload: ForgotPasswordDto = { email: 'guardian@example.com' };
      expect(forgotPasswordSchema.safeParse(payload).success).toBe(true);
    });

    it('rejects an invalid email', () => {
      expect(forgotPasswordSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('validates a valid token and password', () => {
      const payload: ResetPasswordDto = { token: 'abc123', newPassword: 'newSecurePassword1' };
      expect(resetPasswordSchema.safeParse(payload).success).toBe(true);
    });

    it('rejects a short new password', () => {
      expect(
        resetPasswordSchema.safeParse({ token: 'abc123', newPassword: 'short' }).success,
      ).toBe(false);
    });

    it('rejects an empty token', () => {
      expect(
        resetPasswordSchema.safeParse({ token: '', newPassword: 'newSecurePassword1' }).success,
      ).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('validates a valid current and new password', () => {
      const payload: ChangePasswordDto = { currentPassword: 'oldPassword1', newPassword: 'newSecurePassword1' };
      expect(changePasswordSchema.safeParse(payload).success).toBe(true);
    });

    it('rejects a short new password', () => {
      expect(
        changePasswordSchema.safeParse({ currentPassword: 'oldPassword1', newPassword: 'short' }).success,
      ).toBe(false);
    });

    it('rejects an empty current password', () => {
      expect(
        changePasswordSchema.safeParse({ currentPassword: '', newPassword: 'newSecurePassword1' }).success,
      ).toBe(false);
    });
  });

  describe('changeEmailSchema', () => {
    it('validates a valid current password and new email', () => {
      const payload: ChangeEmailDto = { currentPassword: 'oldPassword1', newEmail: 'new@example.com' };
      expect(changeEmailSchema.safeParse(payload).success).toBe(true);
    });

    it('rejects an invalid new email', () => {
      expect(
        changeEmailSchema.safeParse({ currentPassword: 'oldPassword1', newEmail: 'not-an-email' }).success,
      ).toBe(false);
    });

    it('rejects an empty current password', () => {
      expect(
        changeEmailSchema.safeParse({ currentPassword: '', newEmail: 'new@example.com' }).success,
      ).toBe(false);
    });
  });

  describe('accountAuditLogEntrySchema', () => {
    it('validates a valid audit log entry', () => {
      const payload: AccountAuditLogEntryDto = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        eventType: 'LOGIN_SUCCEEDED',
        createdAt: '2026-08-23T12:00:00.000Z',
      };
      expect(accountAuditLogEntrySchema.safeParse(payload).success).toBe(true);
    });

    it('rejects an unknown event type', () => {
      expect(
        accountAuditLogEntrySchema.safeParse({
          id: '123e4567-e89b-12d3-a456-426614174000',
          eventType: 'NOT_A_REAL_EVENT',
          createdAt: '2026-08-23T12:00:00.000Z',
        }).success,
      ).toBe(false);
    });
  });
});
