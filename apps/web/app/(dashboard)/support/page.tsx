'use client';

import React, { useEffect, useState } from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import type { LearnerSummaryDto } from '@aletheia/contracts';
import { ProductShell } from '../../../src/components/layout/product-shell';
import { DonationFormCard } from '../../../src/components/support/donation-form-card';
import { DonationReceiptsTable } from '../../../src/components/support/donation-receipts-table';

export default function SupportPage() {
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
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--forest)', display: 'flex', alignItems: 'center' }}>
              <AletheiaIcon name="heart" size={28} />
            </span>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Apoio Comunitário Voluntário
            </h1>
          </div>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 1rem 0', maxWidth: '800px' }}>
            Acreditamos que a educação domiciliar e a soberania da família sobre o aprendizado de seus filhos devem ser acessíveis a todos, independentemente de condição financeira. Por isso, o Aletheia é 100% gratuito e sem restrições.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--forest)', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <AletheiaIcon name="check" size={16} />
              <span>Sem paywalls ou bloqueios</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <AletheiaIcon name="check" size={16} />
              <span>Sem limites de educandos ou disciplinas</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <AletheiaIcon name="check" size={16} />
              <span>100% livre e soberano</span>
            </div>
          </div>
        </div>

        {/* Two-Column Responsive Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
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
