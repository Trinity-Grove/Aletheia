'use client';

import React, { useState } from 'react';
import { useLocale } from '../../lib/i18n/locale-context';

export interface ForgotPasswordFormProps {
  onSubmit?: (_data: { email: string }) => Promise<void> | void;
}

export function ForgotPasswordForm({ onSubmit }: ForgotPasswordFormProps) {
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(t('auth.forgotPassword.errorRequired'));
      return;
    }

    try {
      setLoading(true);
      if (onSubmit) {
        await onSubmit({ email });
      }
      // Always shown on success, regardless of whether the account exists —
      // the API itself never reveals that either.
      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.forgotPassword.errorFailed');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-form" data-testid="forgot-password-success">
        <p>{t('auth.forgotPassword.successMessage', { email })}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form" data-testid="forgot-password-form">
      {error && (
        <div className="alert alert-error" data-testid="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="forgot-password-email">{t('auth.forgotPassword.emailLabel')}</label>
        <input
          id="forgot-password-email"
          type="email"
          data-testid="forgot-password-email-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth.forgotPassword.emailPlaceholder')}
        />
      </div>

      <button
        type="submit"
        data-testid="forgot-password-button"
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? t('auth.forgotPassword.submittingButton') : t('auth.forgotPassword.submitButton')}
      </button>
    </form>
  );
}
