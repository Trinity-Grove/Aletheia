'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ISO3_COUNTRIES, resolvePrivacyRegime, type RegisterGuardianDto } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';
import { LegalDocumentContent } from '../shared/legal-document-content';

export interface RegisterFormProps {
  onSubmit?: (_data: RegisterGuardianDto) => Promise<void> | void;
}

interface PublicConsentDefinition {
  code: string;
  title: string;
  content: string;
}

type LegalDocumentKind = 'TERMS_OF_USE' | 'PRIVACY_POLICY';

// A scroll position within this many pixels of the bottom counts as
// "reached the end" -- exact equality is unreliable across browsers due
// to fractional-pixel layout/zoom rounding.
const SCROLL_END_THRESHOLD_PX = 4;

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const { t } = useLocale();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countryCode, setCountryCode] = useState('BRA');
  const [acceptedTermsOfUse, setAcceptedTermsOfUse] = useState(false);
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishedDefinitions, setPublishedDefinitions] = useState<PublicConsentDefinition[]>([]);
  const [viewingKind, setViewingKind] = useState<LegalDocumentKind | null>(null);
  const [hasReadTermsOfUse, setHasReadTermsOfUse] = useState(false);
  const [hasReadPrivacyPolicy, setHasReadPrivacyPolicy] = useState(false);
  const documentScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch('/api/v1/consent-definitions/published?scope=FAMILY')
      .then((res) => (res.ok ? res.json() : []))
      .then((defs: PublicConsentDefinition[]) => setPublishedDefinitions(Array.isArray(defs) ? defs : []))
      .catch(() => setPublishedDefinitions([]));
  }, []);

  const regime = resolvePrivacyRegime(countryCode);
  const termsOfUseDefinition = publishedDefinitions.find((d) => d.code === `TERMS_OF_USE_${regime}`);
  const privacyPolicyDefinition = publishedDefinitions.find((d) => d.code === `PRIVACY_POLICY_${regime}`);
  const viewingDefinition =
    viewingKind === 'TERMS_OF_USE' ? termsOfUseDefinition : viewingKind === 'PRIVACY_POLICY' ? privacyPolicyDefinition : null;

  const markRead = (kind: LegalDocumentKind) => {
    if (kind === 'TERMS_OF_USE') setHasReadTermsOfUse(true);
    else setHasReadPrivacyPolicy(true);
  };

  const checkScrolledToEnd = (el: HTMLDivElement) => {
    if (!viewingKind) return;
    const reachedEnd = el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_END_THRESHOLD_PX;
    if (reachedEnd) markRead(viewingKind);
  };

  // Some documents may fit entirely within the viewer without ever
  // needing to scroll -- nothing to gate on in that case, so mark it
  // read as soon as it's rendered. Also covers a document that failed
  // to load (nothing there to read either).
  useEffect(() => {
    if (!viewingKind) return;
    if (!viewingDefinition) {
      markRead(viewingKind);
      return;
    }
    const el = documentScrollRef.current;
    if (el && el.scrollHeight <= el.clientHeight) {
      markRead(viewingKind);
    }
    // Only re-check when the open document (or its content) changes.
  }, [viewingKind, viewingDefinition?.content]);

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

    if (!acceptedTermsOfUse || !acceptedPrivacyPolicy) {
      setError(t('auth.register.errorConsentRequired'));
      return;
    }

    try {
      setLoading(true);
      if (onSubmit) {
        await onSubmit({
          fullName,
          email,
          password,
          countryCode,
          acceptedTermsOfUse: true,
          acceptedPrivacyPolicy: true,
        });
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

      <div className="form-group">
        <label htmlFor="reg-country">{t('auth.register.countryLabel')}</label>
        <select
          id="reg-country"
          data-testid="reg-country-select"
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
        >
          {ISO3_COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name} ({country.code})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <input
            type="checkbox"
            data-testid="reg-terms-of-use-checkbox"
            checked={acceptedTermsOfUse}
            disabled={!hasReadTermsOfUse}
            onChange={(e) => setAcceptedTermsOfUse(e.target.checked)}
          />
          <span>
            {t('auth.register.acceptTermsOfUseLabel')}{' '}
            <button
              type="button"
              data-testid="reg-view-terms-of-use"
              onClick={() => setViewingKind('TERMS_OF_USE')}
              className="auth-link"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
            >
              {t('auth.register.termsOfUseLinkText')}
            </button>
            {!hasReadTermsOfUse && (
              <>
                {' '}
                <span data-testid="reg-terms-of-use-hint" style={{ fontSize: '0.8125rem', opacity: 0.75 }}>
                  ({t('auth.register.mustReadDocumentHint')})
                </span>
              </>
            )}
          </span>
        </label>
      </div>

      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <input
            type="checkbox"
            data-testid="reg-privacy-policy-checkbox"
            checked={acceptedPrivacyPolicy}
            disabled={!hasReadPrivacyPolicy}
            onChange={(e) => setAcceptedPrivacyPolicy(e.target.checked)}
          />
          <span>
            {t('auth.register.acceptPrivacyPolicyLabel')}{' '}
            <button
              type="button"
              data-testid="reg-view-privacy-policy"
              onClick={() => setViewingKind('PRIVACY_POLICY')}
              className="auth-link"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
            >
              {t('auth.register.privacyPolicyLinkText')}
            </button>
            {!hasReadPrivacyPolicy && (
              <>
                {' '}
                <span data-testid="reg-privacy-policy-hint" style={{ fontSize: '0.8125rem', opacity: 0.75 }}>
                  ({t('auth.register.mustReadDocumentHint')})
                </span>
              </>
            )}
          </span>
        </label>
      </div>

      <button
        type="submit"
        data-testid="register-button"
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? t('auth.register.submittingButton') : t('auth.register.submitButton')}
      </button>

      {viewingKind && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="reg-document-viewer"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            ref={documentScrollRef}
            data-testid="reg-document-viewer-scroll-area"
            onScroll={(e) => checkScrolledToEnd(e.currentTarget)}
            style={{
              maxWidth: '32rem',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-surface, #fff)',
              borderRadius: '0.5rem',
              padding: '1.5rem',
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {viewingDefinition?.title ??
                t(viewingKind === 'TERMS_OF_USE' ? 'auth.register.termsOfUseLinkText' : 'auth.register.privacyPolicyLinkText')}
            </h2>
            {viewingDefinition ? (
              <LegalDocumentContent content={viewingDefinition.content} />
            ) : (
              <p data-testid="reg-document-unavailable">{t('auth.register.documentUnavailableMessage')}</p>
            )}
            <button
              type="button"
              onClick={() => setViewingKind(null)}
              className="btn btn-secondary"
            >
              {t('auth.register.viewDocumentCloseButton')}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
