'use client';

import React, { useEffect, useState } from 'react';
import type { LearnerSummaryDto } from '@aletheia/contracts';
import { ProductShell } from '../../../../src/components/layout/product-shell';
import { FamilyActivitiesGallery } from '../../../../src/components/curriculum/family-activities-gallery';
import { useAuth } from '../../../../src/lib/auth/auth-context';

export default function FamilyActivitiesPage() {
  const { activeFamilyId, status } = useAuth();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [learners, setLearners] = useState<LearnerSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    async function loadData() {
      try {
        const effectiveFamilyId =
          activeFamilyId ??
          (typeof window !== 'undefined'
            ? localStorage.getItem('aletheia.activeFamilyId') ?? localStorage.getItem('familyId')
            : null);

        if (!effectiveFamilyId) {
          setLoading(false);
          return;
        }

        setFamilyId(effectiveFamilyId);

        const res = await fetch(`/api/v1/families/${effectiveFamilyId}/learners`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setLearners(Array.isArray(data) ? data : []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [activeFamilyId, status]);

  return (
    <ProductShell learners={learners}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Carregando atividades...
          </div>
        ) : familyId ? (
          <FamilyActivitiesGallery familyId={familyId} />
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Nenhuma família ativa encontrada.
          </div>
        )}
      </div>
    </ProductShell>
  );
}
