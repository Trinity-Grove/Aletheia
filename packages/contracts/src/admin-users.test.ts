import { describe, expect, it } from 'vitest';
import {
  adminUserSummarySchema,
  listUsersQuerySchema,
  listUsersResponseSchema,
  updateUserFullNameSchema,
  type AdminUserSummaryDto,
} from './admin-users.js';

describe('admin-users contracts', () => {
  const user: AdminUserSummaryDto = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'guardian@example.com',
    fullName: 'Jane Doe',
    emailVerified: true,
    mfaEnabled: false,
    isPlatformAdmin: false,
    disabled: false,
    createdAt: '2026-09-28T00:00:00.000Z',
  };

  describe('adminUserSummarySchema', () => {
    it('validates a full admin user summary', () => {
      expect(adminUserSummarySchema.safeParse(user).success).toBe(true);
    });

    it('rejects an invalid email', () => {
      expect(adminUserSummarySchema.safeParse({ ...user, email: 'not-an-email' }).success).toBe(false);
    });
  });

  describe('listUsersQuerySchema', () => {
    it('defaults skip/take when omitted', () => {
      const result = listUsersQuerySchema.parse({});
      expect(result).toEqual({ skip: 0, take: 20 });
    });

    it('coerces string query params to numbers', () => {
      const result = listUsersQuerySchema.parse({ skip: '10', take: '5', search: 'jane' });
      expect(result).toEqual({ skip: 10, take: 5, search: 'jane' });
    });

    it('rejects a take above 100', () => {
      expect(listUsersQuerySchema.safeParse({ take: 500 }).success).toBe(false);
    });
  });

  describe('listUsersResponseSchema', () => {
    it('validates a page of users with a total count', () => {
      const payload = { users: [user], totalCount: 1 };
      expect(listUsersResponseSchema.safeParse(payload).success).toBe(true);
    });
  });

  describe('updateUserFullNameSchema', () => {
    it('rejects an empty full name', () => {
      expect(updateUserFullNameSchema.safeParse({ fullName: '' }).success).toBe(false);
    });
  });
});
