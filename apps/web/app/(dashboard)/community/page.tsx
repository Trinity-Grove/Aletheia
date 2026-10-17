'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { LearnerSummaryDto } from '@aletheia/contracts';
import { ProductShell } from '../../../src/components/layout/product-shell';
import { CommunityHubView } from '../../../src/components/community';
import { useOptionalAuth } from '../../../src/lib/auth/auth-context';
import { useLocale } from '../../../src/lib/i18n/locale-context';

export default function CommunityPage() {
  useLocale();
  const auth = useOptionalAuth();
  const [familyId, setFamilyId] = useState<string | null>(
    () =>
      auth?.activeFamilyId ??
      (typeof window !== 'undefined'
        ? localStorage.getItem('aletheia.activeFamilyId') ?? localStorage.getItem('familyId')
        : null),
  );
  const [learners, setLearners] = useState<LearnerSummaryDto[]>([]);
  const [activeLearnerId, setActiveLearnerId] = useState<string | null>(null);

  useEffect(() => {
    async function loadBaseData() {
      try {
        const storedFamilyId =
          auth?.activeFamilyId ??
          (typeof window !== 'undefined'
            ? localStorage.getItem('aletheia.activeFamilyId') ?? localStorage.getItem('familyId')
            : null);

        if (!storedFamilyId) return;
        setFamilyId(storedFamilyId);

        const learnersRes = await fetch(`/api/v1/families/${encodeURIComponent(storedFamilyId)}/learners`, {
          credentials: 'include',
        });
        if (learnersRes.ok) {
          const lData = await learnersRes.json();
          setLearners(Array.isArray(lData) ? lData : []);
        }
      } catch {
        // Fallback gracefully
      }
    }
    void loadBaseData();
  }, [auth?.activeFamilyId]);

  const hubLearners = useMemo(
    () =>
      learners.map((l) => ({
        id: l.id,
        name: l.preferredName || l.firstName,
      })),
    [learners],
  );

  return (
    <ProductShell
      familyId={familyId}
      learners={learners}
      activeLearnerId={activeLearnerId}
      onSelectLearner={setActiveLearnerId}
      currentPath="/community"
    >
      <CommunityHubView
        familyId={familyId ?? ''}
        learners={hubLearners}
      />
    </ProductShell>
  );
}
