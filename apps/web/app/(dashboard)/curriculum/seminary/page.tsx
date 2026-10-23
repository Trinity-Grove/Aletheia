'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert } from '@aletheia/ui';
import type {
  EvidenceTypeCatalogEntryDto,
  LearnerCompetencyTrackingResponseDto,
  LearnerSummaryDto,
} from '@aletheia/contracts';
import { useOptionalAuth } from '../../../../src/lib/auth/auth-context';
import { useLocale } from '../../../../src/lib/i18n/locale-context';
import { SeminaryModuleViewer } from '../../../../src/components/curriculum/seminary-module-viewer';
import type { SeminaryPaperSubmissionData } from '../../../../src/components/curriculum/seminary-paper-submission-modal';

export default function SeminaryPage() {
  const { t } = useLocale();
  const auth = useOptionalAuth();
  const [preferredTraditionCode, setPreferredTraditionCode] = useState<string | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [learners, setLearners] = useState<LearnerSummaryDto[]>([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);
  const [evidenceTypes, setEvidenceTypes] = useState<EvidenceTypeCatalogEntryDto[]>([]);
  const [trackedCompetencies, setTrackedCompetencies] = useState<LearnerCompetencyTrackingResponseDto[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [pageError, setPageError] = useState(false);
  const [trackingError, setTrackingError] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  useEffect(() => {
    if (auth?.status === 'loading' && !auth.activeFamilyId) {
      setIsPageLoading(true);
      return;
    }

    const effectiveFamilyId =
      auth?.activeFamilyId ??
      (typeof window !== 'undefined'
        ? localStorage.getItem('aletheia_active_family_id') ?? localStorage.getItem('familyId')
        : null);

    if (!effectiveFamilyId) {
      setFamilyId(null);
      setLearners([]);
      setSelectedLearnerId(null);
      setEvidenceTypes([]);
      setTrackedCompetencies([]);
      setPageError(false);
      setIsPageLoading(false);
      return;
    }

    const controller = new AbortController();
    setFamilyId(effectiveFamilyId);
    setIsPageLoading(true);
    setPageError(false);

    async function loadSubmissionContext() {
      try {
        const [learnersResponse, evidenceTypesResponse] = await Promise.all([
          fetch(`/api/v1/families/${effectiveFamilyId}/learners`, {
            credentials: 'include',
            signal: controller.signal,
          }),
          fetch(`/api/v1/families/${effectiveFamilyId}/curriculum/evidence-types/catalog`, {
            credentials: 'include',
            signal: controller.signal,
          }),
        ]);
        if (!learnersResponse.ok || !evidenceTypesResponse.ok) throw new Error('submission-context');

        const [learnerData, evidenceTypeData] = await Promise.all([
          learnersResponse.json() as Promise<LearnerSummaryDto[]>,
          evidenceTypesResponse.json() as Promise<EvidenceTypeCatalogEntryDto[]>,
        ]);
        if (controller.signal.aborted) return;

        const nextLearners = Array.isArray(learnerData) ? learnerData : [];
        setLearners(nextLearners);
        setEvidenceTypes(Array.isArray(evidenceTypeData) ? evidenceTypeData : []);
        setSelectedLearnerId((current) =>
          current && nextLearners.some((learner) => learner.id === current)
            ? current
            : nextLearners[0]?.id ?? null
        );
      } catch {
        if (!controller.signal.aborted) {
          setPageError(true);
          setLearners([]);
          setEvidenceTypes([]);
          setSelectedLearnerId(null);
        }
      } finally {
        if (!controller.signal.aborted) setIsPageLoading(false);
      }
    }

    void loadSubmissionContext();
    return () => controller.abort();
  }, [auth?.activeFamilyId, auth?.status]);

  useEffect(() => {
    const effectiveFamilyId = familyId;
    if (!effectiveFamilyId || !selectedLearnerId) {
      setTrackedCompetencies([]);
      setIsTrackingLoading(false);
      setTrackingError(false);
      return;
    }

    const controller = new AbortController();
    setIsTrackingLoading(true);
    setTrackingError(false);

    async function loadTrackedCompetencies() {
      try {
        const params = new URLSearchParams({ learnerId: selectedLearnerId, status: 'ACTIVE' });
        const response = await fetch(
          `/api/v1/families/${effectiveFamilyId}/curriculum/competency-tracking?${params.toString()}`,
          { credentials: 'include', signal: controller.signal }
        );
        if (!response.ok) throw new Error('competencies');
        const data = (await response.json()) as LearnerCompetencyTrackingResponseDto[];
        if (!controller.signal.aborted) setTrackedCompetencies(Array.isArray(data) ? data : []);
      } catch {
        if (!controller.signal.aborted) {
          setTrackedCompetencies([]);
          setTrackingError(true);
        }
      } finally {
        if (!controller.signal.aborted) setIsTrackingLoading(false);
      }
    }

    void loadTrackedCompetencies();
    return () => controller.abort();
  }, [familyId, selectedLearnerId]);

  useEffect(() => {
    setPreferredTraditionCode(null);
    const effectiveFamilyId =
      auth?.activeFamilyId ??
      (typeof window !== 'undefined'
        ? localStorage.getItem('aletheia_active_family_id') ?? localStorage.getItem('familyId')
        : null);

    if (!effectiveFamilyId) return;

    let isMounted = true;
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/v1/families/${effectiveFamilyId}/theological-profile`, {
          credentials: 'include',
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data?.preferredTraditionCode) setPreferredTraditionCode(data.preferredTraditionCode);
        }
      } catch {
        // Fall back to the ecumenical lens if the profile cannot be fetched.
      }
    }

    void fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [auth?.activeFamilyId]);

  useEffect(() => {
    setSubmissionSuccess(false);
  }, [selectedLearnerId]);

  const handleSubmitPaper = async (data: SeminaryPaperSubmissionData) => {
    if (!familyId || !selectedLearnerId) throw new Error(t('curriculum.seminaryPaperModal.submissionFailed'));
    setSubmissionSuccess(false);

    const competency = trackedCompetencies.find(
      (tracking) => tracking.competency.code === data.disciplineCode && tracking.status === 'ACTIVE'
    );
    const evidenceType = evidenceTypes.find((entry) => entry.code === data.evidenceTypeCode);
    if (!competency || !evidenceType) {
      throw new Error(t('curriculum.seminaryPaperModal.submissionContextChanged'));
    }

    try {
      const response = await fetch(`/api/v1/families/${familyId}/curriculum/evidence-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          learnerId: selectedLearnerId,
          evidenceTypeId: evidenceType.id,
          competencies: [{ competencyDefinitionId: competency.competencyDefinitionId }],
          title: data.title,
          textContent: data.textContent,
          fileUrl: data.fileUrl || null,
        }),
      });
      if (!response.ok) throw new Error('submission');
    } catch {
      throw new Error(t('curriculum.seminaryPaperModal.submissionFailed'));
    }

    setSubmissionSuccess(true);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <nav aria-label={t('curriculum.pages.seminary.breadcrumb')} style={{ marginBottom: '1.5rem' }}>
        <Link
          href="/curriculum"
          data-testid="seminary-back-link"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.875rem',
            color: 'var(--forest)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          &larr; {t('curriculum.seminary.backToCurriculum')}
        </Link>
      </nav>

      {isPageLoading ? (
        <p role="status">{t('curriculum.seminary.submissionContextLoading')}</p>
      ) : pageError ? (
        <Alert variant="error" data-testid="seminary-context-error">
          {t('curriculum.seminary.submissionContextError')}
        </Alert>
      ) : !familyId ? (
        <Alert variant="info" data-testid="seminary-no-family">
          {t('curriculum.seminary.submissionNoFamily')}
        </Alert>
      ) : learners.length === 0 ? (
        <Alert variant="info" data-testid="seminary-no-learners">
          {t('curriculum.seminary.submissionNoLearners')}{' '}
          <Link href="/learners">{t('curriculum.seminary.addLearnerLink')}</Link>
        </Alert>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <label htmlFor="seminary-learner-select" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('curriculum.seminary.learnerLabel')}
          </label>
          <select
            id="seminary-learner-select"
            data-testid="seminary-learner-select"
            value={selectedLearnerId ?? ''}
            onChange={(event) => setSelectedLearnerId(event.target.value || null)}
            style={{
              width: '100%',
              maxWidth: '28rem',
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
          >
            {learners.map((learner) => (
              <option key={learner.id} value={learner.id}>
                {[learner.preferredName || learner.firstName, learner.lastName].filter(Boolean).join(' ')}
              </option>
            ))}
          </select>
          {trackingError && (
            <Alert variant="error" data-testid="seminary-tracking-error">
              {t('curriculum.seminary.competencyLoadError')}
            </Alert>
          )}
          {!trackingError && isTrackingLoading && (
            <p role="status" style={{ margin: 0, color: 'var(--text-secondary)' }}>
              {t('curriculum.seminary.competencyLoading')}
            </p>
          )}
        </div>
      )}

      {submissionSuccess && (
        <Alert variant="success" data-testid="seminary-submission-success" style={{ marginBottom: '1rem' }}>
          {t('curriculum.seminaryPaperModal.submissionSuccess')}
        </Alert>
      )}

      <SeminaryModuleViewer
        preferredTraditionCode={preferredTraditionCode}
        familyId={familyId}
        selectedLearnerId={selectedLearnerId}
        evidenceTypes={evidenceTypes}
        trackedCompetencies={trackedCompetencies}
        isSubmissionContextLoading={isPageLoading || isTrackingLoading}
        hasSubmissionContextError={pageError || trackingError}
        onSubmitPaper={handleSubmitPaper}
      />
    </div>
  );
}
