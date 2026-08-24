'use client';

import React, { useState } from 'react';

export interface RegisterFormProps {
  onSubmit?: (_data: { fullName: string; email: string; password: string }) => Promise<void> | void;
}

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve conter no mínimo 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    try {
      setLoading(true);
      if (onSubmit) {
        await onSubmit({ fullName, email, password });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao cadastrar. Tente novamente mais tarde.';
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
        <label htmlFor="reg-name">Nome Completo</label>
        <input
          id="reg-name"
          type="text"
          data-testid="reg-name-input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ex: João da Silva"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="reg-email">E-mail</label>
        <input
          id="reg-email"
          type="email"
          data-testid="reg-email-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu.email@exemplo.com"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="reg-password">Senha (mínimo 8 caracteres)</label>
        <input
          id="reg-password"
          type="password"
          data-testid="reg-password-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="reg-confirm">Confirmar Senha</label>
        <input
          id="reg-confirm"
          type="password"
          data-testid="reg-confirm-password-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      <button
        type="submit"
        data-testid="register-button"
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Cadastrando...' : 'Criar Conta de Guardião'}
      </button>
    </form>
  );
}
