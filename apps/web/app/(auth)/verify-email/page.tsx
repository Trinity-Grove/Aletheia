'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { VerifyEmailForm } from '../../../src/components/auth/verify-email-form';
import { api } from '../../../src/lib/api';
import { useLocale } from '../../../src/lib/i18n/locale-context';

function VerifyEmailFormWrapper() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? null;

  const handleVerifyEmail = async (data: { token: string }) => {
    await api.post('/auth/verify-email', data);
  };

  return <VerifyEmailForm token={token} onSubmit={handleVerifyEmail} />;
}

export default function VerifyEmailPage() {
  const { t } = useLocale();

  return (
    <main className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{t('auth.verifyEmail.title')}</h1>
        </div>

        <Suspense fallback={<p data-testid="verify-email-loading">{t('auth.verifyEmail.loading')}</p>}>
          <VerifyEmailFormWrapper />
        </Suspense>

        <div className="auth-footer">
          <p>
            <Link href="/login" className="auth-link">
              {t('auth.verifyEmail.backToLogin')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
