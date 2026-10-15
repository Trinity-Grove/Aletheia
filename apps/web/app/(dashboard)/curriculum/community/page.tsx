'use client';

import React, { useEffect, useState } from 'react';
import type { LearnerSummaryDto } from '@aletheia/contracts';
import { ProductShell } from '../../../../src/components/layout/product-shell';
import { CommunityLearningResourcesGallery } from '../../../../src/components/curriculum/community-learning-resources-gallery';
import { useAuth } from '../../../../src/lib/auth/auth-context';
import { useLocale } from '../../../../src/lib/i18n/locale-context';

export default function CommunityLearningResourcesPage() {
  const { t } = useLocale();
  const { activeFamilyId, status } = useAuth();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [learners, setLearners] = useState<LearnerSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    const controller = new AbortController();

    async function loadFamily() {
      const effectiveFamilyId = activeFamilyId ?? localStorage.getItem('aletheia.activeFamilyId') ?? localStorage.getItem('familyId');
      if (!effectiveFamilyId) {
        setFamilyId(null);
        setLearners([]);
        setLoading(false);
        return;
      }
      try {
        setFamilyId(effectiveFamilyId);
        const response = await fetch(`/api/v1/families/${effectiveFamilyId}/learners`, { credentials: 'include', signal: controller.signal });
        if (!response.ok) throw new Error('learners');
        const data = await response.json();
        if (!controller.signal.aborted) setLearners(Array.isArray(data) ? data : []);
      } catch {
        if (!controller.signal.aborted) setLearners([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    setLoading(true);
    void loadFamily();
    return () => controller.abort();
  }, [activeFamilyId, status]);

  return (
    <ProductShell learners={learners}>
      <main className="page-container">
        {loading ? <div className="community-resources-gallery__state">{t('curriculum.communityResources.loading')}</div>
          : familyId ? <CommunityLearningResourcesGallery key={familyId} familyId={familyId} />
            : <div className="community-resources-gallery__state">{t('curriculum.communityResources.noFamily')}</div>}
      </main>
    </ProductShell>
  );
}
