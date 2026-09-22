import type {
  CreateEvidenceSubmissionOutput,
  EvidenceSubmissionResponseDto,
  LearnerCompetencyTrackingResponseDto,
} from '@aletheia/contracts';

export const CURRICULUM_PUBLIC_API = Symbol('CURRICULUM_PUBLIC_API');

export interface CurriculumPublicApi {
  getLearnerCurriculumSummary(
    familyId: string,
    learnerId: string,
  ): Promise<{ totalObjectives: number; achievedObjectives: number }>;

  // Consumed by DashboardModule (issue #216) to compute the academic-year
  // day sequence shown on the "Jornada Diária" card. Returns null when the
  // family has no current academic year, or that year has no start date.
  getCurrentAcademicYearWindow(
    familyId: string,
  ): Promise<{ startDate: Date; endDate: Date | null } | null>;
}

// Consumed by LearnerAccessModule (issue #34) to let a learner submit
// evidence for their own tracking through the exact same
// EvidenceSubmissionService the guardian-facing controller uses -- no
// new validation or write path, just a narrower gate in front of it.
export const EVIDENCE_SUBMISSION_PUBLIC_API = Symbol('EVIDENCE_SUBMISSION_PUBLIC_API');

export interface EvidenceSubmissionPublicApi {
  createEvidenceSubmission(
    familyId: string,
    authorId: string,
    dto: CreateEvidenceSubmissionOutput,
  ): Promise<EvidenceSubmissionResponseDto>;
}

// Consumed by LearnerAccessModule (issue #34) for the learner-facing
// progress view -- the same tracked-competency listing already exposed
// to guardians, re-scoped to the caller's own learnerId only.
export const LEARNER_COMPETENCY_TRACKING_PUBLIC_API = Symbol('LEARNER_COMPETENCY_TRACKING_PUBLIC_API');

export interface LearnerCompetencyTrackingPublicApi {
  listTrackedCompetencies(
    familyId: string,
    learnerId?: string,
    status?: 'ACTIVE' | 'RETIRED',
  ): Promise<LearnerCompetencyTrackingResponseDto[]>;
}
