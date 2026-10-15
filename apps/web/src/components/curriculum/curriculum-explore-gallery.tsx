'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AletheiaIcon,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
} from '@aletheia/ui';
import type {
  AcademicYearResponseDto,
  LearnerSummaryDto,
  PedagogicalModelCatalogEntryDto,
} from '@aletheia/contracts';
import { Can } from '../auth/role-guard';
import { useLocale } from '../../lib/i18n/locale-context';

const ALL_FILTER = 'all';
const AGE_OPTIONS = Array.from({ length: 16 }, (_, index) => index + 3);

export interface CurriculumExploreGalleryProps {
  familyId: string;
  learners: LearnerSummaryDto[];
  academicYears: AcademicYearResponseDto[];
  onAdopt?(templateCode: string): Promise<void> | void;
}

interface AdoptionSummary {
  subjectsCount: number;
  objectivesCount: number;
  reusedObjectivesCount: number;
}

function currentYearId(academicYears: AcademicYearResponseDto[]): string {
  return academicYears.find((year) => year.isCurrent)?.id ?? academicYears[0]?.id ?? '';
}

export function CurriculumExploreGallery({
  familyId,
  learners,
  academicYears,
  onAdopt,
}: CurriculumExploreGalleryProps) {
  const { t } = useLocale();
  const [catalog, setCatalog] = useState<PedagogicalModelCatalogEntryDto[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [selectedApproach, setSelectedApproach] = useState(ALL_FILTER);
  const [selectedAge, setSelectedAge] = useState(ALL_FILTER);
  const [selectedLearnerId, setSelectedLearnerId] = useState(learners[0]?.id ?? '');
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState(currentYearId(academicYears));
  const [adoptingCode, setAdoptingCode] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState(false);
  const [adoptionError, setAdoptionError] = useState(false);
  const [adoptionSuccess, setAdoptionSuccess] = useState<{
    code: string;
    summary: AdoptionSummary;
  } | null>(null);

  useEffect(() => {
    setSelectedLearnerId((current) => (
      learners.some((learner) => learner.id === current) ? current : learners[0]?.id ?? ''
    ));
  }, [learners]);

  useEffect(() => {
    setSelectedAcademicYearId((current) => (
      academicYears.some((year) => year.id === current) ? current : currentYearId(academicYears)
    ));
  }, [academicYears]);

  useEffect(() => {
    let cancelled = false;
    setLoadingCatalog(true);
    setCatalogError(false);

    fetch(`/api/v1/families/${familyId}/curriculum/templates/catalog`, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('catalog');
        return response.json() as Promise<PedagogicalModelCatalogEntryDto[]>;
      })
      .then((entries) => {
        if (!cancelled) setCatalog(Array.isArray(entries) ? entries : []);
      })
      .catch(() => {
        if (!cancelled) {
          setCatalog([]);
          setCatalogError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalog(false);
      });

    return () => {
      cancelled = true;
    };
  }, [familyId]);

  const approachOptions = useMemo(
    () => Array.from(new Set(catalog.map((entry) => entry.approach ?? entry.code))).sort(),
    [catalog],
  );

  const filteredCatalog = useMemo(() => {
    const age = selectedAge === ALL_FILTER ? null : Number(selectedAge);
    return catalog.filter((entry) => {
      const approach = entry.approach ?? entry.code;
      if (selectedApproach !== ALL_FILTER && approach !== selectedApproach) return false;
      if (age !== null) {
        const range = entry.recommendedAgeRange;
        const outsideRange = range === undefined || age < range.min || age > range.max;
        if (outsideRange) return false;
      }
      return true;
    });
  }, [catalog, selectedAge, selectedApproach]);

  const handleAdopt = async (templateCode: string) => {
    setSelectionError(false);
    setAdoptionError(false);
    setAdoptionSuccess(null);

    if (!selectedLearnerId || !selectedAcademicYearId) {
      setSelectionError(true);
      return;
    }

    setAdoptingCode(templateCode);
    try {
      const response = await fetch(`/api/v1/families/${familyId}/curriculum/templates/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          learnerId: selectedLearnerId,
          academicYearId: selectedAcademicYearId,
          template: templateCode,
        }),
      });

      if (!response.ok) throw new Error('adoption');

      const summary = (await response.json()) as Partial<AdoptionSummary>;
      const normalizedSummary: AdoptionSummary = {
        subjectsCount: summary.subjectsCount ?? 0,
        objectivesCount: summary.objectivesCount ?? 0,
        reusedObjectivesCount: summary.reusedObjectivesCount ?? 0,
      };
      setAdoptionSuccess({ code: templateCode, summary: normalizedSummary });
      await onAdopt?.(templateCode);
    } catch {
      setAdoptionError(true);
    } finally {
      setAdoptingCode(null);
    }
  };

  return (
    <div className="curriculum-explore" data-testid="curriculum-explore-gallery">
      <PageHeader
        title={t('curriculum.explore.title')}
        description={t('curriculum.explore.description')}
        action={(
          <a className="ui-button ui-button--secondary ui-button--sm curriculum-explore__back-link" href="/curriculum">
            <AletheiaIcon name="arrow-left" size={16} />
            {t('curriculum.explore.backToPlanning')}
          </a>
        )}
      />

      <div className="curriculum-explore__context" data-testid="curriculum-explore-context">
        <div className="curriculum-explore__context-field">
          <label htmlFor="curriculum-explore-learner">{t('curriculum.explore.learnerLabel')}</label>
          <select
            id="curriculum-explore-learner"
            value={selectedLearnerId}
            onChange={(event) => setSelectedLearnerId(event.target.value)}
          >
            <option value="">{t('curriculum.explore.selectLearner')}</option>
            {learners.map((learner) => (
              <option key={learner.id} value={learner.id}>
                {learner.preferredName || learner.firstName}
              </option>
            ))}
          </select>
        </div>
        <div className="curriculum-explore__context-field">
          <label htmlFor="curriculum-explore-year">{t('curriculum.explore.yearLabel')}</label>
          <select
            id="curriculum-explore-year"
            value={selectedAcademicYearId}
            onChange={(event) => setSelectedAcademicYearId(event.target.value)}
          >
            <option value="">{t('curriculum.explore.selectYear')}</option>
            {academicYears.map((academicYear) => (
              <option key={academicYear.id} value={academicYear.id}>
                {academicYear.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="curriculum-explore__filters" data-testid="curriculum-explore-filters">
        <div className="curriculum-explore__filter-field">
          <label htmlFor="curriculum-explore-approach-filter">{t('curriculum.explore.approachFilter')}</label>
          <select
            id="curriculum-explore-approach-filter"
            data-testid="curriculum-explore-approach-filter"
            value={selectedApproach}
            onChange={(event) => setSelectedApproach(event.target.value)}
          >
            <option value={ALL_FILTER}>{t('curriculum.explore.allApproaches')}</option>
            {approachOptions.map((approach) => (
              <option key={approach} value={approach}>{approach}</option>
            ))}
          </select>
        </div>
        <div className="curriculum-explore__filter-field">
          <label htmlFor="curriculum-explore-age-filter">{t('curriculum.explore.ageFilter')}</label>
          <select
            id="curriculum-explore-age-filter"
            data-testid="curriculum-explore-age-filter"
            value={selectedAge}
            onChange={(event) => setSelectedAge(event.target.value)}
          >
            <option value={ALL_FILTER}>{t('curriculum.explore.allAges')}</option>
            {AGE_OPTIONS.map((age) => <option key={age} value={age}>{age}</option>)}
          </select>
        </div>
      </div>

      {selectionError && (
        <Alert variant="error" data-testid="curriculum-explore-selection-error">
          {t('curriculum.explore.selectionRequired')}
        </Alert>
      )}
      {adoptionError && (
        <Alert variant="error" data-testid="curriculum-explore-adoption-error">
          {t('curriculum.explore.adoptionError')}
        </Alert>
      )}
      {adoptionSuccess && (
        <Alert variant="success" data-testid="curriculum-explore-adoption-success">
          {t('curriculum.explore.adoptionSuccess', {
            subjects: adoptionSuccess.summary.subjectsCount,
            objectives: adoptionSuccess.summary.objectivesCount,
            reused: adoptionSuccess.summary.reusedObjectivesCount,
          })}
        </Alert>
      )}

      {loadingCatalog ? (
        <div className="curriculum-explore__state" data-testid="curriculum-explore-loading">
          {t('curriculum.explore.loading')}
        </div>
      ) : catalogError ? (
        <Alert variant="error" data-testid="curriculum-explore-catalog-error">
          {t('curriculum.explore.catalogError')}
        </Alert>
      ) : filteredCatalog.length === 0 ? (
        <EmptyState
          data-testid="curriculum-explore-empty"
          icon={<AletheiaIcon name="search" size={32} />}
          title={t('curriculum.explore.emptyTitle')}
          description={t('curriculum.explore.emptyDescription')}
        />
      ) : (
        <div className="curriculum-explore__grid" data-testid="curriculum-explore-grid">
          {filteredCatalog.map((entry) => {
            const approach = entry.approach ?? entry.code;
            const isAdopting = adoptingCode === entry.code;
            return (
              <Card
                key={entry.code}
                variant="bordered"
                className="curriculum-explore__card"
                data-testid={`curriculum-trail-card-${entry.code}`}
              >
                <CardHeader>
                  <div className="curriculum-explore__card-heading">
                    <CardTitle>{entry.name}</CardTitle>
                    <Badge variant="indigo" size="sm">{approach}</Badge>
                  </div>
                  {entry.description && <p className="curriculum-explore__card-description">{entry.description}</p>}
                </CardHeader>
                <CardContent>
                  <div className="curriculum-explore__metadata">
                    {entry.recommendedAgeRange && (
                      <span>
                        <AletheiaIcon name="users" size={14} />
                        {t('curriculum.explore.ageRange', {
                          min: entry.recommendedAgeRange.min,
                          max: entry.recommendedAgeRange.max,
                        })}
                      </span>
                    )}
                    {entry.educationalStages && entry.educationalStages.length > 0 && (
                      <span>
                        <AletheiaIcon name="layers" size={14} />
                        {entry.educationalStages.join(', ')}
                      </span>
                    )}
                  </div>
                  {entry.subjects && entry.subjects.length > 0 && (
                    <p className="curriculum-explore__subject-count">
                      {t('curriculum.explore.subjectCount', { count: entry.subjects.length })}
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Can action="manage_curriculum">
                    <Button
                      size="sm"
                      data-testid={`adopt-trail-${entry.code}`}
                      isLoading={isAdopting}
                      disabled={adoptingCode !== null && !isAdopting}
                      onClick={() => void handleAdopt(entry.code)}
                      leftIcon={<AletheiaIcon name="sparkles" size={16} />}
                    >
                      {t('curriculum.explore.adopt')}
                    </Button>
                  </Can>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
