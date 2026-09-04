'use client';

import React, { useState } from 'react';
import { Button, Card, Input } from '@aletheia/ui';
import type { ChangeEmailDto, ChangePasswordDto } from '@aletheia/contracts';
import { MfaSettingsCard } from './mfa-settings-card';
import { SuccessAlert, ErrorAlert } from './settings-form-kit';

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
      <Card data-testid="change-password-card" style={{ padding: '1.75rem' }}>
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
            <Input
              label="Senha atual"
              type="password"
              data-testid="current-password-for-pw-input"
              value={currentPasswordForPw}
              onChange={(e) => setCurrentPasswordForPw(e.target.value)}
              disabled={pwSaving}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <Input
                label="Nova senha (mínimo 8 caracteres)"
                type="password"
                data-testid="new-password-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={pwSaving}
              />
              <Input
                label="Confirmar nova senha"
                type="password"
                data-testid="confirm-new-password-input"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={pwSaving}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" data-testid="change-password-button" isLoading={pwSaving}>
                Alterar Senha
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <Card data-testid="change-email-card" style={{ padding: '1.75rem' }}>
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
            <Input
              label="Senha atual"
              type="password"
              data-testid="current-password-for-email-input"
              value={currentPasswordForEmail}
              onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
              disabled={emailSaving}
            />

            <Input
              label="Novo e-mail"
              type="email"
              data-testid="new-email-input"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={emailSaving}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" data-testid="change-email-button" isLoading={emailSaving}>
                Alterar E-mail
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <MfaSettingsCard mfaEnabled={mfaEnabled} onMfaStateChanged={onMfaStateChanged} />
    </div>
  );
}
