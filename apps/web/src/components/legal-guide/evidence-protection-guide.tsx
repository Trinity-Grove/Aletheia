'use client';

import React from 'react';
import Link from 'next/link';
import {
  AletheiaIcon,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@aletheia/ui';
import { useLocale } from '../../lib/i18n/locale-context';

export interface EvidenceProtectionGuideProps {
  className?: string | undefined;
}

export function EvidenceProtectionGuide({
  className = '',
}: EvidenceProtectionGuideProps) {
  const { t } = useLocale();

  return (
    <Card
      className={`legal-evidence-card ${className}`.trim()}
      data-testid="evidence-protection-guide"
    >
      <CardHeader className="legal-evidence-header">
        <div className="legal-evidence-title-row">
          <span className="legal-evidence-icon-wrap" aria-hidden="true">
            <AletheiaIcon name="shield-check" size={22} />
          </span>
          <CardTitle as="h2" className="legal-evidence-title">
            {t('legalGuide.evidence.title')}
          </CardTitle>
        </div>
        <CardDescription className="legal-evidence-description">
          {t('legalGuide.evidence.description')}
        </CardDescription>
      </CardHeader>

      <CardContent className="legal-evidence-content">
        <div className="legal-evidence-actions">
          <Link
            href="/reports"
            className="legal-evidence-cta ui-button ui-button--primary ui-button--md"
            data-testid="evidence-dossier-action-link"
          >
            <span className="ui-button__text">{t('legalGuide.evidence.dossierAction')}</span>
          </Link>
          <p className="legal-evidence-hint">
            {t('legalGuide.evidence.dossierHint')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
