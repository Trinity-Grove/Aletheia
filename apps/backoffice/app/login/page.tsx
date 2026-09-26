'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../src/lib/auth/admin-auth-context';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, status } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (status === 'authenticated') {
      router.push('/operations');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login({ email, password });
      if (res.user.isPlatformAdmin) {
        router.push('/operations');
      } else {
        setError('Acesso negado: sua conta não possui privilégios de administrador da plataforma.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <h1>Aletheia Backoffice</h1>
        <p>Acesso restrito à equipe de governança e administração.</p>

        {error && (
          <div role="alert" className="admin-login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label htmlFor="admin-email">E-mail Corporativo</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@aletheia.com"
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="admin-password">Senha de Acesso</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar no Backoffice'}
          </button>
        </form>
      </div>
    </main>
  );
}
