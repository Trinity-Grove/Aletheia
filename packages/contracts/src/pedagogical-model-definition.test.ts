import { describe, expect, it } from 'vitest';
import {
  createPedagogicalModelDefinitionSchema,
  templateSubjectDefinitionSchema,
  pedagogicalModelCatalogEntrySchema,
} from './pedagogical-model-definition.js';

describe('Pedagogical Model Definition Contracts', () => {
  it('validates a TemplateSubjectDefinition-shaped subject', () => {
    const parsed = templateSubjectDefinitionSchema.parse({
      name: 'Vida Prática',
      color: '#CA8A04',
      icon: 'scissors',
      description: 'Cuidado pessoal e do ambiente.',
      starterObjectives: ['Executar uma sequência de cuidado do ambiente'],
    });
    expect(parsed.name).toBe('Vida Prática');
  });

  it('defaults starterObjectives to an empty array', () => {
    const parsed = templateSubjectDefinitionSchema.parse({
      name: 'Vida Prática',
      color: '#CA8A04',
      description: 'Cuidado pessoal e do ambiente.',
    });
    expect(parsed.starterObjectives).toEqual([]);
  });

  it('rejects an invalid subject color', () => {
    expect(() =>
      templateSubjectDefinitionSchema.parse({
        name: 'Vida Prática',
        color: 'gold',
        description: 'Cuidado pessoal e do ambiente.',
      }),
    ).toThrow();
  });

  it('validates a minimal pedagogical model definition with defaults', () => {
    const parsed = createPedagogicalModelDefinitionSchema.parse({
      code: 'MONTESSORI',
      name: 'Montessori',
    });
    expect(parsed.status).toBe('DRAFT');
    expect(parsed.version).toBe(1);
  });

  it('validates a pedagogical model definition with subjects in metadata', () => {
    const parsed = createPedagogicalModelDefinitionSchema.parse({
      code: 'MONTESSORI',
      name: 'Montessori',
      status: 'PUBLISHED',
      metadata: {
        subjects: [
          {
            name: 'Vida Prática',
            color: '#CA8A04',
            icon: 'scissors',
            description: 'Cuidado pessoal e do ambiente.',
            starterObjectives: ['Executar uma sequência de cuidado do ambiente'],
          },
        ],
      },
    });
    expect(parsed.metadata.subjects?.[0]?.name).toBe('Vida Prática');
  });

  it('rejects a lowercase framework code', () => {
    expect(() =>
      createPedagogicalModelDefinitionSchema.parse({ code: 'montessori', name: 'Montessori' }),
    ).toThrow();
  });
});

describe('Pedagogical Model Catalog Entry Contract', () => {
  it('validates a minimal catalog entry', () => {
    const parsed = pedagogicalModelCatalogEntrySchema.parse({
      code: 'MONTESSORI',
      name: 'Montessori',
    });
    expect(parsed.code).toBe('MONTESSORI');
  });

  it('allows a null description', () => {
    const parsed = pedagogicalModelCatalogEntrySchema.parse({
      code: 'MONTESSORI',
      name: 'Montessori',
      description: null,
    });
    expect(parsed.description).toBeNull();
  });

  it('validates discovery metadata with an approach, age range and canonical stages', () => {
    const parsed = pedagogicalModelCatalogEntrySchema.parse({
      code: 'CHARLOTTE_MASON',
      name: 'Charlotte Mason',
      approach: 'CHARLOTTE_MASON',
      recommendedAgeRange: { min: 6, max: 18 },
      educationalStages: ['PRIMARY', 'LOWER_SECONDARY', 'UPPER_SECONDARY'],
    });

    expect(parsed.recommendedAgeRange).toEqual({ min: 6, max: 18 });
    expect(parsed.educationalStages).toContain('PRIMARY');
  });

  it('rejects an inverted or out-of-range recommended age range', () => {
    expect(() =>
      pedagogicalModelCatalogEntrySchema.parse({
        code: 'MONTESSORI',
        name: 'Montessori',
        approach: 'MONTESSORI',
        recommendedAgeRange: { min: 18, max: 6 },
        educationalStages: ['PRIMARY'],
      }),
    ).toThrow();

    expect(() =>
      pedagogicalModelCatalogEntrySchema.parse({
        code: 'MONTESSORI',
        name: 'Montessori',
        approach: 'MONTESSORI',
        recommendedAgeRange: { min: 2, max: 18 },
        educationalStages: ['PRIMARY'],
      }),
    ).toThrow();

    expect(() =>
      pedagogicalModelCatalogEntrySchema.parse({
        code: 'MONTESSORI',
        name: 'Montessori',
        approach: 'MONTESSORI',
        recommendedAgeRange: { min: 6, max: 18 },
        educationalStages: ['UNKNOWN_STAGE'],
      }),
    ).toThrow();
  });
});
