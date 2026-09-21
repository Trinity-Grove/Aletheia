'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ISO3_COUNTRIES, type FamilyResponseDto } from '@aletheia/contracts';
import { useAuth } from '../../../src/lib/auth/auth-context';
import { api, ApiError } from '../../../src/lib/api';

export default function OnboardingPage() {
  const router = useRouter();
  const { setActiveFamilyFromCreated } = useAuth();

  const [familyName, setFamilyName] = useState('');
  const [countryCode, setCountryCode] = useState('BRA');
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
        setErrorMessage(err.message || 'Falha ao criar família.');
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Falha ao criar família. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="onboarding-page-wrapper onboarding-container" data-testid="onboarding-page">
      {/* Left Panel: Trinity Grove Sovereign Education Showcase */}
      <aside className="onboarding-hero-panel" aria-label="Apresentação Aletheia">
        <div className="onboarding-hero-header">
          <div className="onboarding-hero-badge">
            <span className="badge-dot" />
            <span>Fundação Soberana</span>
          </div>

          <div className="onboarding-hero-icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(212, 163, 115, 0.4)" strokeWidth="1.5" />
              <path d="M24 13V33M24 13C20.5 13 16 14.5 14 16V32C16 30.8 20.5 30 24 30M24 13C27.5 13 32 14.5 34 16V32C32 30.8 27.5 30 24 30M24 30V34" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h2 className="onboarding-hero-title">Educação com Raízes, Fé e Excelência.</h2>
          <p className="onboarding-hero-subtitle">
            O lar é a primeira e mais formativa escola. O Aletheia capacita os pais a liderarem com autoridade, clareza e fidelidade.
          </p>
        </div>

        <div className="onboarding-hero-quote-card">
          <p className="onboarding-hero-quote">
            “Instrui o menino no caminho em que deve andar, e até quando envelhecer não se desviará dele.”
          </p>
          <p className="onboarding-hero-author">Provérbios 22:6</p>
        </div>

        <div className="onboarding-hero-footer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Ambiente com isolamento por família e soberania total sobre seus registros educacionais.</span>
        </div>
      </aside>

      {/* Right Panel: Family Onboarding Form */}
      <section className="onboarding-main-panel">
        <div className="onboarding-card-wrapper onboarding-card">
          <div className="onboarding-step-indicator">
            <span>Passo 1 de 2</span>
            <span>•</span>
            <span>Núcleo Familiar</span>
          </div>

          <div className="onboarding-card-header onboarding-header">
            <h1>Bem-vindo ao Aletheia!</h1>
            <p>Vamos configurar o núcleo familiar soberano para sua jornada educacional.</p>
          </div>

          {errorMessage && (
            <div className="alert alert-error" data-testid="error-message" role="alert">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="onboarding-form" data-testid="family-onboarding-form">
            <div className="form-group">
              <label htmlFor="family-name">Nome da Família ou Núcleo</label>
              <input
                id="family-name"
                type="text"
                data-testid="family-name-input"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="Ex: Família Oliveira"
                required
                disabled={loading}
              />
              <span className="onboarding-field-hint">
                Identifica sua família em relatórios oficiais, históricos escolares e certificados.
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="country-code">País de Residência (ISO-3)</label>
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
                Define a jurisdição regulatória padrão para atendimento aos requisitos legais.
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="state-province">Estado / Província (Opcional)</label>
              <input
                id="state-province"
                type="text"
                data-testid="state-input"
                value={stateProvince}
                onChange={(e) => setStateProvince(e.target.value)}
                placeholder="Ex: SP"
                disabled={loading}
              />
              <span className="onboarding-field-hint">
                Utilizado para alinhar matrizes curriculares e legislações regionais.
              </span>
            </div>

            <button
              type="submit"
              data-testid="create-family-button"
              className="btn btn-primary onboarding-submit-btn"
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar e Começar'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
