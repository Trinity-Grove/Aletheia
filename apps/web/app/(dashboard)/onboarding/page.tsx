'use client';

import React, { useState } from 'react';

export default function OnboardingPage() {
  const [familyName, setFamilyName] = useState('');
  const [countryCode, setCountryCode] = useState('BRA');
  const [stateProvince, setStateProvince] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) return;
    setSubmitted(true);
  };

  return (
    <main className="onboarding-container" data-testid="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h1>Bem-vindo ao Aletheia!</h1>
          <p>Vamos configurar o núcleo familiar soberano para sua jornada educacional.</p>
        </div>

        {submitted ? (
          <div className="alert alert-success" data-testid="success-message">
            <h2>Família criada com sucesso!</h2>
            <p>Seu núcleo familiar <strong>{familyName}</strong> está pronto para iniciar.</p>
          </div>
        ) : (
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
              />
            </div>

            <div className="form-group">
              <label htmlFor="country-code">País de Residência (ISO-3)</label>
              <select
                id="country-code"
                data-testid="country-select"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
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
              />
            </div>

            <button
              type="submit"
              data-testid="create-family-button"
              className="btn btn-primary"
            >
              Criar e Começar
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
