'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { CommunityActivityResponseDto, CommunityIdeaTheme } from '@aletheia/contracts';
import { Alert, AletheiaIcon, Button, Input, Select } from '@aletheia/ui';
import { useLocale } from '../../lib/i18n/locale-context';
import { SEED_IDEAS } from './seed-ideas-data';
import { InspirationMural } from './inspiration-mural';
import { ShareIdeaModal } from './share-idea-modal';

export interface CommunityHubViewProps {
  familyId: string;
  initialActivities?: CommunityActivityResponseDto[] | undefined;
}

function mergeIdeas(
  seeds: CommunityActivityResponseDto[],
  apiList: CommunityActivityResponseDto[],
  initialList?: CommunityActivityResponseDto[] | undefined
): CommunityActivityResponseDto[] {
  const seenIds = new Set<string>();
  const combined: CommunityActivityResponseDto[] = [];

  const userItems = [...apiList, ...(initialList ?? [])];
  for (const item of userItems) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      combined.push(item);
    }
  }

  for (const seed of seeds) {
    if (!seenIds.has(seed.id)) {
      seenIds.add(seed.id);
      combined.push(seed);
    }
  }

  return combined;
}

function matchesAge(idea: CommunityActivityResponseDto, ageFilter: string): boolean {
  if (ageFilter === 'ALL' || !ageFilter) return true;
  if (idea.ageMin == null || idea.ageMax == null) return true;

  if (ageFilter === '3-6') {
    return idea.ageMin <= 6 && idea.ageMax >= 3;
  }
  if (ageFilter === '7-10') {
    return idea.ageMin <= 10 && idea.ageMax >= 7;
  }
  if (ageFilter === '11-14') {
    return idea.ageMin <= 14 && idea.ageMax >= 11;
  }
  if (ageFilter === '15+') {
    return idea.ageMax >= 15;
  }
  return true;
}

function matchesSearch(idea: CommunityActivityResponseDto, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const nameMatch = idea.name.toLowerCase().includes(q);
  const descMatch = idea.description ? idea.description.toLowerCase().includes(q) : false;
  const materialsMatch = Array.isArray(idea.metadata?.materials)
    ? (idea.metadata.materials as string[]).some(
        (m) => typeof m === 'string' && m.toLowerCase().includes(q)
      )
    : false;
  const themeMatch =
    typeof idea.metadata?.theme === 'string' &&
    idea.metadata.theme.toLowerCase().includes(q);

  return nameMatch || descMatch || materialsMatch || themeMatch;
}

