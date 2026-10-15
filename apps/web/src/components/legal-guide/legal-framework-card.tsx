'use client';

import React from 'react';
import type { FamilyJurisdictionResponseDto } from '@aletheia/contracts';
import {
  AletheiaIcon,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@aletheia/ui';
import { useLocale } from '../../lib/i18n/locale-context';

export interface LegalFrameworkCardProps {
  jurisdiction?: FamilyJurisdictionResponseDto | null | undefined;
  isLoading?: boolean | undefined;
}

export function LegalFrameworkCard({
  jurisdiction,
  isLoading = false,
}: LegalFrameworkCardProps) {
  const { t } = useLocale();

  if (isLoading) {
    return (
      <Card className="legal-framework-card" data-testid="legal-framework-loading">
        <CardContent className="legal-framework-loading-content">
          <AletheiaIcon name="book-open" size={24} />
          <p>{t('legalGuide.framework.title')}</p>
        </CardContent>
      </Card>
    );
  }

  const minDays = jurisdiction?.minInstructionalDays ?? 200;
  const minHours = jurisdiction?.minInstructionalHours ?? 800;

  return (
    <Card className="legal-framework-card" data-testid="legal-framework-card">
      <CardHeader className="legal-framework-header">
        <div className="legal-framework-title-row">
          <span className="legal-framework-icon-wrap" aria-hidden="true">
            <AletheiaIcon name="book-open" size={22} />
          </span>
          <CardTitle as="h2" className="legal-framework-title">
            {t('legalGuide.framework.title')}
          </CardTitle>
        </div>
        <CardDescription className="legal-framework-description">
          {t('legalGuide.framework.description')}
        </CardDescription>
      </CardHeader>

      <CardContent className="legal-framework-content">
        <div className="legal-framework-grid">
          <div className="legal-framework-item">
            <span className="legal-framework-item-label">
              {t('legalGuide.framework.minDaysLabel')}
            </span>
            <span className="legal-framework-item-value">
              {t('legalGuide.framework.minDaysValue', { count: minDays })}
            </span>
          </div>

          <div className="legal-framework-item">
            <span className="legal-framework-item-label">
              {t('legalGuide.framework.minHoursLabel')}
            </span>
            <span className="legal-framework-item-value">
              {t('legalGuide.framework.minHoursValue', { count: minHours })}
            </span>
          </div>
        </div>

        {jurisdiction?.officialSource && (
          <div className="legal-framework-source-block">
            <span className="legal-framework-source-label">
              {t('legalGuide.framework.officialSourceLabel')}
            </span>
            <p className="legal-framework-source-text">
              {jurisdiction.officialSource}
            </p>
          </div>
        )}

        {jurisdiction?.legalBasisSummary && (
          <div className="legal-framework-basis-block">
            <p className="legal-framework-basis-text">
              {jurisdiction.legalBasisSummary}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="legal-framework-notice-footer">
        <p className="legal-framework-notice-text">
          {t('legalGuide.framework.legalNotice')}
        </p>
      </CardFooter>
    </Card>
  );
}
