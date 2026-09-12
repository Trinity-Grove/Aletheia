import { describe, expect, it } from 'vitest';
import {
  createTheologicalTraditionDefinitionSchema,
  createTheologicalPositionDefinitionSchema,
} from './theological-taxonomy.js';

const TRADITION_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

describe('Theological Tradition Definition Contracts', () => {
  it('validates a minimal tradition with defaults', () => {
    const parsed = createTheologicalTraditionDefinitionSchema.parse({
      code: 'REFORMED',
      name: 'Reformada',
    });
    expect(parsed.status).toBe('DRAFT');
  });

  it('rejects a lowercase tradition code', () => {
    expect(() =>
      createTheologicalTraditionDefinitionSchema.parse({ code: 'reformed', name: 'x' }),
    ).toThrow();
  });
});

describe('Theological Position Definition Contracts', () => {
  it('validates a minimal position with defaults', () => {
    const parsed = createTheologicalPositionDefinitionSchema.parse({
      code: 'REFORMED.SOTERIOLOGY.CALVINISM',
      traditionId: TRADITION_ID,
      topic: 'soteriology',
      name: 'Calvinismo',
    });
    expect(parsed.topic).toBe('soteriology');
    expect(parsed.status).toBe('DRAFT');
  });

  it('rejects a lowercase position code', () => {
    expect(() =>
      createTheologicalPositionDefinitionSchema.parse({
        code: 'reformed.soteriology.calvinism',
        traditionId: TRADITION_ID,
        topic: 'soteriology',
        name: 'x',
      }),
    ).toThrow();
  });

  it('allows a missing traditionId -- cross-cutting positions (e.g. eschatological schools of thought) are not owned by one tradition', () => {
    const parsed = createTheologicalPositionDefinitionSchema.parse({
      code: 'ESCHATOLOGY.MILLENNIUM.AMILLENNIALISM',
      topic: 'eschatology.millennium',
      name: 'Amilenismo',
    });
    expect(parsed.traditionId).toBeUndefined();
  });

  it('rejects a malformed (non-UUID) traditionId when one is provided', () => {
    expect(() =>
      createTheologicalPositionDefinitionSchema.parse({
        code: 'REFORMED.SOTERIOLOGY.CALVINISM',
        traditionId: 'not-a-uuid',
        topic: 'soteriology',
        name: 'x',
      }),
    ).toThrow();
  });
});
