'use client';

import React, { useState } from 'react';
import { useLocale } from '../../lib/i18n/locale-context';

export interface RegisterFormProps {
  onSubmit?: (_data: { fullName: string; email: string; password: string }) => Promise<void> | void;
}

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const { t } = useLocale();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError(t('auth.register.errorRequired'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.register.errorMinLength'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.register.errorMismatch'));
      return;
    }

    try {
      setLoading(true);
      if (onSubmit) {
        await onSubmit({ fullName, email, password });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.register.errorFailed');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form" data-testid="register-form">
      {error && (
        <div className="alert alert-error" data-testid="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="reg-name">{t('auth.register.fullNameLabel')}</label>
        <input
          id="reg-name"
          type="text"
          data-testid="reg-name-input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={t('auth.register.fullNamePlaceholder')}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="reg-email">{t('auth.register.emailLabel')}</label>
        <input
          id="reg-email"
          type="email"
          data-testid="reg-email-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth.register.emailPlaceholder')}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="reg-password">{t('auth.register.passwordLabel')}</label>
        <input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          data-testid="reg-password-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth.register.passwordPlaceholder')}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="reg-confirm">{t('auth.register.confirmPasswordLabel')}</label>
        <input
          id="reg-confirm"
          type="password"
          autoComplete="new-password"
          data-testid="reg-confirm-password-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t('auth.register.confirmPasswordPlaceholder')}
          required
        />
      </div>

      <button
        type="submit"
        data-testid="register-button"
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? t('auth.register.submittingButton') : t('auth.register.submitButton')}
      </button>
    </form>
  );
}
