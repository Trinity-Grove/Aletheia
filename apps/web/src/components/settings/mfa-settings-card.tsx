'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button, Card, Input } from '@aletheia/ui';
import type {
  MfaConfirmDto,
  MfaDisableDto,
  MfaSetupRequestDto,
  MfaSetupResponseDto,
} from '@aletheia/contracts';
import { api } from '../../lib/api';
import { SuccessAlert, ErrorAlert } from './settings-form-kit';

export interface MfaSettingsCardProps {
  mfaEnabled?: boolean;
  onMfaStateChanged?: () => Promise<void>;
}

export function MfaSettingsCard({
  mfaEnabled = false,
  onMfaStateChanged = async () => undefined,
}: MfaSettingsCardProps) {
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

  return (
    <Card data-testid="change-mfa-card" style={{ padding: '1.75rem' }}>
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
          <Button data-testid="mfa-enable-button" onClick={() => setMfaSetupOpen(true)}>
            Ativar 2FA
          </Button>
        </div>
      )}

      {!mfaEnabled && mfaSetupOpen && !setupData && (
        <form data-testid="mfa-setup-password-form" onSubmit={handleMfaSetup}>
          {setupPasswordError && <ErrorAlert testId="mfa-setup-password-error" message={setupPasswordError} />}
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <Input
              label="Confirme sua senha atual"
              type="password"
              data-testid="mfa-setup-password-input"
              value={setupPassword}
              onChange={(e) => setSetupPassword(e.target.value)}
              disabled={setupPasswordSaving}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button
                type="button"
                variant="secondary"
                data-testid="mfa-setup-cancel-button"
                onClick={() => setMfaSetupOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" data-testid="mfa-setup-submit-button" isLoading={setupPasswordSaving}>
                Continuar
              </Button>
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
              <Input
                label="3. Digite o código de 6 dígitos exibido pelo aplicativo"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                data-testid="mfa-confirm-code-input"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                disabled={confirmSaving}
                placeholder="000000"
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button
                  type="button"
                  variant="secondary"
                  data-testid="mfa-confirm-cancel-button"
                  onClick={() => {
                    setSetupData(null);
                    setQrDataUrl(null);
                    setConfirmCode('');
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" data-testid="mfa-confirm-button" isLoading={confirmSaving}>
                  Ativar 2FA
                </Button>
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
            <Input
              label="Confirme sua senha atual para desativar"
              type="password"
              data-testid="mfa-disable-password-input"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              disabled={disableSaving}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="danger" data-testid="mfa-disable-button" isLoading={disableSaving}>
                Desativar 2FA
              </Button>
            </div>
          </div>
        </form>
      )}
    </Card>
  );
}
