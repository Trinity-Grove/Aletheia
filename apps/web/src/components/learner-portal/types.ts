import type {
  LearnerCompetencyTrackingResponseDto,
  EvidenceSubmissionResponseDto,
} from '@aletheia/contracts';

export interface LearnerTrackedCompetency
  extends Omit<Partial<LearnerCompetencyTrackingResponseDto>, 'competency'> {
  id: string;
  competencyCode?: string;
  competencyVersion?: number;
  status?: 'ACTIVE' | 'RETIRED';
  achievedAt?: string | null;
  evidenceCount?: number;
  competencyDefinitionId?: string;
  characterHabits?: string[];
  trackTitle?: string;
  competency?: {
    code: string;
    title: string;
    domainId?: string | undefined;
    domainTitle?: string | undefined;
    characterHabits?: string[] | undefined;
    trackTitle?: string | undefined;
  };
}

export interface LessonReflectionData {
  notes?: string | undefined;
  isOralNarration?: boolean | undefined;
  characterHabit?: string | undefined;
  actualDurationMinutes?: number | undefined;
}

export interface LearnerAgendaItem {
  id: string;
  lessonPlanId?: string | undefined;
  title: string;
  subjectName?: string | null | undefined;
  subjectColor?: string | null | undefined;
  startTime?: string | null | undefined;
  endTime?: string | null | undefined;
  durationMinutes?: number | null | undefined;
  isCompleted?: boolean | undefined;
  status?: string | null | undefined;
  description?: string | null | undefined;
  characterHabits?: string[] | undefined;
  reflectionNotes?: string | null | undefined;
  hadOralNarration?: boolean | undefined;
}

export interface LearnerAgendaData {
  date: string;
  items: LearnerAgendaItem[];
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
