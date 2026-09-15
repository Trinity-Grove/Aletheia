import { z } from 'zod';

/** Shared, country-neutral educational context for every curriculum domain. */
export const universalEducationalStageSchema = z.enum([
  'EARLY_YEARS',
  'PRIMARY',
  'LOWER_SECONDARY',
  'UPPER_SECONDARY',
]);

export type UniversalEducationalStage = z.infer<typeof universalEducationalStageSchema>;

export const progressionAxisSchema = z.enum([
  'EDUCATIONAL_STAGE',
  'DOMAIN_PROFICIENCY',
  'CEFR',
]);

export type ProgressionAxis = z.infer<typeof progressionAxisSchema>;

const stageByPathSegment: Record<string, UniversalEducationalStage> = {
  EARLY_YEARS: 'EARLY_YEARS',
  PRIMARY: 'PRIMARY',
  PRIMARY_GRAMMAR: 'PRIMARY',
  LOWER_SECONDARY: 'LOWER_SECONDARY',
  MIDDLE_LOGIC: 'LOWER_SECONDARY',
  UPPER_SECONDARY: 'UPPER_SECONDARY',
  HIGH_RHETORIC: 'UPPER_SECONDARY',
};

const stageAgeRanges: Array<{ stage: UniversalEducationalStage; min: number; max: number }> = [
  { stage: 'EARLY_YEARS', min: 4, max: 5 },
  { stage: 'PRIMARY', min: 6, max: 10 },
  { stage: 'LOWER_SECONDARY', min: 11, max: 14 },
  { stage: 'UPPER_SECONDARY', min: 15, max: 18 },
];

export function progressionMetadataForCode(
  code: string,
  ageRecommendation?: { min?: number | undefined; max?: number | undefined },
): {
  progressionAxis: ProgressionAxis;
  educationalStage?: UniversalEducationalStage;
  educationalStages?: UniversalEducationalStage[];
  proficiencyFramework?: string;
} {
  const segments = code.split('.');
  const stageSegment = segments.find((segment) => stageByPathSegment[segment]);
  if (stageSegment) {
    const educationalStage = stageByPathSegment[stageSegment];
    if (!educationalStage) throw new Error(`Unknown educational stage segment: ${stageSegment}`);
    return {
      progressionAxis: 'EDUCATIONAL_STAGE',
      educationalStage,
    };
  }
  if (segments.includes('ADDITIONAL_LANGUAGE')) {
    return { progressionAxis: 'CEFR', proficiencyFramework: 'CEFR' };
  }
  if (!ageRecommendation || (ageRecommendation.min === undefined && ageRecommendation.max === undefined)) {
    return { progressionAxis: 'DOMAIN_PROFICIENCY' };
  }
  const min = ageRecommendation?.min ?? 0;
  const max = ageRecommendation?.max ?? 120;
  const educationalStages = stageAgeRanges
    .filter((range) => range.max >= min && range.min <= max)
    .map((range) => range.stage);
  return {
    progressionAxis: 'DOMAIN_PROFICIENCY',
    ...(educationalStages.length ? { educationalStages } : {}),
  };
}