export function CommunityHubView({
  familyId,
  initialActivities,
}: CommunityHubViewProps) {
  const { t } = useLocale();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<CommunityIdeaTheme | 'ALL'>('ALL');
  const [selectedAge, setSelectedAge] = useState('ALL');
  const [apiActivities, setApiActivities] = useState<CommunityActivityResponseDto[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [adoptingIdeaId, setAdoptingIdeaId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchActivities() {
      try {
        const res = await fetch('/api/v1/curriculum/community-activities', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && Array.isArray(data)) {
          setApiActivities(data);
        }
      } catch {
        // Fallback to seed ideas
      }
    }

    void fetchActivities();
    return () => {
      isMounted = false;
    };
  }, []);

  const allCombinedIdeas = useMemo(() => {
    return mergeIdeas(SEED_IDEAS, apiActivities, initialActivities);
  }, [apiActivities, initialActivities]);

  const filteredIdeas = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    return allCombinedIdeas.filter((idea) => {
      return matchesAge(idea, selectedAge) && matchesSearch(idea, trimmedQuery);
    });
  }, [allCombinedIdeas, searchQuery, selectedAge]);

  const displayedIdeasCount = useMemo(() => {
    if (selectedTheme === 'ALL') return filteredIdeas.length;
    return filteredIdeas.filter((idea) => idea.metadata?.theme === selectedTheme).length;
  }, [filteredIdeas, selectedTheme]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedAge('ALL');
    setSelectedTheme('ALL');
  };

  const handleShareSubmit = async (data: {
    name: string;
    description: string;
    theme: CommunityIdeaTheme;
    materials: string[];
    ageMin: number;
    ageMax: number;
    estimatedDurationMinutes: number;
    supervisionRequired: boolean;
    anonymousSharingConsent: true;
  }) => {
    try {
      setActionError(null);
      setActionSuccess(null);
      if (!familyId) throw new Error('Missing family context');
      setIsSharing(true);
      const res = await fetch(`/api/v1/families/${familyId}/activities`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          visibility: 'PUBLIC',
          anonymousSharingConsent: data.anonymousSharingConsent,
          ageMin: data.ageMin,
          ageMax: data.ageMax,
          estimatedDurationMinutes: data.estimatedDurationMinutes,
          supervisionRequired: data.supervisionRequired,
          metadata: {
            theme: data.theme,
            materials: data.materials,
            isSeed: false,
          },
        }),
      });

      if (!res.ok) throw new Error('Share failed');
      const created = await res.json() as { id?: string; createdAt?: string; updatedAt?: string };
      if (!created?.id) throw new Error('Share response missing id');
      const now = new Date().toISOString();
      setApiActivities((prev) => [{
        id: created.id!,
        name: data.name,
        description: data.description,
        ageMin: data.ageMin,
        ageMax: data.ageMax,
        estimatedDurationMinutes: data.estimatedDurationMinutes,
        supervisionRequired: data.supervisionRequired,
        riskLevel: null,
        evidenceRequirementMode: 'ANY',
        metadata: { theme: data.theme, materials: data.materials, isSeed: false },
        createdAt: created.createdAt ?? now,
        updatedAt: created.updatedAt ?? now,
      }, ...prev]);
      setIsShareModalOpen(false);
      setActionSuccess(t('community.shareModal.successToast'));
    } catch {
      setActionError(t('community.shareModal.errorToast'));
    } finally {
      setIsSharing(false);
    }
  };

  const handleAdopt = async (idea: CommunityActivityResponseDto) => {
    if (!familyId) {
      setActionError(t('community.adoptModal.errorToast'));
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    setAdoptingIdeaId(idea.id);
    try {
      const isCuratedSeed = idea.metadata?.isSeed === true;
      const url = isCuratedSeed
        ? `/api/v1/families/${familyId}/activities`
        : `/api/v1/families/${familyId}/activities/adopt`;
      const body = isCuratedSeed
        ? {
            name: idea.name,
            description: idea.description ?? null,
            visibility: 'PRIVATE',
            ageMin: idea.ageMin,
            ageMax: idea.ageMax,
            estimatedDurationMinutes: idea.estimatedDurationMinutes,
            supervisionRequired: idea.supervisionRequired,
            riskLevel: idea.riskLevel,
            evidenceRequirementMode: idea.evidenceRequirementMode,
            metadata: {
              ...(typeof idea.metadata?.theme === 'string' ? { theme: idea.metadata.theme } : {}),
              ...(Array.isArray(idea.metadata?.materials) ? { materials: idea.metadata.materials } : {}),
              ...(Array.isArray(idea.metadata?.steps) ? { steps: idea.metadata.steps } : {}),
            },
          }
        : { sourceActivityId: idea.id };
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Adoption failed');
      setActionSuccess(t('community.adoptModal.successToast'));
    } catch {
      setActionError(t('community.adoptModal.errorToast'));
    } finally {
      setAdoptingIdeaId(null);
    }
  };

  const ageOptions = [
    { value: 'ALL', label: t('community.hub.allAges') },
    { value: '3-6', label: t('community.card.ageRange', { min: 3, max: 6 }) },
    { value: '7-10', label: t('community.card.ageRange', { min: 7, max: 10 }) },
    { value: '11-14', label: t('community.card.ageRange', { min: 11, max: 14 }) },
    { value: '15+', label: '15+' },
  ];

  return (
    <div className="community-hub" data-testid="community-hub-view">
      {actionSuccess && (
        <Alert variant="success" data-testid="community-action-success" aria-live="polite">
          {actionSuccess}{' '}
          <Link href="/curriculum/activities">{t('community.hub.manageActivities')}</Link>
        </Alert>
      )}
      {actionError && !isShareModalOpen && (
        <Alert variant="error" data-testid="community-action-error" aria-live="assertive">
          {actionError}
        </Alert>
      )}
      <header className="community-hub__header">
        <div className="community-hub__header-content">
          <h1 className="community-hub__title">{t('community.hub.title')}</h1>
          <p className="community-hub__subtitle">{t('community.hub.subtitle')}</p>
        </div>

        <div className="community-hub__header-actions">
          <Button
            variant="primary"
            className="community-hub__share-btn"
            leftIcon={<AletheiaIcon name="plus-circle" size={18} />}
            onClick={() => { setActionError(null); setActionSuccess(null); setIsShareModalOpen(true); }}
          >
            {t('community.hub.shareButton')}
          </Button>
        </div>
      </header>

      <section className="community-hub__toolbar" aria-label={t('community.hub.title')}>
        <div className="community-hub__search">
          <Input
            placeholder={t('community.hub.searchPlaceholder')}
            aria-label={t('community.hub.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<AletheiaIcon name="search" size={18} />}
            data-testid="community-hub-search-input"
          />
        </div>

        <div className="community-hub__age-filter">
          <Select
            label={t('community.hub.filterAge')}
            value={selectedAge}
            onChange={(e) => setSelectedAge(e.target.value)}
            options={ageOptions}
            data-testid="community-hub-age-select"
          />
        </div>

        <div className="community-hub__count" data-testid="community-hub-count">
          {t('community.hub.ideasCount', { count: displayedIdeasCount })}
        </div>
      </section>

      <main className="community-hub__main">
        <InspirationMural
          ideas={filteredIdeas}
          selectedTheme={selectedTheme}
          onThemeSelect={setSelectedTheme}
          onAdopt={(idea) => { void handleAdopt(idea); }}
          onClearFilters={handleClearFilters}
          adoptingIdeaId={adoptingIdeaId}
        />
      </main>

      <ShareIdeaModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSubmit={handleShareSubmit}
        isSubmitting={isSharing}
        errorMessage={isShareModalOpen ? actionError : null}
      />

    </div>
  );
}
