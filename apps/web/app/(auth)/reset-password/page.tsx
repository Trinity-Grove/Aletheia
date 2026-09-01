'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ResetPasswordForm } from '../../../src/components/auth/reset-password-form';
import { api } from '../../../src/lib/api';

function ResetPasswordFormWrapper() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? null;

  const handleResetPassword = async (data: { token: string; newPassword: string }) => {
    await api.post('/auth/reset-password', data);
  };

  return <ResetPasswordForm token={token} onSubmit={handleResetPassword} />;
}

export default function ResetPasswordPage() {
  return (
    <main className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Redefinir senha</h1>
          <p>Escolha uma nova senha para sua conta.</p>
        </div>

        <Suspense fallback={<p data-testid="reset-password-loading">Carregando...</p>}>
          <ResetPasswordFormWrapper />
        </Suspense>

        <div className="auth-footer">
          <p>
            Lembrou a senha?{' '}
            <Link href="/login" className="auth-link">
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
