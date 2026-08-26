export const CURRICULUM_PUBLIC_API = Symbol('CURRICULUM_PUBLIC_API');

export interface CurriculumPublicApi {
  getLearnerCurriculumSummary(
    familyId: string,
    learnerId: string,
  ): Promise<{ totalObjectives: number; achievedObjectives: number }>;
}
