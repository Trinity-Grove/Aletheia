'use client';

import React, { useMemo } from 'react';
import type { CommunityActivityResponseDto, CommunityIdeaTheme } from '@aletheia/contracts';
import { AletheiaIcon, Button } from '@aletheia/ui';
import { useLocale } from '../../lib/i18n/locale-context';
import { CommunityIdeaCard } from './community-idea-card';

export interface InspirationMuralProps {
  ideas: CommunityActivityResponseDto[];
  selectedTheme: CommunityIdeaTheme | 'ALL';
  onThemeSelect(theme: CommunityIdeaTheme | 'ALL'): void;
  onAdopt(idea: CommunityActivityResponseDto): void;
  onClearFilters?(): void;
  disabled?: boolean | undefined;
  adoptingIdeaId?: string | null | undefined;
}

interface ThemeTabConfig {
  key: CommunityIdeaTheme | 'ALL';
  labelKey: string;
}

const THEME_TABS: ThemeTabConfig[] = [
  { key: 'ALL', labelKey: 'community.hub.allThemes' },
  { key: 'NATURE_STUDY', labelKey: 'community.themes.natureStudy' },
  { key: 'LIVING_BOOKS', labelKey: 'community.themes.livingBooks' },
  { key: 'HANDICRAFT', labelKey: 'community.themes.handicraft' },
  { key: 'SEASONAL_HISTORY', labelKey: 'community.themes.seasonalHistory' },
  { key: 'FAMILY_PROJECTS', labelKey: 'community.themes.familyProjects' },
];

export function InspirationMural({
  ideas,
  selectedTheme,
  onThemeSelect,
  onAdopt,
  onClearFilters,
  disabled = false,
  adoptingIdeaId = null,
}: InspirationMuralProps) {
  const { t } = useLocale();

  const counts = useMemo(() => {
    const result: Record<CommunityIdeaTheme | 'ALL', number> = {
      ALL: ideas.length,
      NATURE_STUDY: 0,
      LIVING_BOOKS: 0,
      HANDICRAFT: 0,
      SEASONAL_HISTORY: 0,
      FAMILY_PROJECTS: 0,
    };

    for (const idea of ideas) {
      const theme = idea.metadata?.theme as CommunityIdeaTheme | undefined;
      if (theme && theme in result) {
        result[theme]++;
      }
    }

    return result;
  }, [ideas]);

  const displayedIdeas = useMemo(() => {
    if (selectedTheme === 'ALL') return ideas;
    return ideas.filter((idea) => idea.metadata?.theme === selectedTheme);
  }, [ideas, selectedTheme]);

  return (
    <div className="community-mural" data-testid="community-inspiration-mural">
      <div
        role="tablist"
        className="community-mural__tabs"
        aria-label={t('community.hub.title')}
      >
        {THEME_TABS.map((tab) => {
          const isActive = selectedTheme === tab.key;
          const count = counts[tab.key];

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`community-mural__tab ${
                isActive ? 'community-mural__tab--active' : ''
              }`}
              onClick={() => onThemeSelect(tab.key)}
              disabled={disabled}
            >
              <span className="community-mural__tab-label">{t(tab.labelKey)}</span>
              <span className="community-mural__tab-count">({count})</span>
            </button>
          );
        })}
      </div>

      {displayedIdeas.length === 0 ? (
        <div className="community-mural__empty" data-testid="community-mural-empty">
          <div className="community-mural__empty-icon">
            <AletheiaIcon name="search" size={40} />
          </div>
          <h3 className="community-mural__empty-title">{t('community.hub.emptyTitle')}</h3>
          <p className="community-mural__empty-description">
            {t('community.hub.emptyDescription')}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              if (onClearFilters) {
                onClearFilters();
              } else {
                onThemeSelect('ALL');
              }
            }}
          >
            {t('community.hub.clearFilters')}
          </Button>
        </div>
      ) : (
        <div className="community-mural__grid" data-testid="community-mural-grid">
          {displayedIdeas.map((idea) => (
            <CommunityIdeaCard
              key={idea.id}
              idea={idea}
              onAdopt={onAdopt}
              disabled={disabled || adoptingIdeaId !== null}
              isAdopting={adoptingIdeaId === idea.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
