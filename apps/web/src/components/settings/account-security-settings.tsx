'use client';

import React, { useState } from 'react';
import type { ChangeEmailDto, ChangePasswordDto } from '@aletheia/contracts';
import { MfaSettingsCard } from './mfa-settings-card';
import { cardStyle, labelStyle, inputStyle, SuccessAlert, ErrorAlert } from './settings-form-kit';

export interface AccountSecuritySettingsProps {
  currentEmail?: string | undefined;
  mfaEnabled?: boolean;
  onChangePassword: (data: ChangePasswordDto) => Promise<void>;
  onChangeEmail: (data: ChangeEmailDto) => Promise<void>;
  onMfaStateChanged?: () => Promise<void>;
}

export function AccountSecuritySettings({
  currentEmail,
  mfaEnabled = false,
  onChangePassword,
  onChangeEmail,
  onMfaStateChanged = async () => undefined,
}: AccountSecuritySettingsProps) {
  const [currentPasswordForPw, setCurrentPasswordForPw] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSuccess(null);
    setPwError(null);

    if (!currentPasswordForPw || !newPassword) {
      setPwError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('A nova senha deve conter no mínimo 8 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwError('As senhas não conferem.');
      return;
    }

    try {
      setPwSaving(true);
      await onChangePassword({ currentPassword: currentPasswordForPw, newPassword });
      setPwSuccess('Senha alterada com sucesso. Outras sessões abertas foram encerradas.');
      setCurrentPasswordForPw('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Falha ao alterar a senha.');
    } finally {
      setPwSaving(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSuccess(null);
    setEmailError(null);

    if (!currentPasswordForEmail || !newEmail) {
      setEmailError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setEmailSaving(true);
      await onChangeEmail({ currentPassword: currentPasswordForEmail, newEmail });
      setEmailSuccess('E-mail alterado com sucesso. Enviamos um novo link de verificação para o novo endereço.');
      setCurrentPasswordForEmail('');
      setNewEmail('');
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Falha ao alterar o e-mail.');
    } finally {
      setEmailSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div data-testid="change-password-card" style={cardStyle}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Alterar Senha
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Alterar a senha encerra todas as outras sessões abertas da sua conta.
          </p>
        </div>

        {pwSuccess && <SuccessAlert testId="change-password-success" message={pwSuccess} />}
        {pwError && <ErrorAlert testId="change-password-error" message={pwError} />}

        <form data-testid="change-password-form" onSubmit={handleChangePassword}>
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div>
              <label htmlFor="current-password-for-pw" style={labelStyle}>
                Senha atual
              </label>
              <input
                id="current-password-for-pw"
                type="password"
                data-testid="current-password-for-pw-input"
                value={currentPasswordForPw}
                onChange={(e) => setCurrentPasswordForPw(e.target.value)}
                style={inputStyle}
                disabled={pwSaving}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label htmlFor="new-password" style={labelStyle}>
                  Nova senha (mínimo 8 caracteres)
                </label>
                <input
                  id="new-password"
                  type="password"
                  data-testid="new-password-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={inputStyle}
                  disabled={pwSaving}
                />
              </div>
              <div>
                <label htmlFor="confirm-new-password" style={labelStyle}>
                  Confirmar nova senha
                </label>
                <input
                  id="confirm-new-password"
                  type="password"
                  data-testid="confirm-new-password-input"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  style={inputStyle}
                  disabled={pwSaving}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                data-testid="change-password-button"
                disabled={pwSaving}
                style={{
                  padding: '0.625rem 1.5rem',
                  backgroundColor: pwSaving ? 'var(--text-muted)' : 'var(--forest)',
                  color: 'var(--text-inverse)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: pwSaving ? 'not-allowed' : 'pointer',
                }}
              >
                {pwSaving ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div data-testid="change-email-card" style={cardStyle}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Alterar E-mail
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            {currentEmail ? `E-mail atual: ${currentEmail}. ` : ''}
            O novo e-mail precisará ser verificado antes de ser considerado confirmado.
          </p>
        </div>

        {emailSuccess && <SuccessAlert testId="change-email-success" message={emailSuccess} />}
        {emailError && <ErrorAlert testId="change-email-error" message={emailError} />}

        <form data-testid="change-email-form" onSubmit={handleChangeEmail}>
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div>
              <label htmlFor="current-password-for-email" style={labelStyle}>
                Senha atual
              </label>
              <input
                id="current-password-for-email"
                type="password"
                data-testid="current-password-for-email-input"
                value={currentPasswordForEmail}
                onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                style={inputStyle}
                disabled={emailSaving}
              />
            </div>

            <div>
              <label htmlFor="new-email" style={labelStyle}>
                Novo e-mail
              </label>
              <input
                id="new-email"
                type="email"
                data-testid="new-email-input"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                style={inputStyle}
                disabled={emailSaving}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                data-testid="change-email-button"
                disabled={emailSaving}
                style={{
                  padding: '0.625rem 1.5rem',
                  backgroundColor: emailSaving ? 'var(--text-muted)' : 'var(--forest)',
                  color: 'var(--text-inverse)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: emailSaving ? 'not-allowed' : 'pointer',
                }}
              >
                {emailSaving ? 'Alterando...' : 'Alterar E-mail'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <MfaSettingsCard mfaEnabled={mfaEnabled} onMfaStateChanged={onMfaStateChanged} />
    </div>
  );
}
