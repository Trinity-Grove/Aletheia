'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { RegisterGuardianDto } from '@aletheia/contracts';
import { EmailCodeVerifyForm } from '../../../src/components/auth/email-code-verify-form';
import { RegisterForm } from '../../../src/components/auth/register-form';
import { useAuth } from '../../../src/lib/auth/auth-context';
import { useLocale } from '../../../src/lib/i18n/locale-context';

export default function RegisterPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { register, confirmRegistrationCode, resendRegistrationCode } = useAuth();
  const [challengeToken, setChallengeToken] = useState<string | null>(null);

  const handleRegister = async (data: RegisterGuardianDto) => {
    const result = await register(data);
    // Pre-fills onboarding's own country field with what was already
    // chosen here, so the guardian isn't asked twice.
    if (typeof window !== 'undefined') {
      localStorage.setItem('aletheia.registrationCountryCode', data.countryCode);
    }
    // register() never authenticates directly -- the account stays
    // pending until the emailed code is confirmed below.
    setChallengeToken(result.challengeToken);
  };

  const handleVerify = async (data: { code: string }) => {
    if (!challengeToken) {
      throw new Error(t('auth.emailCode.expired'));
    }
    await confirmRegistrationCode({ challengeToken, code: data.code });
    router.push('/onboarding');
  };

  const handleResend = async () => {
    if (!challengeToken) {
      throw new Error(t('auth.emailCode.expired'));
    }
    const result = await resendRegistrationCode(challengeToken);
    // Reissuing invalidates the previous challenge -- switch to the new one.
    setChallengeToken(result.challengeToken);
  };

  return (
    <main className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{challengeToken ? t('auth.emailCode.title') : t('auth.register.title')}</h1>
          <p>{challengeToken ? t('auth.emailCode.subtitle') : t('auth.register.subtitle')}</p>
        </div>

        {challengeToken ? (
          <EmailCodeVerifyForm onSubmit={handleVerify} onResend={handleResend} />
        ) : (
          <RegisterForm onSubmit={handleRegister} />
        )}

        {!challengeToken && (
          <div className="auth-footer">
            <p>
              {t('auth.register.hasAccountText')}{' '}
              <Link href="/login" className="auth-link">
                {t('auth.register.loginLink')}
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
