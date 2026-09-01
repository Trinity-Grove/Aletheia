'use client';

import React from 'react';
import Link from 'next/link';
import { ForgotPasswordForm } from '../../../src/components/auth/forgot-password-form';
import { api } from '../../../src/lib/api';

export default function ForgotPasswordPage() {
  const handleForgotPassword = async (data: { email: string }) => {
    await api.post('/auth/forgot-password', data);
  };

  return (
    <main className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Esqueceu sua senha?</h1>
          <p>Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>
        </div>

        <ForgotPasswordForm onSubmit={handleForgotPassword} />

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
