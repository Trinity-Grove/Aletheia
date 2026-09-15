import { describe, expect, it } from 'vitest';
import { createCompetencyDefinitionSchema } from './curriculum-definitions.js';
import { createLearningPathSchema } from './curriculum-path-skill-definitions.js';

const DOMAIN_ID = '00000000-0000-4000-8000-000000000001';
const PATH_ID = '00000000-0000-4000-8000-000000000002';

describe('universal educational taxonomy', () => {
  it('maps legacy academic path names to universal stages while preserving compatibility', () => {
    const path = createLearningPathSchema.parse({
      code: 'MATH.PRIMARY_GRAMMAR',
      domainId: DOMAIN_ID,
      name: 'Math',
    });

    expect(path.metadata).toMatchObject({
      progressionAxis: 'EDUCATIONAL_STAGE',
      educationalStage: 'PRIMARY',
    });
  });

  it('aligns a domain-proficiency competency with overlapping stages', () => {
    const competency = createCompetencyDefinitionSchema.parse({
      code: 'TRADES.FOUNDATIONS.TOOL_SAFETY',
      domainId: DOMAIN_ID,
      pathId: PATH_ID,
      title: 'Tool safety',
      level: 1,
      metadata: { ageRecommendation: { min: 8, max: 14 } },
    });

    expect(competency.metadata).toMatchObject({
      progressionAxis: 'DOMAIN_PROFICIENCY',
      educationalStages: ['PRIMARY', 'LOWER_SECONDARY'],
    });
  });

  it('keeps CEFR as the proficiency axis for additional-language paths', () => {
    const competency = createCompetencyDefinitionSchema.parse({
      code: 'ENGLISH.ADDITIONAL_LANGUAGE.A1',
      domainId: DOMAIN_ID,
      title: 'A1',
      level: 1,
    });

    expect(competency.metadata).toMatchObject({
      progressionAxis: 'CEFR',
      proficiencyFramework: 'CEFR',
    });
  });

  it('does not invent educational-stage alignment when age is unspecified', () => {
    const path = createLearningPathSchema.parse({
      code: 'TRADES.CABINETMAKING',
      domainId: DOMAIN_ID,
      name: 'Cabinetmaking',
    });
    const competency = createCompetencyDefinitionSchema.parse({
      code: 'TRADES.CABINETMAKING.SAFETY',
      domainId: DOMAIN_ID,
      pathId: PATH_ID,
      title: 'Safety',
      level: 1,
    });

    expect(path.metadata).toEqual({ progressionAxis: 'DOMAIN_PROFICIENCY' });
    expect(competency.metadata.progressionAxis).toBe('DOMAIN_PROFICIENCY');
    expect(competency.metadata.educationalStages).toBeUndefined();
  });
});
