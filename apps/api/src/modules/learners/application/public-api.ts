import type { LearnerSummaryDto } from '@aletheia/contracts';

export const LEARNERS_PUBLIC_API = Symbol('LEARNERS_PUBLIC_API');

export interface LearnersPublicApi {
  findLearnerById(familyId: string, learnerId: string): Promise<LearnerSummaryDto | null>;
  listActiveLearners(familyId: string): Promise<LearnerSummaryDto[]>;
}
