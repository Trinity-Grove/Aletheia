'use client';

import React, { useState } from 'react';
import { useLocale } from '../../lib/i18n/locale-context';

export interface EmailCodeVerifyFormProps {
  onSubmit?: (_data: { code: string }) => Promise<void> | void;
  onResend?: () => Promise<void> | void;
}

export function EmailCodeVerifyForm({ onSubmit, onResend }: EmailCodeVerifyFormProps) {
  const { t } = useLocale();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResendMessage(null);

    if (!code.trim()) {
      setError(t('auth.emailCode.errorRequired'));
      return;
    }

    try {
      setLoading(true);
      if (onSubmit) {
        await onSubmit({ code });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.emailCode.errorInvalid');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResendMessage(null);
    try {
      setResending(true);
      if (onResend) {
        await onResend();
      }
      setResendMessage(t('auth.emailCode.resendSuccess'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.emailCode.resendError');
      setError(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form" data-testid="email-code-verify-form">
      {error && (
        <div className="alert alert-error" data-testid="email-code-verify-error" role="alert">
          {error}
        </div>
      )}
      {resendMessage && !error && (
        <div className="alert alert-success" data-testid="email-code-resend-success" role="status">
          {resendMessage}
        </div>
      )}

      <p
        className="auth-header-text"
        style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: '0 0 0.5rem' }}
      >
        {t('auth.emailCode.instruction')}
      </p>

      <div className="form-group">
        <label htmlFor="email-verification-code">{t('auth.emailCode.codeLabel')}</label>
        <input
          id="email-verification-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          data-testid="email-code-input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t('auth.emailCode.codePlaceholder')}
          required
        />
      </div>

      <button
        type="submit"
        data-testid="email-code-verify-button"
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? t('auth.emailCode.submittingButton') : t('auth.emailCode.submitButton')}
      </button>

      <button
        type="button"
        data-testid="email-code-resend-button"
        disabled={resending}
        onClick={handleResend}
        className="btn btn-secondary"
        style={{ marginTop: '0.5rem' }}
      >
        {resending ? t('auth.emailCode.resendingButton') : t('auth.emailCode.resendButton')}
      </button>
    </form>
  );
}
