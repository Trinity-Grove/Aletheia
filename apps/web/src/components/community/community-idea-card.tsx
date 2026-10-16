'use client';

import React from 'react';
import type { CommunityActivityResponseDto, CommunityIdeaTheme } from '@aletheia/contracts';
import { AletheiaIcon, Badge, Button, Card } from '@aletheia/ui';
import { useLocale } from '../../lib/i18n/locale-context';

export interface CommunityIdeaCardProps {
  idea: CommunityActivityResponseDto;
  onAdopt?(idea: CommunityActivityResponseDto): void;
  disabled?: boolean | undefined;
  isAdopting?: boolean | undefined;
}

interface ThemeConfig {
  labelKey: string;
  iconName: string;
  badgeVariant: 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate';
}

const THEME_CONFIGS: Record<CommunityIdeaTheme, ThemeConfig> = {
  NATURE_STUDY: {
    labelKey: 'community.themes.natureStudy',
    iconName: 'sprout',
    badgeVariant: 'emerald',
  },
  LIVING_BOOKS: {
    labelKey: 'community.themes.livingBooks',
    iconName: 'book-open',
    badgeVariant: 'indigo',
  },
  HANDICRAFT: {
    labelKey: 'community.themes.handicraft',
    iconName: 'palette',
    badgeVariant: 'amber',
  },
  SEASONAL_HISTORY: {
    labelKey: 'community.themes.seasonalHistory',
    iconName: 'calendar',
    badgeVariant: 'rose',
  },
  FAMILY_PROJECTS: {
    labelKey: 'community.themes.familyProjects',
    iconName: 'home',
    badgeVariant: 'slate',
  },
};

export function CommunityIdeaCard({
  idea,
  onAdopt,
  disabled = false,
  isAdopting = false,
}: CommunityIdeaCardProps) {
  const { t } = useLocale();

  const themeKey = idea.metadata?.theme as CommunityIdeaTheme | undefined;
  const themeConfig = themeKey && THEME_CONFIGS[themeKey] ? THEME_CONFIGS[themeKey] : null;
  const isSeed = Boolean(idea.metadata?.isSeed);
  const materials = Array.isArray(idea.metadata?.materials)
    ? (idea.metadata.materials as string[])
    : undefined;

  return (
    <Card
      data-testid={`community-idea-card-${idea.id}`}
      className="community-idea-card"
    >
      <div className="community-idea-card__header">
        <div className="community-idea-card__badges">
          {themeConfig && (
            <Badge
              data-testid="community-idea-theme-badge"
              variant={themeConfig.badgeVariant}
              size="sm"
              className="community-idea-card__theme-badge"
            >
              <AletheiaIcon name={themeConfig.iconName} size={14} />
              <span>{t(themeConfig.labelKey)}</span>
            </Badge>
          )}

          {isSeed ? (
            <Badge variant="amber" size="sm" dot>
              {t('community.card.seedBadge')}
            </Badge>
          ) : (
            <Badge variant="slate" size="sm">
              {t('community.card.communityBadge')}
            </Badge>
          )}
        </div>

        <h3 className="community-idea-card__title">{idea.name}</h3>

        {idea.description && (
          <p className="community-idea-card__description">{idea.description}</p>
        )}
      </div>

      <div className="community-idea-card__meta">
        {idea.estimatedDurationMinutes != null && (
          <span className="community-idea-card__meta-item">
            <AletheiaIcon name="clock" size={14} />
            <span>
              {t('community.card.estimatedTime', {
                minutes: idea.estimatedDurationMinutes,
              })}
            </span>
          </span>
        )}

        {idea.ageMin != null && idea.ageMax != null && (
          <span className="community-idea-card__meta-item">
            <AletheiaIcon name="users" size={14} />
            <span>
              {t('community.card.ageRange', {
                min: idea.ageMin,
                max: idea.ageMax,
              })}
            </span>
          </span>
        )}

        <span className="community-idea-card__meta-item">
          <AletheiaIcon
            name={idea.supervisionRequired ? 'shield' : 'check'}
            size={14}
          />
          <span>
            {idea.supervisionRequired
              ? t('community.card.supervisionRequired')
              : t('community.card.independent')}
          </span>
        </span>
      </div>

      {materials && materials.length > 0 && (
        <div className="community-idea-card__materials">
          <span className="community-idea-card__materials-label">
            {t('community.card.materialsTitle')}
          </span>
          <ul className="community-idea-card__materials-list">
            {materials.map((material, index) => (
              <li key={index} className="community-idea-card__material-pill">
                {material}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="community-idea-card__footer">
        <Button
          variant="primary"
          className="community-idea-card__adopt-btn"
          disabled={disabled || isAdopting}
          isLoading={isAdopting}
          leftIcon={<AletheiaIcon name="plus" size={16} />}
          onClick={() => {
            onAdopt?.(idea);
          }}
        >
          {isAdopting ? t('community.card.adopting') : t('community.card.adoptBtn')}
        </Button>
      </div>
    </Card>
  );
}
