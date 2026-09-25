'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ISO3_COUNTRIES, type FamilyResponseDto } from '@aletheia/contracts';
import { useAuth } from '../../../src/lib/auth/auth-context';
import { api, ApiError } from '../../../src/lib/api';
import { useLocale } from '../../../src/lib/i18n/locale-context';

export default function OnboardingPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { setActiveFamilyFromCreated } = useAuth();

  const [familyName, setFamilyName] = useState('');
  const [countryCode, setCountryCode] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('aletheia.registrationCountryCode') || 'BRA'
      : 'BRA',
  );
  const [stateProvince, setStateProvince] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = familyName.trim();
    if (!trimmedName) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        name: trimmedName,
        countryCode,
        stateProvince: stateProvince.trim() || undefined,
      };

      const res = await api.post<FamilyResponseDto>('/families', payload);
      setActiveFamilyFromCreated(res);
      router.push('/learners');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || t('onboarding.wizard.errorCreateFamily'));
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(t('onboarding.wizard.errorCreateFamily'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="onboarding-page-wrapper onboarding-container" data-testid="onboarding-page">
      {/* Left Panel: Trinity Grove Sovereign Education Showcase */}
      <aside className="onboarding-hero-panel" aria-label={t('onboarding.hero.ariaLabel')}>
        <div className="onboarding-hero-header">
          <div className="onboarding-hero-badge">
            <span className="badge-dot" />
            <span>{t('onboarding.hero.badge')}</span>
          </div>

          <div className="onboarding-hero-icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(212, 163, 115, 0.4)" strokeWidth="1.5" />
              <path d="M24 13V33M24 13C20.5 13 16 14.5 14 16V32C16 30.8 20.5 30 24 30M24 13C27.5 13 32 14.5 34 16V32C32 30.8 27.5 30 24 30M24 30V34" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h2 className="onboarding-hero-title">{t('onboarding.hero.title')}</h2>
          <p className="onboarding-hero-subtitle">
            {t('onboarding.hero.subtitle')}
          </p>
        </div>

        <div className="onboarding-hero-quote-card">
          <p className="onboarding-hero-quote">
            {t('onboarding.hero.quote')}
          </p>
          <p className="onboarding-hero-author">{t('onboarding.hero.quoteAuthor')}</p>
        </div>

        <div className="onboarding-hero-footer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>{t('onboarding.hero.isolationFooter')}</span>
        </div>
      </aside>

      {/* Right Panel: Family Onboarding Form */}
      <section className="onboarding-main-panel">
        <div className="onboarding-card-wrapper onboarding-card">
          <div className="onboarding-step-indicator">
            <span>{t('onboarding.wizard.stepIndicator')}</span>
          </div>

          <div className="onboarding-card-header onboarding-header">
            <h1>{t('onboarding.wizard.welcomeTitle')}</h1>
            <p>{t('onboarding.wizard.welcomeSubtitle')}</p>
          </div>

          {errorMessage && (
            <div className="alert alert-error" data-testid="error-message" role="alert">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="onboarding-form" data-testid="family-onboarding-form">
            <div className="form-group">
              <label htmlFor="family-name">{t('onboarding.wizard.familyNameLabel')}</label>
              <input
                id="family-name"
                type="text"
                data-testid="family-name-input"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder={t('onboarding.wizard.familyNamePlaceholder')}
                required
                disabled={loading}
              />
              <span className="onboarding-field-hint">
                {t('onboarding.wizard.familyNameHint')}
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="country-code">{t('onboarding.wizard.countryLabel')}</label>
              <select
                id="country-code"
                data-testid="country-select"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={loading}
              >
                {ISO3_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
              <span className="onboarding-field-hint">
                {t('onboarding.wizard.countryHint')}
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="state-province">{t('onboarding.wizard.stateLabel')}</label>
              <input
                id="state-province"
                type="text"
                data-testid="state-input"
                value={stateProvince}
                onChange={(e) => setStateProvince(e.target.value)}
                placeholder={t('onboarding.wizard.statePlaceholder')}
                disabled={loading}
              />
              <span className="onboarding-field-hint">
                {t('onboarding.wizard.stateHint')}
              </span>
            </div>

            <button
              type="submit"
              data-testid="create-family-button"
              className="btn btn-primary onboarding-submit-btn"
              disabled={loading}
            >
              {loading ? t('onboarding.wizard.submittingButton') : t('onboarding.wizard.submitButton')}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
