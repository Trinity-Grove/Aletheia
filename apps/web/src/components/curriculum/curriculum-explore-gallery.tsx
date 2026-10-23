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
  LearningPathExplorerCatalogEntryDto,
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
  const [activeTab, setActiveTab] = useState<'models' | 'trivium'>('models');
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

      <div className="curriculum-explore__tabs" role="tablist" aria-label={t('curriculum.explore.tabsLabel')}>
        <button
          id="curriculum-explore-models-tab"
          className="curriculum-explore__tab"
          type="button"
          role="tab"
          aria-selected={activeTab === 'models'}
          aria-controls="curriculum-explore-models-panel"
          data-testid="curriculum-explore-models-tab"
          onClick={() => setActiveTab('models')}
        >
          {t('curriculum.explore.modelsTab')}
        </button>
        <button
          id="curriculum-explore-trivium-tab"
          className="curriculum-explore__tab"
          type="button"
          role="tab"
          aria-selected={activeTab === 'trivium'}
          aria-controls="curriculum-explore-trivium-panel"
          data-testid="curriculum-explore-trivium-tab"
          onClick={() => setActiveTab('trivium')}
        >
          {t('curriculum.explore.triviumTab')}
        </button>
      </div>

      {activeTab === 'models' ? (
      <div id="curriculum-explore-models-panel" role="tabpanel" aria-labelledby="curriculum-explore-models-tab">

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
                        {entry.educationalStages
                          .map((stage) => t(`curriculum.explore.stages.${stage}`))
                          .join(', ')}
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
      ) : (
        <div id="curriculum-explore-trivium-panel" role="tabpanel" aria-labelledby="curriculum-explore-trivium-tab">
          <TriviumPathGallery
            familyId={familyId}
            learnerId={selectedLearnerId}
            academicYearId={selectedAcademicYearId}
            hasLearners={learners.length > 0}
            hasAcademicYears={academicYears.length > 0}
          />
        </div>
      )}
    </div>
  );
}

interface TriviumPathGalleryProps {
  familyId: string;
  learnerId: string;
  academicYearId: string;
  hasLearners: boolean;
  hasAcademicYears: boolean;
}

const TRIVIUM_PATH_COPY: Record<string, string> = {
  'TRIVIUM.GRAMMAR': 'grammar',
  'TRIVIUM.LOGIC': 'logic',
  'TRIVIUM.RHETORIC': 'rhetoric',
};

const TRIVIUM_COMPETENCY_COPY: Record<string, string> = {
  'TRIVIUM.GRAMMAR.LANGUAGE_PATTERNS': 'grammar.competencies.languagePatterns',
  'TRIVIUM.GRAMMAR.CLOSE_READING': 'grammar.competencies.closeReading',
  'TRIVIUM.GRAMMAR.VOCABULARY_MEMORY': 'grammar.competencies.vocabularyMemory',
  'TRIVIUM.LOGIC.QUESTIONING': 'logic.competencies.questioning',
  'TRIVIUM.LOGIC.CLAIMS_AND_REASONS': 'logic.competencies.claimsAndReasons',
  'TRIVIUM.LOGIC.REASONING': 'logic.competencies.reasoning',
  'TRIVIUM.RHETORIC.AUDIENCE_AND_PURPOSE': 'rhetoric.competencies.audienceAndPurpose',
  'TRIVIUM.RHETORIC.COMPOSITION': 'rhetoric.competencies.composition',
  'TRIVIUM.RHETORIC.REVISION_AND_DELIVERY': 'rhetoric.competencies.revisionAndDelivery',
};

function ageRecommendation(path: LearningPathExplorerCatalogEntryDto): { min: number; max: number } | null {
  const recommendation = path.metadata.ageRecommendation;
  if (typeof recommendation !== 'object' || recommendation === null || Array.isArray(recommendation)) return null;
  const { min, max } = recommendation as { min?: unknown; max?: unknown };
  return typeof min === 'number' && typeof max === 'number' ? { min, max } : null;
}

function educationalStages(path: LearningPathExplorerCatalogEntryDto): string[] {
  const stages = path.metadata.educationalStages;
  return Array.isArray(stages) && stages.every((stage) => typeof stage === 'string') ? stages : [];
}

