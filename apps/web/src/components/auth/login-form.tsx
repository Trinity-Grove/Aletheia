'use client';

import React, { useState } from 'react';

export interface LoginFormProps {
  onSubmit?: (_data: { email: string; password: string }) => Promise<void> | void;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setLoading(true);
      if (onSubmit) {
        await onSubmit({ email, password });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha na autenticação. Verifique suas credenciais.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form" data-testid="login-form">
      {error && (
        <div className="alert alert-error" data-testid="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="login-email">E-mail</label>
        <input
          id="login-email"
          type="email"
          data-testid="login-email-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu.email@exemplo.com"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="login-password">Senha</label>
        <input
          id="login-password"
          type="password"
          data-testid="login-password-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      <button
        type="submit"
        data-testid="login-button"
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
