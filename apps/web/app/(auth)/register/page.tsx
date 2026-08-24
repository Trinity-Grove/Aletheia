import React from 'react';
import Link from 'next/link';
import { RegisterForm } from '../../../src/components/auth/register-form.js';

export default function RegisterPage() {
  return (
    <main className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Cadastro de Guardião</h1>
          <p>Crie sua conta soberana para liderar a jornada educacional familiar.</p>
        </div>

        <RegisterForm />

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
