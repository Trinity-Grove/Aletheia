'use client';

import React, { useState } from 'react';

export interface MfaVerifyFormProps {
  onSubmit?: (_data: { code: string }) => Promise<void> | void;
}

export function MfaVerifyForm({ onSubmit }: MfaVerifyFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('Por favor, informe o código de autenticação ou recuperação.');
      return;
    }

    try {
      setLoading(true);
      if (onSubmit) {
        await onSubmit({ code });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Código inválido. Tente novamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form" data-testid="mfa-verify-form">
      {error && (
        <div className="alert alert-error" data-testid="mfa-verify-error" role="alert">
          {error}
        </div>
      )}

      <p
        className="auth-header-text"
        style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: '0 0 0.5rem' }}
      >
        Digite o código de 6 dígitos do seu aplicativo autenticador, ou um dos seus códigos de
        recuperação.
      </p>

      <div className="form-group">
        <label htmlFor="mfa-code">Código</label>
        <input
          id="mfa-code"
          type="text"
          inputMode="text"
          autoComplete="one-time-code"
          data-testid="mfa-code-input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="000000"
          required
        />
      </div>

      <button
        type="submit"
        data-testid="mfa-verify-button"
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Verificando...' : 'Verificar'}
      </button>
    </form>
  );
}
