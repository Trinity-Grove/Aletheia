'use client';

import React, { useState } from 'react';
import { api } from '../../lib/api';
import { useLocale } from '../../lib/i18n/locale-context';

// Only ever shown for pre-existing accounts grandfathered out of the
// blocking email-confirmation flow (emailVerificationRequired: false on
// the server) -- new registrations can't reach an authenticated screen
// at all until they confirm, so this banner never applies to them.
export function UnverifiedEmailBanner() {
  const { t } = useLocale();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleResend = async () => {
    setSending(true);
    try {
      await api.post('/auth/resend-verification');
      setSent(true);
    } catch {
      // Best-effort — the endpoint is silently anti-enumeration anyway.
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="alert alert-warning" data-testid="unverified-email-banner" role="status">
      <span>{sent ? t('auth.unverifiedBanner.resendSuccess') : t('auth.unverifiedBanner.message')}</span>
      {!sent && (
        <button
          type="button"
          data-testid="unverified-email-resend-button"
          className="btn btn-secondary"
          disabled={sending}
          onClick={handleResend}
        >
          {t('auth.unverifiedBanner.resendButton')}
        </button>
      )}
    </div>
  );
}
