'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ResetPasswordForm } from '../../../src/components/auth/reset-password-form';
import { api } from '../../../src/lib/api';
import { useLocale } from '../../../src/lib/i18n/locale-context';

function ResetPasswordFormWrapper() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? null;

  const handleResetPassword = async (data: { token: string; newPassword: string }) => {
    await api.post('/auth/reset-password', data);
  };

  return <ResetPasswordForm token={token} onSubmit={handleResetPassword} />;
}

export default function ResetPasswordPage() {
  const { t } = useLocale();

  return (
    <main className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{t('auth.resetPassword.title')}</h1>
          <p>{t('auth.resetPassword.subtitle')}</p>
        </div>

        <Suspense fallback={<p data-testid="reset-password-loading">{t('auth.resetPassword.loading')}</p>}>
          <ResetPasswordFormWrapper />
        </Suspense>

        <div className="auth-footer">
          <p>
            {t('auth.resetPassword.rememberPasswordText')}{' '}
            <Link href="/login" className="auth-link">
              {t('auth.resetPassword.backToLogin')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
