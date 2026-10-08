'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from '../../src/lib/i18n/locale-context';
import { DocumentVerificationView } from '../../src/components/reports/document-verification-view';

function VerificarContent() {
  const searchParams = useSearchParams();
  const queryIdentifier =
    searchParams?.get('hash') ||
    searchParams?.get('identifier') ||
    searchParams?.get('id') ||
    undefined;

  return <DocumentVerificationView initialIdentifier={queryIdentifier} />;
}

export default function VerificarPage() {
  const { t } = useLocale();

  return (
    <Suspense
      fallback={
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          {t('auth.verify.loading')}
        </div>
      }
    >
      <VerificarContent />
    </Suspense>
  );
}
