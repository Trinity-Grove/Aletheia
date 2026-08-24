import React from 'react';
import Link from 'next/link';
import { LoginForm } from '../../../src/components/auth/login-form.js';

export default function LoginPage() {
  return (
    <main className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Entrar no Aletheia</h1>
          <p>Acesse o portal do guardião e gerencie o currículo da sua família.</p>
        </div>

        <LoginForm />

        <div className="auth-footer">
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
