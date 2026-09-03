'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { AletheiaIcon } from '@aletheia/ui';
import type {
  ChangeEmailDto,
  ChangePasswordDto,
  MfaConfirmDto,
  MfaDisableDto,
  MfaSetupRequestDto,
  MfaSetupResponseDto,
} from '@aletheia/contracts';
import { api } from '../../lib/api';

export interface AccountSecuritySettingsProps {
  currentEmail?: string | undefined;
  mfaEnabled?: boolean;
  onChangePassword: (data: ChangePasswordDto) => Promise<void>;
  onChangeEmail: (data: ChangeEmailDto) => Promise<void>;
  onMfaStateChanged?: () => Promise<void>;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-surface)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-light)',
  padding: '1.75rem',
  boxShadow: 'var(--shadow-sm)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '0.375rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-medium)',
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
  backgroundColor: 'var(--bg-surface)',
  boxSizing: 'border-box',
};

function SuccessAlert({ testId, message }: { testId: string; message: string }) {
  return (
    <div
      data-testid={testId}
      role="status"
      style={{
        padding: '0.75rem 1rem',
        backgroundColor: 'var(--color-emerald-50)',
        border: '1px solid var(--color-emerald-100)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-emerald-700)',
        fontSize: '0.875rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <AletheiaIcon name="check" size={16} />
      <span>{message}</span>
    </div>
  );
}

function ErrorAlert({ testId, message }: { testId: string; message: string }) {
  return (
    <div
      data-testid={testId}
      role="alert"
      style={{
        padding: '0.75rem 1rem',
        backgroundColor: 'var(--color-rose-50)',
        border: '1px solid var(--color-rose-100)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-rose-700)',
        fontSize: '0.875rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <AletheiaIcon name="alert-circle" size={16} />
      <span>{message}</span>
    </div>
  );
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

  // MFA (TOTP) state
  const [mfaSetupOpen, setMfaSetupOpen] = useState(false);
  const [setupPassword, setSetupPassword] = useState('');
  const [setupPasswordSaving, setSetupPasswordSaving] = useState(false);
  const [setupPasswordError, setSetupPasswordError] = useState<string | null>(null);
  const [setupData, setSetupData] = useState<MfaSetupResponseDto | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [confirmSaving, setConfirmSaving] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [mfaSuccess, setMfaSuccess] = useState<string | null>(null);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableSaving, setDisableSaving] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);

  useEffect(() => {
    if (!setupData?.otpauthUri) return;
    let cancelled = false;
    QRCode.toDataURL(
      setupData.otpauthUri,
      { width: 200, margin: 2, color: { dark: '#123F34', light: '#FFFFFF' } },
      (err: Error | null | undefined, url: string) => {
        if (!cancelled && !err && url) {
          setQrDataUrl(url);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [setupData?.otpauthUri]);

  const handleMfaSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupPasswordError(null);
    setMfaSuccess(null);

    if (!setupPassword) {
      setSetupPasswordError('Por favor, confirme sua senha atual.');
      return;
    }

    try {
      setSetupPasswordSaving(true);
      const body: MfaSetupRequestDto = { password: setupPassword };
      const res = await api.post<MfaSetupResponseDto>('/auth/mfa/setup', body);
      setSetupData(res);
      setSetupPassword('');
      setQrDataUrl(null);
    } catch (err) {
      setSetupPasswordError(err instanceof Error ? err.message : 'Falha ao iniciar a configuração.');
    } finally {
      setSetupPasswordSaving(false);
    }
  };

  const handleMfaConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmError(null);

    if (!confirmCode.trim()) {
      setConfirmError('Digite o código de 6 dígitos do aplicativo autenticador.');
      return;
    }

    try {
      setConfirmSaving(true);
      const body: MfaConfirmDto = { code: confirmCode };
      await api.post('/auth/mfa/confirm', body);
      await onMfaStateChanged();
      setMfaSuccess('Autenticação de dois fatores ativada com sucesso.');
      setSetupData(null);
      setQrDataUrl(null);
      setConfirmCode('');
      setMfaSetupOpen(false);
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Código inválido. Tente novamente.');
    } finally {
      setConfirmSaving(false);
    }
  };

  const handleMfaDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisableError(null);
    setMfaSuccess(null);

    if (!disablePassword) {
      setDisableError('Por favor, confirme sua senha atual.');
      return;
    }

    try {
      setDisableSaving(true);
      const body: MfaDisableDto = { password: disablePassword };
      await api.post('/auth/mfa/disable', body);
      await onMfaStateChanged();
      setMfaSuccess('Autenticação de dois fatores desativada.');
      setDisablePassword('');
    } catch (err) {
      setDisableError(err instanceof Error ? err.message : 'Falha ao desativar a autenticação de dois fatores.');
    } finally {
      setDisableSaving(false);
    }
  };

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

      {/* Authentication (two-factor) card */}
      <div data-testid="change-mfa-card" style={cardStyle}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Autenticação de Dois Fatores (2FA)
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Adicione uma segunda camada de segurança ao acessar sua conta com um aplicativo autenticador.
          </p>
        </div>

        {mfaSuccess && <SuccessAlert testId="mfa-success" message={mfaSuccess} />}

        {!mfaEnabled && !mfaSetupOpen && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                Estado: <span data-testid="mfa-status">Desativado</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                Recomendamos ativar para proteger seu acesso.
              </p>
            </div>
            <button
              type="button"
              data-testid="mfa-enable-button"
              onClick={() => setMfaSetupOpen(true)}
              style={{
                padding: '0.625rem 1.5rem',
                backgroundColor: 'var(--forest)',
                color: 'var(--text-inverse)',
                fontWeight: 600,
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Ativar 2FA
            </button>
          </div>
        )}

        {!mfaEnabled && mfaSetupOpen && !setupData && (
          <form data-testid="mfa-setup-password-form" onSubmit={handleMfaSetup}>
            {setupPasswordError && <ErrorAlert testId="mfa-setup-password-error" message={setupPasswordError} />}
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div>
                <label htmlFor="mfa-setup-password" style={labelStyle}>
                  Confirme sua senha atual
                </label>
                <input
                  id="mfa-setup-password"
                  type="password"
                  data-testid="mfa-setup-password-input"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  style={inputStyle}
                  disabled={setupPasswordSaving}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  data-testid="mfa-setup-cancel-button"
                  onClick={() => setMfaSetupOpen(false)}
                  style={{
                    padding: '0.625rem 1.5rem',
                    backgroundColor: 'transparent',
                    color: 'var(--forest)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--forest)',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  data-testid="mfa-setup-submit-button"
                  disabled={setupPasswordSaving}
                  style={{
                    padding: '0.625rem 1.5rem',
                    backgroundColor: setupPasswordSaving ? 'var(--text-muted)' : 'var(--forest)',
                    color: 'var(--text-inverse)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    cursor: setupPasswordSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {setupPasswordSaving ? 'Gerando...' : 'Continuar'}
                </button>
              </div>
            </div>
          </form>
        )}

        {!mfaEnabled && setupData && (
          <div data-testid="mfa-setup-qr-step" style={{ display: 'grid', gap: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                flexWrap: 'wrap',
                backgroundColor: '#fff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
              }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Código QR do autenticador"
                  data-testid="mfa-qr-image"
                  width={200}
                  height={200}
                />
              ) : (
                <div
                  data-testid="mfa-qr-placeholder"
                  style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Gerando QR...</span>
                </div>
              )}
              <div style={{ maxWidth: '340px' }}>
                <p style={{ fontWeight: 600, margin: '0 0 0.5rem 0' }}>
                  1. Escaneie o QR no seu aplicativo autenticador
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0' }}>
                  Use o Google Authenticator, Authy ou outro app compatível (TOTP) para adicionar
                  esta conta Aletheia.
                </p>
              </div>
            </div>

            <div>
              <p style={{ fontWeight: 600, margin: '0 0 0.5rem 0' }}>2. Códigos de recuperação</p>
              <div
                style={{
                  backgroundColor: 'var(--color-amber-50)',
                  border: '1px solid var(--color-amber-200)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  color: 'var(--color-amber-800)',
                  marginBottom: '0.75rem',
                }}
              >
                Salve estes códigos agora. Eles não serão exibidos novamente e servem para recuperar
                o acesso caso perca seu dispositivo.
              </div>
              <ul data-testid="mfa-recovery-codes" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {setupData.recoveryCodes.map((code: string) => (
                  <li
                    key={code}
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      letterSpacing: '0.05em',
                      padding: '0.375rem 0.5rem',
                      borderBottom: '1px solid var(--border-light)',
                      fontSize: '0.9375rem',
                    }}
                  >
                    {code}
                  </li>
                ))}
              </ul>
            </div>

            <form data-testid="mfa-confirm-form" onSubmit={handleMfaConfirm}>
              {confirmError && <ErrorAlert testId="mfa-confirm-error" message={confirmError} />}
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                <div>
                  <label htmlFor="mfa-confirm-code" style={labelStyle}>
                    3. Digite o código de 6 dígitos exibido pelo aplicativo
                  </label>
                  <input
                    id="mfa-confirm-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    data-testid="mfa-confirm-code-input"
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value)}
                    style={inputStyle}
                    disabled={confirmSaving}
                    placeholder="000000"
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    type="button"
                    data-testid="mfa-confirm-cancel-button"
                    onClick={() => {
                      setSetupData(null);
                      setQrDataUrl(null);
                      setConfirmCode('');
                    }}
                    style={{
                      padding: '0.625rem 1.5rem',
                      backgroundColor: 'transparent',
                      color: 'var(--forest)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--forest)',
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    data-testid="mfa-confirm-button"
                    disabled={confirmSaving}
                    style={{
                      padding: '0.625rem 1.5rem',
                      backgroundColor: confirmSaving ? 'var(--text-muted)' : 'var(--forest)',
                      color: 'var(--text-inverse)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      cursor: confirmSaving ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {confirmSaving ? 'Confirmando...' : 'Ativar 2FA'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {mfaEnabled && (
          <form data-testid="mfa-disable-form" onSubmit={handleMfaDisable}>
            {disableError && <ErrorAlert testId="mfa-disable-error" message={disableError} />}
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    Estado: <span data-testid="mfa-status">Ativo</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                    Sua conta exige um código de autenticação a cada novo login.
                  </p>
                </div>
              </div>
              <div>
                <label htmlFor="mfa-disable-password" style={labelStyle}>
                  Confirme sua senha atual para desativar
                </label>
                <input
                  id="mfa-disable-password"
                  type="password"
                  data-testid="mfa-disable-password-input"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  style={inputStyle}
                  disabled={disableSaving}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  data-testid="mfa-disable-button"
                  disabled={disableSaving}
                  style={{
                    padding: '0.625rem 1.5rem',
                    backgroundColor: disableSaving ? 'var(--text-muted)' : 'var(--color-rose-600)',
                    color: 'var(--text-inverse)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    cursor: disableSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {disableSaving ? 'Desativando...' : 'Desativar 2FA'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
