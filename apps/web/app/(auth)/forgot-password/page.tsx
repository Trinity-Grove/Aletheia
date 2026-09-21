'use client';

import React from 'react';
import Link from 'next/link';
import { ForgotPasswordForm } from '../../../src/components/auth/forgot-password-form';
import { api } from '../../../src/lib/api';
import { useLocale } from '../../../src/lib/i18n/locale-context';

export default function ForgotPasswordPage() {
  const { t } = useLocale();

  const handleForgotPassword = async (data: { email: string }) => {
    await api.post('/auth/forgot-password', data);
  };

  return (
    <main className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{t('auth.forgotPassword.title')}</h1>
          <p>{t('auth.forgotPassword.subtitle')}</p>
        </div>

        <ForgotPasswordForm onSubmit={handleForgotPassword} />

        <div className="auth-footer">
          <p>
            {t('auth.forgotPassword.rememberPasswordText')}{' '}
            <Link href="/login" className="auth-link">
              {t('auth.forgotPassword.backToLogin')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
