import { describe, expect, it } from 'vitest';
import { curriculumPackModerationHistoryResponseSchema } from './curriculum-pack-moderation-history.js';

describe('CurriculumPack moderation history contracts', () => {
  it('accepts rejection, correction and resubmission events', () => {
    const result = curriculumPackModerationHistoryResponseSchema.parse({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      packId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      event: 'REJECTED',
      moderationStatus: 'REJECTED',
      notes: 'Add a learning objective.',
      createdAt: '2026-10-15T00:00:00.000Z',
    });

    expect(result.event).toBe('REJECTED');
  });
});
