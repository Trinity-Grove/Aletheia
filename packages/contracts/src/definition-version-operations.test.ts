import { describe, expect, it } from 'vitest';
import { definitionVersionDiffQuerySchema, definitionVersionDiffResponseSchema } from './definition-version-operations.js';

describe('definition version diff contracts', () => {
  it('coerces query-string versions and rejects equal versions', () => {
    expect(definitionVersionDiffQuerySchema.parse({
      entityType: 'LearningDomain',
      code: 'MATH',
      fromVersion: '1',
      toVersion: '2',
    })).toMatchObject({ fromVersion: 1, toVersion: 2 });

    expect(() => definitionVersionDiffQuerySchema.parse({
      entityType: 'LearningDomain', code: 'MATH', fromVersion: '1', toVersion: '1',
    })).toThrow();
  });

  it('accepts a field-level diff with structured values', () => {
    const parsed = definitionVersionDiffResponseSchema.parse({
      entityType: 'LearningDomain',
      code: 'MATH',
      fromVersion: 1,
      toVersion: 2,
      changedFields: [{ field: 'metadata', from: { level: 1 }, to: { level: 2 } }],
    });

    expect(parsed.changedFields).toHaveLength(1);
  });
});

