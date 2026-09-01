'use client';

import React, { useState } from 'react';

export interface ResetPasswordFormProps {
  token: string | null;
  onSubmit?: (_data: { token: string; newPassword: string }) => Promise<void> | void;
}

export function ResetPasswordForm({ token, onSubmit }: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!token) {
    return (
      <div className="alert alert-error" data-testid="reset-password-invalid-link" role="alert">
        Este link de redefinição de senha é inválido. Solicite um novo link.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (newPassword.length < 8) {
      setError('A senha deve conter no mínimo 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    try {
      setLoading(true);
      if (onSubmit) {
        await onSubmit({ token, newPassword });
      }
      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao redefinir a senha. O link pode ter expirado.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-form" data-testid="reset-password-success">
        <p>Sua senha foi redefinida. Você já pode entrar com a nova senha.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form" data-testid="reset-password-form">
      {error && (
        <div className="alert alert-error" data-testid="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="reset-password-new">Nova senha (mínimo 8 caracteres)</label>
        <input
          id="reset-password-new"
          type="password"
          data-testid="reset-password-new-input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="reset-password-confirm">Confirmar nova senha</label>
        <input
          id="reset-password-confirm"
          type="password"
          data-testid="reset-password-confirm-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      <button
        type="submit"
        data-testid="reset-password-button"
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Redefinindo...' : 'Redefinir senha'}
      </button>
    </form>
  );
}
