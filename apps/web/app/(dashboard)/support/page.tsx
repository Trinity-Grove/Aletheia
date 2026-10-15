'use client';

import React, { useEffect, useState } from 'react';
import { AletheiaIcon, PageHeader } from '@aletheia/ui';
import type { LearnerSummaryDto } from '@aletheia/contracts';
import { useLocale } from '../../../src/lib/i18n/locale-context';
import { ProductShell } from '../../../src/components/layout/product-shell';
import { DonationFormCard } from '../../../src/components/support/donation-form-card';
import { DonationReceiptsTable } from '../../../src/components/support/donation-receipts-table';

export default function SupportPage() {
  const { t } = useLocale();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [learners, setLearners] = useState<LearnerSummaryDto[]>([]);
  const [activeLearnerId, setActiveLearnerId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    async function loadBaseData() {
      try {
        const storedFamilyId = localStorage.getItem('familyId');
        if (!storedFamilyId) return;
        setFamilyId(storedFamilyId);

        const learnersRes = await fetch(`/api/v1/families/${storedFamilyId}/learners`, {
          credentials: 'include',
        });
        if (learnersRes.ok) {
          const lData = await learnersRes.json();
          setLearners(lData);
        }
      } catch {
        // Fallback gracefully
      }
    }
    void loadBaseData();
  }, []);

  const handleDonationSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <ProductShell
      familyId={familyId}
      learners={learners}
      activeLearnerId={activeLearnerId}
      onSelectLearner={setActiveLearnerId}
      currentPath="/support"
    >
      <div className="page-container">
        {/* Header Philosophy Banner */}
        <div
          style={{
            marginBottom: '2.5rem',
            padding: '2rem',
            borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(244, 241, 234, 0.6) 100%)',
            border: '1px solid rgba(46, 125, 50, 0.2)',
          }}
        >
          <PageHeader
            title={t('support.pageTitle')}
            titleAdornment={
              <span style={{ color: 'var(--forest)', display: 'inline-flex', alignItems: 'center' }}>
                <AletheiaIcon name="heart" size={28} />
              </span>
            }
            description={t('support.pageSubtitle')}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--forest)', fontWeight: 600, marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <AletheiaIcon name="check" size={16} />
              <span>{t('support.featureNoPaywalls')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <AletheiaIcon name="check" size={16} />
              <span>{t('support.featureNoLimits')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <AletheiaIcon name="check" size={16} />
              <span>{t('support.featureFreeAndSovereign')}</span>
            </div>
          </div>
        </div>

        {/* Two-Column Responsive Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))',
            gap: '2rem',
            alignItems: 'start',
          }}
        >
          <div>
            <DonationFormCard
              familyId={familyId}
              onDonationSuccess={handleDonationSuccess}
            />
          </div>

          <div>
            <DonationReceiptsTable
              key={refreshKey}
              familyId={familyId}
            />
          </div>
        </div>
      </div>
    </ProductShell>
  );
}

