'use client';

import React, { useEffect, useState } from 'react';
import type { LearnerSummaryDto } from '@aletheia/contracts';
import { ProductShell } from '../../../../src/components/layout/product-shell';
import { PrivacyConsentSettings } from '../../../../src/components/settings/privacy-consent-settings';
import { useLocale } from '../../../../src/lib/i18n/locale-context';

export default function PrivacySettingsPage() {
  const { t } = useLocale();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [learners, setLearners] = useState<LearnerSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const storedFamilyId = localStorage.getItem('familyId');
        if (!storedFamilyId) {
          setLoading(false);
          return;
        }
        setFamilyId(storedFamilyId);

        const res = await fetch(`/api/v1/families/${storedFamilyId}/learners`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setLearners(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <ProductShell>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {t('settings.privacy.title')}
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: '0.375rem 0 0 0' }}>
            {t('settings.privacy.description')}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            {t('settings.privacy.loading')}
          </div>
        ) : familyId ? (
          <PrivacyConsentSettings familyId={familyId} learners={learners} />
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            {t('settings.privacy.noFamily')}
          </div>
        )}
      </div>
    </ProductShell>
  );
}
