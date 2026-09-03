'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '../../../src/components/auth/login-form';
import { MfaVerifyForm } from '../../../src/components/auth/mfa-verify-form';
import { useAuth } from '../../../src/lib/auth/auth-context';

// Only ever follow a same-origin, relative redirect target. A `redirect`
// query param is attacker-controllable (e.g. a crafted link), so an
// absolute or protocol-relative value (`https://evil.com`, `//evil.com`)
// must never be honored — that would be an open redirect.
export function sanitizeRedirectTarget(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }
  return value;
}

function LoginFormWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, verifyMfa } = useAuth();
  const [challengeToken, setChallengeToken] = useState<string | null>(null);

  const redirectTo = () => {
    const redirectParam = sanitizeRedirectTarget(searchParams?.get('redirect'));
    router.push(redirectParam);
  };

  const handleLogin = async (data: { email: string; password: string }) => {
    const result = await login(data);
    if ('mfaRequired' in result) {
      // Paused: no session exists yet. Show the second-factor screen.
      setChallengeToken(result.challengeToken);
      return;
    }
    redirectTo();
  };

  const handleVerify = async (data: { code: string }) => {
    if (!challengeToken) {
      throw new Error('Sessão de verificação expirada. Entre novamente.');
    }
    await verifyMfa({ challengeToken, code: data.code });
    redirectTo();
  };

  if (challengeToken) {
    return (
      <>
        <MfaVerifyForm onSubmit={handleVerify} />
        <button
          type="button"
          data-testid="mfa-back-button"
          onClick={() => setChallengeToken(null)}
          style={{
            width: '100%',
            marginTop: '0.75rem',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: '0.9375rem',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--forest)',
            background: 'transparent',
            color: 'var(--forest)',
            cursor: 'pointer',
          }}
        >
          Voltar para o login
        </button>
      </>
    );
  }

  return <LoginForm onSubmit={handleLogin} />;
}

export default function LoginPage() {
  return (
    <main className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Entrar no Aletheia</h1>
          <p>Acesse o portal do guardião e gerencie o currículo da sua família.</p>
        </div>

        <Suspense fallback={<LoginForm />}>
          <LoginFormWrapper />
        </Suspense>

        <div className="auth-footer">
          <p>
            <Link href="/forgot-password" className="auth-link">
              Esqueceu sua senha?
            </Link>
          </p>
          <p>
            Ainda não possui conta de guardião?{' '}
            <Link href="/register" className="auth-link">
              Cadastre-se aqui
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
