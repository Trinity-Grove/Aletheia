import { describe, expect, it } from 'vitest';
import {
  createCurriculumPackSchema,
  addCurriculumPackItemSchema,
  addCurriculumPackDependencySchema,
  curriculumPackDefinitionTypeSchema,
} from './curriculum-pack.js';

describe('Curriculum Pack Contracts', () => {
  it('validates a minimal pack with defaults', () => {
    const parsed = createCurriculumPackSchema.parse({
      code: 'CLASSICAL_TRIVIUM_STARTER',
      name: 'Classical Trivium Starter Pack',
    });
    expect(parsed.status).toBe('DRAFT');
    expect(parsed.version).toBe(1);
  });

  it('rejects a lowercase pack code', () => {
    expect(() =>
      createCurriculumPackSchema.parse({ code: 'classical_trivium', name: 'x' }),
    ).toThrow();
  });

  it('accepts every known definition type for a pack item', () => {
    for (const type of curriculumPackDefinitionTypeSchema.options) {
      const parsed = addCurriculumPackItemSchema.parse({
        definitionType: type,
        code: 'SOME_CODE',
        version: 1,
      });
      expect(parsed.definitionType).toBe(type);
    }
  });

  it('rejects an unknown definition type', () => {
    expect(() =>
      addCurriculumPackItemSchema.parse({ definitionType: 'NotARealType', code: 'X', version: 1 }),
    ).toThrow();
  });

  it('validates a pack dependency', () => {
    const parsed = addCurriculumPackDependencySchema.parse({
      dependsOnCode: 'BASE_PACK',
      dependsOnVersion: 2,
    });
    expect(parsed.dependsOnVersion).toBe(2);
  });

  it('rejects a malformed dependency code', () => {
    expect(() =>
      addCurriculumPackDependencySchema.parse({ dependsOnCode: 'base pack!', dependsOnVersion: 1 }),
    ).toThrow();
  });
});
