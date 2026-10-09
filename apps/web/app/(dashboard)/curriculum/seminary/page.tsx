'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOptionalAuth } from '../../../../src/lib/auth/auth-context';
import { useLocale } from '../../../../src/lib/i18n/locale-context';
import { SeminaryModuleViewer } from '../../../../src/components/curriculum/seminary-module-viewer';

export default function SeminaryPage() {
  const { t } = useLocale();
  const auth = useOptionalAuth();
  const [preferredTraditionCode, setPreferredTraditionCode] = useState<string | null>(null);

  useEffect(() => {
    const effectiveFamilyId =
      auth?.activeFamilyId ??
      (typeof window !== 'undefined'
        ? localStorage.getItem('aletheia.activeFamilyId') ?? localStorage.getItem('familyId')
        : null);

    if (!effectiveFamilyId) return;

    let isMounted = true;
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/v1/families/${effectiveFamilyId}/theological-profile`, {
          credentials: 'include',
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data?.preferredTraditionCode) {
            setPreferredTraditionCode(data.preferredTraditionCode);
          }
        }
      } catch {
        // Fallback to ecumenical if profile cannot be fetched
      }
    }

    void fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [auth?.activeFamilyId]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <nav aria-label={t('curriculum.pages.seminary.breadcrumb')} style={{ marginBottom: '1.5rem' }}>
        <Link
          href="/curriculum"
          data-testid="seminary-back-link"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.875rem',
            color: 'var(--forest)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          &larr; {t('curriculum.seminary.backToCurriculum')}
        </Link>
      </nav>

      <SeminaryModuleViewer preferredTraditionCode={preferredTraditionCode} />
    </div>
  );
}
