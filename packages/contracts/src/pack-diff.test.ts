import { describe, expect, it } from 'vitest';
import {
  packDiffActionSchema,
  packDiffReportSchema,
  applyPackUpdateSchema,
} from './pack-diff.js';

describe('Pack Diff & Safe Update Schemas', () => {
  it('validates diff actions', () => {
    expect(packDiffActionSchema.safeParse('ADDED_BY_AUTHOR').success).toBe(true);
    expect(packDiffActionSchema.safeParse('UPDATED_BY_AUTHOR').success).toBe(true);
    expect(packDiffActionSchema.safeParse('PRESERVED_FAMILY_EDIT').success).toBe(true);
    expect(packDiffActionSchema.safeParse('CONFLICT_PRESERVED_FAMILY').success).toBe(true);
    expect(packDiffActionSchema.safeParse('OVERWRITE_FAMILY').success).toBe(false);
  });

  it('validates a complete diff report', () => {
    const report = {
      hasUpdate: true,
      currentVersion: 1,
      latestVersion: 2,
      sourcePackCode: 'CLASSICAL_TRIVIUM',
      items: [
        {
          definitionType: 'SkillDefinition',
          code: 'LOGIC.SYLLOGISM',
          name: 'Silogismos Categóricos',
          action: 'ADDED_BY_AUTHOR',
          description: 'Nova habilidade incluída pelo autor.',
        },
        {
          definitionType: 'CompetencyDefinition',
          code: 'GRAMMAR.PARSING',
          name: 'Análise Morfossintática',
          action: 'PRESERVED_FAMILY_EDIT',
          description: 'Modificações da família mantidas.',
        },
      ],
      summary: {
        addedCount: 1,
        updatedCount: 0,
        preservedFamilyEditsCount: 1,
        conflictsCount: 0,
      },
    };

    const parsed = packDiffReportSchema.safeParse(report);
    expect(parsed.success).toBe(true);
  });

  it('validates apply update payload', () => {
    expect(applyPackUpdateSchema.safeParse({}).success).toBe(true);
    expect(applyPackUpdateSchema.safeParse({ notes: 'Atualização do terceiro trimestre' }).success).toBe(true);
  });
});
