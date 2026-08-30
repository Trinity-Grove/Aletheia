'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RegisterForm } from '../../../src/components/auth/register-form';
import { useAuth } from '../../../src/lib/auth/auth-context';

export default function RegisterPage() {
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
          <h1>Cadastro de Guardião</h1>
          <p>Crie sua conta soberana para liderar a jornada educacional familiar.</p>
        </div>

        <RegisterForm onSubmit={handleRegister} />

        <div className="auth-footer">
          <p>
            Já possui uma conta de guardião?{' '}
            <Link href="/login" className="auth-link">
              Acesse aqui
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