function TriviumPathGallery({ familyId, learnerId, academicYearId, hasLearners, hasAcademicYears }: TriviumPathGalleryProps) {
  const { t } = useLocale();
  const [paths, setPaths] = useState<LearningPathExplorerCatalogEntryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [mutationError, setMutationError] = useState(false);
  const [mutationSuccess, setMutationSuccess] = useState(false);
  const [savingPathId, setSavingPathId] = useState<string | null>(null);
  const hasContext = hasLearners && hasAcademicYears && learnerId !== '' && academicYearId !== '';

  useEffect(() => {
    if (!hasContext) {
      setPaths([]);
      setLoading(false);
      setLoadError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    fetch(
      `/api/v1/families/${familyId}/curriculum/paths/catalog?learnerId=${encodeURIComponent(learnerId)}&academicYearId=${encodeURIComponent(academicYearId)}`,
      { credentials: 'include' },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error('catalog');
        return response.json() as Promise<LearningPathExplorerCatalogEntryDto[]>;
      })
      .then((entries) => {
        if (!cancelled) setPaths(Array.isArray(entries) ? entries : []);
      })
      .catch(() => {
        if (!cancelled) {
          setPaths([]);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [familyId, hasContext, learnerId, academicYearId]);

  const handleSelection = async (path: LearningPathExplorerCatalogEntryDto) => {
    const enabled = !path.selected;
    setMutationError(false);
    setMutationSuccess(false);
    setSavingPathId(path.id);
    try {
      const response = await fetch(
        `/api/v1/families/${familyId}/curriculum/paths/${path.id}/learners/${learnerId}/academic-years/${academicYearId}/selection`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ enabled }),
        },
      );
      if (!response.ok) throw new Error('selection');
      const result = (await response.json()) as { enabled?: boolean };
      const selected = typeof result.enabled === 'boolean' ? result.enabled : enabled;
      setPaths((current) => current.map((entry) => entry.id === path.id ? { ...entry, selected } : entry));
      setMutationSuccess(true);
    } catch {
      setMutationError(true);
    } finally {
      setSavingPathId(null);
    }
  };

  if (!hasContext) {
    return (
      <Alert variant="info" data-testid="curriculum-explore-context-required">
        <strong>{t('curriculum.explore.trivium.contextRequiredTitle')}</strong>{' '}
        {hasLearners ? t('curriculum.explore.trivium.contextRequiredYear') : t('curriculum.explore.trivium.contextRequiredLearner')}{' '}
        <a href={hasLearners ? '/curriculum' : '/learners'}>
          {hasLearners ? t('curriculum.explore.trivium.setupYear') : t('curriculum.explore.trivium.setupLearner')}
        </a>
      </Alert>
    );
  }

  return (
    <section className="curriculum-explore__trivium" data-testid="curriculum-trivium-gallery">
      <div className="curriculum-explore__trivium-intro">
        <h2>{t('curriculum.explore.trivium.title')}</h2>
        <p>{t('curriculum.explore.trivium.description')}</p>
      </div>

      {mutationError && <Alert variant="error" data-testid="curriculum-trivium-mutation-error">{t('curriculum.explore.trivium.mutationError')}</Alert>}
      {mutationSuccess && <Alert variant="success" data-testid="curriculum-trivium-mutation-success">{t('curriculum.explore.trivium.mutationSuccess')}</Alert>}

      {loading ? (
        <div className="curriculum-explore__state" data-testid="curriculum-trivium-loading">{t('curriculum.explore.trivium.loading')}</div>
      ) : loadError ? (
        <Alert variant="error" data-testid="curriculum-trivium-catalog-error">{t('curriculum.explore.trivium.catalogError')}</Alert>
      ) : paths.length === 0 ? (
        <EmptyState
          data-testid="curriculum-trivium-empty"
          icon={<AletheiaIcon name="search" size={32} />}
          title={t('curriculum.explore.trivium.emptyTitle')}
          description={t('curriculum.explore.trivium.emptyDescription')}
        />
      ) : (
        <div className="curriculum-explore__grid" data-testid="curriculum-trivium-grid">
          {paths.map((path) => {
            const pathKey = TRIVIUM_PATH_COPY[path.code];
            if (!pathKey) return null;
            const age = ageRecommendation(path);
            const isSaving = savingPathId === path.id;
            return (
              <Card
                key={path.id}
                variant="bordered"
                className={`curriculum-explore__card curriculum-explore__trivium-card${path.selected ? ' is-selected' : ''}`}
                data-testid={`curriculum-path-card-${path.code}`}
                data-selected={path.selected}
              >
                <CardHeader>
                  <div className="curriculum-explore__card-heading">
                    <CardTitle>{t(`curriculum.explore.trivium.paths.${pathKey}.name`)}</CardTitle>
                    {path.selected && <Badge variant="emerald" size="sm">{t('curriculum.explore.trivium.selected')}</Badge>}
                  </div>
                  <p className="curriculum-explore__card-description">{t(`curriculum.explore.trivium.paths.${pathKey}.description`)}</p>
                </CardHeader>
                <CardContent>
                  <div className="curriculum-explore__metadata">
                    {age && <span><AletheiaIcon name="users" size={14} />{t('curriculum.explore.ageRange', age)}</span>}
                    {educationalStages(path).length > 0 && (
                      <span><AletheiaIcon name="layers" size={14} />{educationalStages(path).map((stage) => t(`curriculum.explore.stages.${stage}`)).join(', ')}</span>
                    )}
                  </div>
                  <p className="curriculum-explore__advisory">{t('curriculum.explore.trivium.ageAdvisory')}</p>
                  <h3 className="curriculum-explore__competencies-title">{t('curriculum.explore.trivium.competenciesTitle')}</h3>
                  <ul className="curriculum-explore__competencies">
                    {path.competencies.map((competency) => {
                      const competencyKey = TRIVIUM_COMPETENCY_COPY[competency.code];
                      if (!competencyKey) return null;
                      return (
                        <li key={competency.code}>
                          <strong>{t(`curriculum.explore.trivium.paths.${competencyKey}.title`)}</strong>
                          <p>{t(`curriculum.explore.trivium.paths.${competencyKey}.objective`)}</p>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Can action="manage_curriculum">
                    <Button
                      size="sm"
                      data-testid={`adopt-learning-path-${path.code}`}
                      isLoading={isSaving}
                      disabled={savingPathId !== null && !isSaving}
                      onClick={() => void handleSelection(path)}
                      leftIcon={<AletheiaIcon name={path.selected ? 'check' : 'plus'} size={16} />}
                    >
                      {path.selected ? t('curriculum.explore.trivium.remove') : t('curriculum.explore.trivium.adopt')}
                    </Button>
                  </Can>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
