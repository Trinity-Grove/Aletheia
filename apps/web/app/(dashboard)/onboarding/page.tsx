'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FamilyResponseDto } from '@aletheia/contracts';
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
    <main className="onboarding-container" data-testid="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-header">
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
              <option value="BRA">Brasil (BRA)</option>
              <option value="USA">Estados Unidos (USA)</option>
              <option value="PRT">Portugal (PRT)</option>
              <option value="ESP">Espanha (ESP)</option>
            </select>
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
          </div>

          <button
            type="submit"
            data-testid="create-family-button"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Criar e Começar'}
          </button>
        </form>
      </div>
    </main>
  );
}
