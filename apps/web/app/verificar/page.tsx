'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  return (
    <Suspense
      fallback={
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Carregando verificação...
        </div>
      }
    >
      <VerificarContent />
    </Suspense>
  );
}
