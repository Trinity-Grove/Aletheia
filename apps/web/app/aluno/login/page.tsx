'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button } from '@aletheia/ui';
import type { LearnerAccessOptionDto, LearnerSessionResponseDto } from '@aletheia/contracts';
import { useLocale } from '../../../src/lib/i18n/locale-context';

export const dynamic = 'force-dynamic';

function LearnerLoginContent() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const familyParam = searchParams?.get('familyId');
  const tokenParam = searchParams?.get('token') || searchParams?.get('t');

  const [learners, setLearners] = useState<LearnerAccessOptionDto[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<LearnerAccessOptionDto | null>(null);
  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [authenticatingToken, setAuthenticatingToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tokenParam) {
      void handleTokenLogin(tokenParam);
      return;
    }

    const fam = familyParam || (typeof window !== 'undefined' ? localStorage.getItem('familyId') : null) || '';
    if (fam) {
      void loadLearners(fam);
    }
  }, [tokenParam, familyParam]);

  const handleTokenLogin = async (token: string) => {
    try {
      setLoading(true);
      setAuthenticatingToken(true);
      setError(null);
      const res = await fetch('/api/v1/learner-access/token-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 403) {
          throw new Error(t('learnerPortal.login.errorTokenAccessDisabled'));
        }
        throw new Error(err.message || t('learnerPortal.login.errorTokenInvalid'));
      }

      const session: LearnerSessionResponseDto = await res.json();
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'learner_session',
          JSON.stringify({
            learnerId: session.learnerId,
            familyId: session.familyId,
            displayName: session.displayName,
          })
        );
      }
      router.push('/aluno/agenda');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('learnerPortal.login.errorTokenGeneral'));
    } finally {
      setLoading(false);
      setAuthenticatingToken(false);
    }
  };

  const loadLearners = async (famId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/v1/learner-access/families/${famId}/learners`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLearners(data);
        }
      }
    } catch {
      // Offline or network error
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!selectedLearner || !pinCode) return;

    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/learner-access/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          learnerId: selectedLearner.learnerId,
          code: pinCode.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 403) {
          throw new Error(t('learnerPortal.login.errorPinBlocked'));
        }
        throw new Error(err.message || t('learnerPortal.login.errorPinInvalid'));
      }

      const session: LearnerSessionResponseDto = await res.json();
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'learner_session',
          JSON.stringify({
            learnerId: session.learnerId,
            familyId: session.familyId,
            displayName: session.displayName,
          })
        );
      }
      router.push('/aluno/agenda');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('learnerPortal.login.errorGeneral'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      data-testid="learner-login-page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        backgroundColor: 'var(--bg-canvas)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '28rem',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          padding: '2.5rem 2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '2rem' }}>
          <span
            style={{
              display: 'inline-flex',
              padding: '0.3125rem 0.875rem',
              backgroundColor: 'var(--sage-soft)',
              color: 'var(--forest)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1rem',
            }}
          >
            {t('learnerPortal.login.modeBadge')}
          </span>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-serif)',
              fontSize: '1.875rem',
              fontWeight: 500,
              color: 'var(--forest)',
              letterSpacing: '-0.02em',
            }}
          >
            {t('learnerPortal.login.title')}
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            {authenticatingToken
              ? t('learnerPortal.login.connectingToken')
              : selectedLearner
              ? t('learnerPortal.login.greetingWithPin', { name: selectedLearner.displayName })
              : t('learnerPortal.login.selectLearnerPrompt')}
          </p>
        </div>

        {error && (
          <div data-testid="learner-login-error" style={{ marginBottom: '1.5rem' }}>
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {authenticatingToken ? (
          <div data-testid="token-login-loading" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>
              {t('learnerPortal.login.tokenAuthenticatingTitle')}
            </p>
            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {t('learnerPortal.login.tokenAuthenticatingSubtitle')}
            </p>
          </div>
        ) : !selectedLearner ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {learners.length > 0 ? (
              learners.map((l) => (
                <button
                  key={l.learnerId}
                  type="button"
                  onClick={() => setSelectedLearner(l)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1.5px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--forest)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.125rem',
                    }}
                  >
                    {l.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {l.displayName}
                  </span>
                </button>
              ))
            ) : (
              <div style={{ padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {t('learnerPortal.login.noLearnersFound')}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--forest)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {selectedLearner.displayName.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {selectedLearner.displayName}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedLearner(null);
                  setPinCode('');
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--forest)',
                  fontSize: '0.8125rem',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  marginLeft: '0.5rem',
                }}
              >
                {t('learnerPortal.login.changeLearner')}
              </button>
            </div>

            <div>
              <label
                htmlFor="learner-pin"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}
              >
                {t('learnerPortal.login.pinLabel')}
              </label>
              <input
                id="learner-pin"
                data-testid="learner-pin-input"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={16}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder={t('learnerPortal.login.pinPlaceholder')}
                required
                disabled={loading}
                autoFocus
                style={{
                  width: '100%',
                  height: '3.25rem',
                  fontSize: '1.75rem',
                  textAlign: 'center',
                  letterSpacing: '0.25em',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-light)',
                  backgroundColor: 'var(--bg-canvas)',
                  color: 'var(--forest)',
                  fontWeight: 700,
                }}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              data-testid="learner-submit-login-btn"
              isLoading={loading}
              onClick={handleLogin}
              style={{ width: '100%', height: '3rem', fontSize: '1rem' }}
            >
              {t('learnerPortal.login.submitButton')}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function LearnerLoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LearnerLoginContent />
    </React.Suspense>
  );
}
