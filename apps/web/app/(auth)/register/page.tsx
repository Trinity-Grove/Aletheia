'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RegisterForm } from '../../../src/components/auth/register-form';
import { useAuth } from '../../../src/lib/auth/auth-context';
import { useLocale } from '../../../src/lib/i18n/locale-context';

export default function RegisterPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { register } = useAuth();

  const handleRegister = async (data: { fullName: string; email: string; password: string }) => {
    await register(data);
    router.push('/onboarding');
  };

  return (
    <main className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{t('auth.register.title')}</h1>
          <p>{t('auth.register.subtitle')}</p>
        </div>

        <RegisterForm onSubmit={handleRegister} />

        <div className="auth-footer">
          <p>
            {t('auth.register.hasAccountText')}{' '}
            <Link href="/login" className="auth-link">
              {t('auth.register.loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
