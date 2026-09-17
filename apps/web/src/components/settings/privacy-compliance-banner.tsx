'use client';

import React, { useEffect, useState } from 'react';
import { Alert } from '@aletheia/ui';

export function PrivacyComplianceBanner() {
  const [compliant, setCompliant] = useState<boolean>(true);

  useEffect(() => {
    async function checkCompliance() {
      try {
        const familyId = typeof window !== 'undefined' ? localStorage.getItem('familyId') : null;
        if (!familyId) return;

        const res = await fetch(`/api/v1/families/${familyId}/consents/compliance`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.compliant === 'boolean') {
            setCompliant(data.compliant);
          }
        }
      } catch {
        // ignore
      }
    }
    void checkCompliance();
  }, []);

  if (compliant) {
    return null;
  }

  return (
    <div data-testid="privacy-compliance-banner" style={{ marginBottom: '1.5rem' }}>
      <Alert variant="warning">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', width: '100%' }}>
          <div>
            <strong>Atualização de Termos (LGPD):</strong> Existem termos de privacidade ou autorizações de menores pendentes de assinatura do responsável.
          </div>
          <a
            href="/settings/privacy"
            style={{
              fontWeight: 700,
              textDecoration: 'underline',
              color: 'inherit',
              fontSize: '0.875rem',
            }}
          >
            Revisar e Assinar Termos →
          </a>
        </div>
      </Alert>
    </div>
  );
}
