import { describe, expect, it } from 'vitest';
import { upsertPedagogicalProfileSchema } from './pedagogical-profile.js';

describe('Pedagogical Profile Contracts', () => {
  it.each([
    [{ code: 'MONTESSORI', weight: 0.2 }],
    [{ code: 'ECLECTIC', weight: 0.2 }, { code: 'ECLECTIC', weight: 0.3 }],
  ])('rejects repeated primary or secondary model references: %j', (...secondaryModels) => {
    expect(upsertPedagogicalProfileSchema.safeParse({
      primaryModelCode: 'MONTESSORI', secondaryModels,
    }).success).toBe(false);
  });
  it('validates a minimal profile with defaults', () => {
    const parsed = upsertPedagogicalProfileSchema.parse({ primaryModelCode: 'MONTESSORI' });
    expect(parsed.secondaryModels).toEqual([]);
    expect(parsed.overrides).toEqual({});
  });

  it('validates a profile combining multiple models with weights', () => {
    const parsed = upsertPedagogicalProfileSchema.parse({
      primaryModelCode: 'CLASSICAL_TRIVIUM',
      secondaryModels: [
        { code: 'CHARLOTTE_MASON', weight: 0.3 },
        { code: 'MONTESSORI', weight: 0.1 },
      ],
      overrides: { structureLevel: 'FLEXIBLE' },
    });
    expect(parsed.secondaryModels).toHaveLength(2);
    expect(parsed.overrides.structureLevel).toBe('FLEXIBLE');
  });

  it('rejects a lowercase primary model code', () => {
    expect(() => upsertPedagogicalProfileSchema.parse({ primaryModelCode: 'montessori' })).toThrow();
  });

  it('rejects a secondary model weight outside 0..1', () => {
    expect(() =>
      upsertPedagogicalProfileSchema.parse({
        primaryModelCode: 'MONTESSORI',
        secondaryModels: [{ code: 'ECLECTIC', weight: 1.5 }],
      }),
    ).toThrow();
  });
});
