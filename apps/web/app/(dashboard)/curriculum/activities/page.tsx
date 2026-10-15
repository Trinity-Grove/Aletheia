'use client';

import React, { useEffect, useState } from 'react';
import type { LearnerSummaryDto } from '@aletheia/contracts';
import { ProductShell } from '../../../../src/components/layout/product-shell';
import { FamilyActivitiesGallery } from '../../../../src/components/curriculum/family-activities-gallery';
import { useAuth } from '../../../../src/lib/auth/auth-context';
import { useLocale } from '../../../../src/lib/i18n/locale-context';

export default function FamilyActivitiesPage() {
  const { t } = useLocale();
  const { activeFamilyId, status } = useAuth();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [learners, setLearners] = useState<LearnerSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    const controller = new AbortController();

    async function loadData() {
      try {
        const effectiveFamilyId =
          activeFamilyId ??
          (typeof window !== 'undefined'
            ? localStorage.getItem('aletheia.activeFamilyId') ?? localStorage.getItem('familyId')
            : null);

        if (!effectiveFamilyId) {
          setFamilyId(null);
          setLearners([]);
          setLoading(false);
          return;
        }

        setFamilyId(effectiveFamilyId);
        setLearners([]);

        const res = await fetch(`/api/v1/families/${effectiveFamilyId}/learners`, {
          credentials: 'include',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('learners-load-failed');
        const data = await res.json();
        if (!controller.signal.aborted) setLearners(Array.isArray(data) ? data : []);
      } catch {
        if (!controller.signal.aborted) setLearners([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    setLoading(true);
    void loadData();
    return () => controller.abort();
  }, [activeFamilyId, status]);

  return (
    <ProductShell learners={learners}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            {t('curriculum.pages.activities.loading')}
          </div>
        ) : familyId ? (
          <FamilyActivitiesGallery key={familyId} familyId={familyId} />
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            {t('curriculum.pages.activities.noFamily')}
          </div>
        )}
      </div>
    </ProductShell>
  );
}
