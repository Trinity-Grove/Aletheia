'use client';

import React, { useEffect, useState } from 'react';
import { Alert } from '@aletheia/ui';
import type { AcademicYearResponseDto, LearnerSummaryDto } from '@aletheia/contracts';
import { ProductShell } from '../../../../src/components/product-shell';
import { CurriculumExploreGallery } from '../../../../src/components/curriculum/curriculum-explore-gallery';
import { useLocale } from '../../../../src/lib/i18n/locale-context';

export default function CurriculumExplorePage() {
  const { t } = useLocale();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [learners, setLearners] = useState<LearnerSummaryDto[]>([]);
  const [activeLearnerId, setActiveLearnerId] = useState<string | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYearResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      try {
        const storedFamilyId = localStorage.getItem('familyId');
        if (!storedFamilyId) {
          if (!cancelled) setLoadError(true);
          return;
        }

        const [learnersResponse, yearsResponse] = await Promise.all([
          fetch(`/api/v1/families/${storedFamilyId}/learners`, { credentials: 'include' }),
          fetch(`/api/v1/families/${storedFamilyId}/curriculum/academic-years`, { credentials: 'include' }),
        ]);
        if (!learnersResponse.ok || !yearsResponse.ok) throw new Error('context');

        const [loadedLearners, loadedYears] = await Promise.all([
          learnersResponse.json() as Promise<LearnerSummaryDto[]>,
          yearsResponse.json() as Promise<AcademicYearResponseDto[]>,
        ]);
        if (cancelled) return;

        const nextLearners = Array.isArray(loadedLearners) ? loadedLearners : [];
        const nextAcademicYears = Array.isArray(loadedYears) ? loadedYears : [];
        setFamilyId(storedFamilyId);
        setLearners(nextLearners);
        setActiveLearnerId(nextLearners[0]?.id ?? null);
        setAcademicYears(nextAcademicYears);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadContext();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ProductShell
      learners={learners}
      activeLearnerId={activeLearnerId}
      onSelectLearner={setActiveLearnerId}
    >
      {loading ? (
        <div className="page-container curriculum-explore__page-state" data-testid="curriculum-explore-page-loading">
          {t('curriculum.explore.pageLoading')}
        </div>
      ) : loadError || !familyId ? (
        <div className="page-container curriculum-explore__page-state">
          <Alert variant="error" data-testid="curriculum-explore-page-error">
            {t('curriculum.explore.pageError')}
          </Alert>
        </div>
      ) : (
        <div className="page-container">
          <CurriculumExploreGallery
            familyId={familyId}
            learners={learners}
            academicYears={academicYears}
          />
        </div>
      )}
    </ProductShell>
  );
}
