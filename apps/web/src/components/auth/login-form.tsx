'use client';

import React, { useState } from 'react';
import { useLocale } from '../../lib/i18n/locale-context';

export interface LoginFormProps {
  onSubmit?: (_data: { email: string; password: string }) => Promise<void> | void;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError(t('auth.login.errorRequired'));
      return;
    }

    try {
      setLoading(true);
      if (onSubmit) {
        await onSubmit({ email, password });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.login.errorFailed');
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
        <label htmlFor="login-email">{t('auth.login.emailLabel')}</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          data-testid="login-email-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth.login.emailPlaceholder')}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="login-password">{t('auth.login.passwordLabel')}</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          data-testid="login-password-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth.login.passwordPlaceholder')}
          required
        />
      </div>

      <button
        type="submit"
        data-testid="login-button"
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? t('auth.login.submittingButton') : t('auth.login.submitButton')}
      </button>
    </form>
  );
}
