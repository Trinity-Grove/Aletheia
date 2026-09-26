'use client';

import React, { useEffect, useState } from 'react';
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
  const [viewingDocument, setViewingDocument] = useState<PublicConsentDefinition | null>(null);

  useEffect(() => {
    fetch('/api/v1/consent-definitions/published?scope=FAMILY')
      .then((res) => (res.ok ? res.json() : []))
      .then((defs: PublicConsentDefinition[]) => setPublishedDefinitions(Array.isArray(defs) ? defs : []))
      .catch(() => setPublishedDefinitions([]));
  }, []);

  const regime = resolvePrivacyRegime(countryCode);
  const termsOfUseDefinition = publishedDefinitions.find((d) => d.code === `TERMS_OF_USE_${regime}`);
  const privacyPolicyDefinition = publishedDefinitions.find((d) => d.code === `PRIVACY_POLICY_${regime}`);

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
            onChange={(e) => setAcceptedTermsOfUse(e.target.checked)}
          />
          <span>
            {t('auth.register.acceptTermsOfUseLabel')}{' '}
            {termsOfUseDefinition ? (
              <button
                type="button"
                data-testid="reg-view-terms-of-use"
                onClick={() => setViewingDocument(termsOfUseDefinition)}
                className="auth-link"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
              >
                {t('auth.register.termsOfUseLinkText')}
              </button>
            ) : (
              t('auth.register.termsOfUseLinkText')
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
            onChange={(e) => setAcceptedPrivacyPolicy(e.target.checked)}
          />
          <span>
            {t('auth.register.acceptPrivacyPolicyLabel')}{' '}
            {privacyPolicyDefinition ? (
              <button
                type="button"
                data-testid="reg-view-privacy-policy"
                onClick={() => setViewingDocument(privacyPolicyDefinition)}
                className="auth-link"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
              >
                {t('auth.register.privacyPolicyLinkText')}
              </button>
            ) : (
              t('auth.register.privacyPolicyLinkText')
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

      {viewingDocument && (
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
            <h2 style={{ marginTop: 0 }}>{viewingDocument.title}</h2>
            <LegalDocumentContent content={viewingDocument.content} />
            <button
              type="button"
              onClick={() => setViewingDocument(null)}
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
