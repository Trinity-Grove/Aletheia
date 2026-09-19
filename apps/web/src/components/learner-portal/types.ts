import type {
  LearnerCompetencyTrackingResponseDto,
  EvidenceSubmissionResponseDto,
} from '@aletheia/contracts';

export interface LearnerTrackedCompetency
  extends Partial<Omit<LearnerCompetencyTrackingResponseDto, 'competency'>> {
  id: string;
  competencyCode?: string;
  competencyVersion?: number;
  status?: 'ACTIVE' | 'RETIRED';
  achievedAt?: string | null;
  evidenceCount?: number;
  competencyDefinitionId?: string;
  competency?: {
    code: string;
    title: string;
    domainId?: string;
    domainTitle?: string;
  };
}

export type EvidenceTypeCode = 'PHOTO' | 'WORK_SAMPLE' | 'DOCUMENT' | 'AUDIO' | 'TEXT';

export interface LearnerEvidenceSubmissionPayload {
  // Spec fields:
  trackingId: string;
  evidenceTypeCode: string;
  evidenceTypeVersion: number;
  title: string;
  description?: string | undefined;
  url?: string | undefined;
  notes?: string | undefined;

  // Real backend contract fields (learnerSubmitEvidenceSchema):
  evidenceTypeId: string;
  competencies: Array<{ competencyDefinitionId: string }>;
  textContent?: string | null | undefined;
  fileUrl?: string | null | undefined;
}

export type LearnerEvidenceSubmissionResult = EvidenceSubmissionResponseDto;
