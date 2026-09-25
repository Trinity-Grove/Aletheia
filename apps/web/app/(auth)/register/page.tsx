'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { RegisterGuardianDto } from '@aletheia/contracts';
import { RegisterForm } from '../../../src/components/auth/register-form';
import { useAuth } from '../../../src/lib/auth/auth-context';
import { useLocale } from '../../../src/lib/i18n/locale-context';

export default function RegisterPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { register } = useAuth();

  const handleRegister = async (data: RegisterGuardianDto) => {
    await register(data);
    // Pre-fills onboarding's own country field with what was already
    // chosen here, so the guardian isn't asked twice.
    if (typeof window !== 'undefined') {
      localStorage.setItem('aletheia.registrationCountryCode', data.countryCode);
    }
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
