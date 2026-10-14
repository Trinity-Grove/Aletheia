'use client';

import React, { useEffect, useState } from 'react';
import type { FamilyJurisdictionResponseDto } from '@aletheia/contracts';
import { Badge } from '@aletheia/ui';
import { useLocale } from '../../lib/i18n/locale-context';
import { LegalFrameworkCard } from './legal-framework-card';
import { EvidenceProtectionGuide } from './evidence-protection-guide';
import { First30DaysChecklistCard } from './first-30-days-checklist-card';
import { LegalFaqAccordion } from './legal-faq-accordion';

export interface LegalGuideViewProps {
  familyId: string;
  learnersCount?: number | undefined;
}

export function LegalGuideView({
  familyId,
  learnersCount,
}: LegalGuideViewProps) {
  const { t } = useLocale();
  const [jurisdiction, setJurisdiction] = useState<FamilyJurisdictionResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/v1/families/${familyId}/jurisdiction`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load jurisdiction: ${res.status}`);
        }
        return res.json() as Promise<FamilyJurisdictionResponseDto>;
      })
      .then((data) => {
        if (isMounted) {
          setJurisdiction(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [familyId]);

  return (
    <div className="legal-guide-container" data-testid="legal-guide-view">
      <header className="legal-guide-header">
        <div className="legal-guide-header-top">
          <h1 className="legal-guide-title">{t('legalGuide.header.title')}</h1>
          {jurisdiction && (
            <Badge variant="emerald" size="md" className="legal-guide-badge">
              {t('legalGuide.header.jurisdictionBadge', { name: jurisdiction.name })}
            </Badge>
          )}
        </div>
        <p className="legal-guide-subtitle">{t('legalGuide.header.subtitle')}</p>
      </header>

      <div className="legal-guide-content">
        <First30DaysChecklistCard
          familyId={familyId}
          learnersCount={learnersCount}
        />
        <LegalFrameworkCard
          jurisdiction={jurisdiction}
          isLoading={isLoading}
        />
        <EvidenceProtectionGuide />
        <LegalFaqAccordion />
      </div>
    </div>
  );
}
