import { describe, expect, it } from 'vitest';
import {
  packDiffActionSchema,
  packDiffReportSchema,
  applyPackUpdateSchema,
  applyPackUpdateResponseSchema,
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

  it('validates apply pack update response schema', () => {
    const validResponse = {
      updatedFamilyPack: {
        id: '11111111-1111-4111-8111-111111111111',
        familyId: '22222222-2222-4222-8222-222222222222',
        sourcePackId: '33333333-3333-4333-8333-333333333333',
        sourcePackCode: 'CLASSICAL_TRIVIUM',
        sourcePackVersion: 2,
        revision: 3,
        document: {
          formatVersion: '1.0.0',
          exportedAt: '2026-09-29T12:00:00.000Z',
          pack: {
            code: 'CLASSICAL_TRIVIUM',
            version: 2,
            status: 'PUBLISHED',
            schemaVersion: '1.0.0',
            name: 'Classical Trivium',
            metadata: {},
          },
          dependencies: [],
          items: [],
        },
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-29T12:00:00.000Z',
      },
      diffReport: {
        hasUpdate: true,
        currentVersion: 1,
        latestVersion: 2,
        sourcePackCode: 'CLASSICAL_TRIVIUM',
        items: [
          {
            definitionType: 'CompetencyDefinition',
            code: 'LOGIC.SYLLOGISM',
            name: 'Silogismos Categóricos',
            action: 'ADDED_BY_AUTHOR',
          },
        ],
        summary: {
          addedCount: 1,
          updatedCount: 0,
          preservedFamilyEditsCount: 0,
          conflictsCount: 0,
        },
      },
      previousRevision: 2,
      newRevision: 3,
    };

    const parsed = applyPackUpdateResponseSchema.safeParse(validResponse);
    expect(parsed.success).toBe(true);

    const invalidResponse = {
      ...validResponse,
      previousRevision: 0, // must be >= 1
    };
    expect(applyPackUpdateResponseSchema.safeParse(invalidResponse).success).toBe(false);
  });
});
