'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useLocale } from '../../lib/i18n/locale-context';

export interface VerifyEmailFormProps {
  token: string | null;
  onSubmit?: (_data: { token: string }) => Promise<void> | void;
}

type VerificationStatus = 'verifying' | 'success' | 'error';

export function VerifyEmailForm({ token, onSubmit }: VerifyEmailFormProps) {
  const { t } = useLocale();
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [error, setError] = useState<string | null>(null);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!token || requestedRef.current) {
      return;
    }
    requestedRef.current = true;

    (async () => {
      try {
        if (onSubmit) {
          await onSubmit({ token });
        }
        setStatus('success');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t('auth.verifyEmail.errorFailed');
        setError(message);
        setStatus('error');
      }
    })();
  }, [token, onSubmit, t]);

  if (!token) {
    return (
      <div className="alert alert-error" data-testid="verify-email-invalid-link" role="alert">
        {t('auth.verifyEmail.invalidLinkError')}
      </div>
    );
  }

  if (status === 'verifying') {
    return (
      <p data-testid="verify-email-loading">{t('auth.verifyEmail.loading')}</p>
    );
  }

  if (status === 'success') {
    return (
      <div className="auth-form" data-testid="verify-email-success">
        <p>{t('auth.verifyEmail.successMessage')}</p>
      </div>
    );
  }

  return (
    <div className="alert alert-error" data-testid="verify-email-error" role="alert">
      {error ?? t('auth.verifyEmail.errorFailed')}
    </div>
  );
}
