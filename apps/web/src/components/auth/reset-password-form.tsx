'use client';

import React, { useState } from 'react';
import { useLocale } from '../../lib/i18n/locale-context';

export interface ResetPasswordFormProps {
  token: string | null;
  onSubmit?: (_data: { token: string; newPassword: string }) => Promise<void> | void;
}

export function ResetPasswordForm({ token, onSubmit }: ResetPasswordFormProps) {
  const { t } = useLocale();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!token) {
    return (
      <div className="alert alert-error" data-testid="reset-password-invalid-link" role="alert">
        {t('auth.resetPassword.invalidLinkError')}
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword) {
      setError(t('auth.resetPassword.errorRequired'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('auth.resetPassword.errorMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.resetPassword.errorMismatch'));
      return;
    }

    try {
      setLoading(true);
      if (onSubmit) {
        await onSubmit({ token, newPassword });
      }
      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.resetPassword.errorFailed');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-form" data-testid="reset-password-success">
        <p>{t('auth.resetPassword.successMessage')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form" data-testid="reset-password-form">
      {error && (
        <div className="alert alert-error" data-testid="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="reset-password-new">{t('auth.resetPassword.newPasswordLabel')}</label>
        <input
          id="reset-password-new"
          type="password"
          data-testid="reset-password-new-input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="reset-password-confirm">{t('auth.resetPassword.confirmPasswordLabel')}</label>
        <input
          id="reset-password-confirm"
          type="password"
          data-testid="reset-password-confirm-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
          required
        />
      </div>

      <button
        type="submit"
        data-testid="reset-password-button"
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? t('auth.resetPassword.submittingButton') : t('auth.resetPassword.submitButton')}
      </button>
    </form>
  );
}
