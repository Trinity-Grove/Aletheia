import { describe, expect, it } from 'vitest';
import {
  acceptMentorGrantResponseSchema,
  inviteMentorSchema,
  mentorGrantResponseSchema,
} from './mentor-grant.js';

const FAMILY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const LEARNER_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const USER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const GRANT_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

describe('Mentor Grant Contracts', () => {
  it('validates an invite with a free-form role', () => {
    const parsed = inviteMentorSchema.parse({ email: 'mentor@example.com', role: 'mestre de ofício' });
    expect(parsed.role).toBe('mestre de ofício');
  });

  it('rejects an invite with an invalid email', () => {
    expect(() => inviteMentorSchema.parse({ email: 'not-an-email', role: 'pastor' })).toThrow();
  });

  it('validates a pending grant response without mentorUserId', () => {
    const parsed = mentorGrantResponseSchema.parse({
      id: GRANT_ID,
      familyId: FAMILY_ID,
      learnerId: LEARNER_ID,
      email: 'mentor@example.com',
      role: 'professor de música',
      status: 'PENDING',
      token: 'plaintext-token-only-shown-once',
      invitedBy: USER_ID,
      expiresAt: '2026-10-01T00:00:00.000Z',
      createdAt: '2026-09-01T00:00:00.000Z',
    });
    expect(parsed.status).toBe('PENDING');
    expect(parsed.mentorUserId).toBeUndefined();
  });

  it('validates an accepted grant response with mentorUserId set', () => {
    const parsed = mentorGrantResponseSchema.parse({
      id: GRANT_ID,
      familyId: FAMILY_ID,
      learnerId: LEARNER_ID,
      email: 'mentor@example.com',
      role: 'professor de música',
      status: 'ACCEPTED',
      mentorUserId: USER_ID,
      invitedBy: USER_ID,
      expiresAt: '2026-10-01T00:00:00.000Z',
      acceptedAt: '2026-09-05T00:00:00.000Z',
      createdAt: '2026-09-01T00:00:00.000Z',
    });
    expect(parsed.status).toBe('ACCEPTED');
    expect(parsed.mentorUserId).toBe(USER_ID);
  });

  it('rejects an unknown status value', () => {
    expect(() =>
      mentorGrantResponseSchema.parse({
        id: GRANT_ID,
        familyId: FAMILY_ID,
        learnerId: LEARNER_ID,
        email: 'mentor@example.com',
        role: 'pastor',
        status: 'SOMETHING_ELSE',
        invitedBy: USER_ID,
        expiresAt: '2026-10-01T00:00:00.000Z',
        createdAt: '2026-09-01T00:00:00.000Z',
      }),
    ).toThrow();
  });

  it('validates the accept response', () => {
    const parsed = acceptMentorGrantResponseSchema.parse({
      success: true,
      familyId: FAMILY_ID,
      learnerId: LEARNER_ID,
    });
    expect(parsed.success).toBe(true);
  });
});
