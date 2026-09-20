import { describe, expect, it } from 'vitest';
import {
  learnerAccessGrantSchema,
  learnerAccessCodeSchema,
  learnerAccessOptionSchema,
  learnerLoginSchema,
  learnerTokenLoginSchema,
  learnerSessionResponseSchema,
} from './learner-access.js';

const LEARNER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const FAMILY_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

describe('Learner Access Contracts', () => {
  describe('learnerAccessGrantSchema', () => {
    it('validates a grant status payload', () => {
      const parsed = learnerAccessGrantSchema.parse({
        learnerId: LEARNER_ID,
        enabled: true,
        createdAt: '2026-08-26T15:00:00.000Z',
        regeneratedAt: null,
        lastUsedAt: null,
      });
      expect(parsed.enabled).toBe(true);
    });

    it('never accepts a code or codeHash field as part of the shape', () => {
      const parsed = learnerAccessGrantSchema.parse({
        learnerId: LEARNER_ID,
        enabled: false,
        createdAt: null,
        regeneratedAt: null,
        lastUsedAt: null,
        code: 'SHOULDNOTAPPEAR',
      });
      expect(parsed).not.toHaveProperty('code');
    });
  });

  describe('learnerAccessCodeSchema', () => {
    it('validates the one-time plaintext-code response', () => {
      const parsed = learnerAccessCodeSchema.parse({
        grant: {
          learnerId: LEARNER_ID,
          enabled: true,
          createdAt: '2026-08-26T15:00:00.000Z',
          regeneratedAt: null,
          lastUsedAt: null,
        },
        code: 'ABCD1234',
        accessToken: 'mock-access-token-jwt',
        accessUrl: '/aluno/login?token=mock-access-token-jwt',
      });
      expect(parsed.code).toBe('ABCD1234');
      expect(parsed.accessToken).toBe('mock-access-token-jwt');
      expect(parsed.accessUrl).toBe('/aluno/login?token=mock-access-token-jwt');
    });
  });

  describe('learnerAccessOptionSchema', () => {
    it('validates a login-picker option', () => {
      const parsed = learnerAccessOptionSchema.parse({
        learnerId: LEARNER_ID,
        displayName: 'Joana',
      });
      expect(parsed.displayName).toBe('Joana');
    });
  });

  describe('learnerLoginSchema', () => {
    it('validates a login payload', () => {
      const parsed = learnerLoginSchema.parse({ learnerId: LEARNER_ID, code: 'ABCD1234' });
      expect(parsed.code).toBe('ABCD1234');
    });

    it('rejects a code shorter than 4 characters', () => {
      expect(() => learnerLoginSchema.parse({ learnerId: LEARNER_ID, code: 'AB' })).toThrow();
    });
  });

  describe('learnerTokenLoginSchema', () => {
    it('validates a token login payload', () => {
      const parsed = learnerTokenLoginSchema.parse({ token: 'valid-jwt-token-long-string' });
      expect(parsed.token).toBe('valid-jwt-token-long-string');
    });

    it('rejects a token shorter than 10 characters', () => {
      expect(() => learnerTokenLoginSchema.parse({ token: 'short' })).toThrow();
    });
  });

  describe('learnerSessionResponseSchema', () => {
    it('validates a session response with no token field', () => {
      const parsed = learnerSessionResponseSchema.parse({
        learnerId: LEARNER_ID,
        familyId: FAMILY_ID,
        displayName: 'Joana',
        expiresAt: '2026-08-27T00:00:00.000Z',
      });
      expect(parsed).not.toHaveProperty('token');
      expect(parsed).not.toHaveProperty('accessToken');
    });
  });
});
