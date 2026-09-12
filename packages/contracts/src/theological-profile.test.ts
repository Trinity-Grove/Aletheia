import { describe, expect, it } from 'vitest';
import { upsertTheologicalProfileSchema } from './theological-profile.js';

describe('Theological Profile Contracts', () => {
  it.each([{ '': 'POSITION' }, { eschatology: 'invalid-code' }])('rejects malformed topic overrides: %j', (topicOverrides) => {
    expect(upsertTheologicalProfileSchema.safeParse({ topicOverrides }).success).toBe(false);
  });
  it('validates an empty profile (no preference set yet)', () => {
    const parsed = upsertTheologicalProfileSchema.parse({});
    expect(parsed.preferredTraditionCode).toBeUndefined();
    expect(parsed.topicOverrides).toEqual({});
  });

  it('validates a profile with a preferred tradition and topic overrides', () => {
    const parsed = upsertTheologicalProfileSchema.parse({
      preferredTraditionCode: 'REFORMED',
      topicOverrides: { eschatology: 'REFORMED.ESCHATOLOGY.AMILLENNIALISM' },
    });
    expect(parsed.preferredTraditionCode).toBe('REFORMED');
    expect(parsed.topicOverrides.eschatology).toBe('REFORMED.ESCHATOLOGY.AMILLENNIALISM');
  });

  it('allows explicitly clearing the preferred tradition', () => {
    const parsed = upsertTheologicalProfileSchema.parse({ preferredTraditionCode: null });
    expect(parsed.preferredTraditionCode).toBeNull();
  });

  it('rejects a lowercase preferred tradition code', () => {
    expect(() => upsertTheologicalProfileSchema.parse({ preferredTraditionCode: 'reformed' })).toThrow();
  });
});
