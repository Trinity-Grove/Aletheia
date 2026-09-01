'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '../../../src/components/auth/login-form';
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
  const { login } = useAuth();

  const handleLogin = async (data: { email: string; password: string }) => {
    await login(data);
    const redirectParam = sanitizeRedirectTarget(searchParams?.get('redirect'));
    router.push(redirectParam);
  };

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
