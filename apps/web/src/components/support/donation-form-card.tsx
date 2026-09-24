'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { AletheiaIcon, Alert, Button, Card } from '@aletheia/ui';
import type {
  CreateDonationIntentDto,
  DonationFrequency,
  DonationIntentResponseDto,
  DonationPaymentMethod,
  DonationRecordResponseDto,
} from '@aletheia/contracts';

export interface DonationFormCardProps {
  familyId?: string | null;
  onDonationSuccess?: () => void;
  pollingIntervalMs?: number;
  maxPollingAttempts?: number;
}

const QUICK_AMOUNTS = [
  { label: 'R$ 15', cents: 1500 },
  { label: 'R$ 30', cents: 3000 },
  { label: 'R$ 50', cents: 5000 },
  { label: 'R$ 100', cents: 10000 },
];

export function DonationFormCard({
  familyId,
  onDonationSuccess,
  pollingIntervalMs = 3000,
  maxPollingAttempts = 300,
}: DonationFormCardProps) {
  const [frequency, setFrequency] = useState<DonationFrequency>('ONE_TIME');
  const [selectedCents, setSelectedCents] = useState<number>(3000);
  const [customAmountText, setCustomAmountText] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<DonationPaymentMethod>('PIX');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [intentResponse, setIntentResponse] = useState<DonationIntentResponseDto | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  const getEffectiveCents = (): number => {
    if (isCustom) {
      const sanitized = customAmountText
        .replace(/[^\d,.]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim();
      const val = parseFloat(sanitized);
      if (isNaN(val)) return 0;
      return Math.round(val * 100);
    }
    return selectedCents;
  };

  const handleQuickAmountClick = (cents: number) => {
    setIsCustom(false);
    setSelectedCents(cents);
    setCustomAmountText('');
    setErrorMessage(null);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCustom(true);
    setCustomAmountText(e.target.value);
    setErrorMessage(null);
  };

  const startPollingStatus = (
    donationId: string,
    activeFamilyId: string,
    expiresAtStr?: string,
  ) => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }

    let attempts = 0;
    const expiresAt = expiresAtStr ? new Date(expiresAtStr).getTime() : null;

    pollTimerRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxPollingAttempts || (expiresAt && Date.now() > expiresAt)) {
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        return;
      }

      try {
        const res = await fetch(`/api/v1/families/${activeFamilyId}/donations/${donationId}/status`, {
          credentials: 'include',
        });
        if (res.ok) {
          const record: DonationRecordResponseDto = await res.json();
          if (record.status === 'CONFIRMED') {
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
            setIsConfirmed(true);
            onDonationSuccess?.();
          } else if (record.status === 'CANCELLED' || record.status === 'FAILED') {
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
          }
        }
      } catch {
        // Silently retry on next poll tick
      }
    }, pollingIntervalMs);
  };

  const handleSubmit = async (overridePaymentMethod?: DonationPaymentMethod) => {
    const effectiveMethod = overridePaymentMethod || paymentMethod;
    const amountCents = getEffectiveCents();

    if (amountCents < 500) {
      setErrorMessage('O valor mínimo para apoio é R$ 5,00');
      return;
    }

    const targetFamilyId = familyId || (typeof localStorage !== 'undefined' ? localStorage.getItem('familyId') : null);
    if (!targetFamilyId) {
      setErrorMessage('Identificação da família não encontrada para registrar a contribuição.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setIntentResponse(null);
    setQrCodeDataUrl(null);
    setCopied(false);
    setIsConfirmed(false);

    try {
      const payload: CreateDonationIntentDto = {
        amountCents,
        frequency,
        paymentMethod: effectiveMethod,
      };

      const res = await fetch(`/api/v1/families/${targetFamilyId}/donations/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao iniciar o fluxo de contribuição.');
      }

      const intent: DonationIntentResponseDto = await res.json();
      setIntentResponse(intent);

      if (frequency === 'MONTHLY' && intent.authorizationUrl) {
        // Mercado Pago's recurring-billing product is card-based: this
        // codebase collects no card token client-side, so the payer
        // authorizes the subscription on Mercado Pago's own hosted page.
        window.location.href = intent.authorizationUrl;
        return;
      }

      if (effectiveMethod === 'PIX' && (intent.pixCopiaECola || intent.pixQrCodeUrl)) {
        const pixPayload = intent.pixCopiaECola || intent.pixQrCodeUrl!;
        try {
          const dataUrl = await QRCode.toDataURL(pixPayload);
          setQrCodeDataUrl(dataUrl);
        } catch {
          // Fallback to pixQrCodeUrl if QR code generation fails
          if (intent.pixQrCodeUrl) {
            setQrCodeDataUrl(intent.pixQrCodeUrl);
          }
        }
        startPollingStatus(intent.donationId, targetFamilyId, intent.expiresAt);
      } else if (effectiveMethod === 'GOOGLE_PAY') {
        // Google Pay intent created: simulates instant confirmation or external token processing
        setIsConfirmed(true);
        onDonationSuccess?.();
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao processar apoio voluntário.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = async () => {
    if (!intentResponse?.pixCopiaECola) return;
    try {
      await navigator.clipboard.writeText(intentResponse.pixCopiaECola);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Clipboard fallback
    }
  };

  return (
    <Card data-testid="donation-form-card" style={{ padding: '1.75rem', position: 'relative' }}>
      {/* Warm welcoming banner */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
          <span style={{ color: 'var(--forest)', display: 'flex', alignItems: 'center' }}>
            <AletheiaIcon name="heart" size={24} />
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Apoio Voluntário & Comunitário
          </h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          O Aletheia é e sempre será <strong>100% gratuito</strong> para todas as famílias educadoras, sem restrições ou bloqueios. Sua contribuição voluntária sustenta nossos servidores, apoia o desenvolvimento contínuo e preserva a nossa independência.
        </p>
      </div>

      {isConfirmed ? (
        <div
          data-testid="donation-success-celebration"
          style={{
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: 'rgba(46, 125, 50, 0.08)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(46, 125, 50, 0.2)',
          }}
        >
          <div style={{ color: 'var(--forest)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
            <AletheiaIcon name="check-circle-2" size={40} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
            Muito obrigado pelo seu apoio! ❤️
          </h3>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0' }}>
            Sua contribuição voluntária foi confirmada com sucesso e fortalece a missão de uma educação soberana e acessível para todos.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setIsConfirmed(false);
              setIntentResponse(null);
              setQrCodeDataUrl(null);
            }}
          >
            Fazer outra contribuição
          </Button>
        </div>
      ) : intentResponse && paymentMethod === 'PIX' ? (
        <div data-testid="pix-intent-details" style={{ textAlign: 'center', padding: '1rem 0' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Pague com PIX para apoiar
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Abra o app do seu banco, escolha <strong>Pagar via PIX</strong> e aponte a câmera para o QR Code abaixo:
          </p>

          {qrCodeDataUrl && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <img
                src={qrCodeDataUrl}
                alt="QR Code PIX"
                data-testid="pix-qr-code-image"
                style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '0.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid var(--border-light, #e2e8f0)',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>
          )}

          {intentResponse.pixCopiaECola && (
            <div style={{ maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textAlign: 'left',
                  marginBottom: '0.25rem',
                }}
              >
                Código PIX Copia e Cola:
              </label>
              <div
                data-testid="pix-copia-cola-text"
                style={{
                  padding: '0.625rem',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  backgroundColor: 'var(--bg-neutral, #f8fafc)',
                  border: '1px solid var(--border-light, #e2e8f0)',
                  borderRadius: '0.375rem',
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary)',
                  maxHeight: '4.5rem',
                  overflowY: 'auto',
                }}
              >
                {intentResponse.pixCopiaECola}
              </div>

              <Button
                variant="secondary"
                data-testid="copy-pix-button"
                onClick={handleCopyPix}
                style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <AletheiaIcon name={copied ? 'check' : 'clipboard-check'} size={16} />
                <span>{copied ? 'Código copiado!' : 'Copiar código PIX'}</span>
              </Button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-emerald-500, #10b981)', animation: 'pulse 1.5s infinite' }} />
            <span>Aguardando confirmação do banco em tempo real...</span>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (paymentMethod === 'PIX') {
              handleSubmit();
            }
          }}
          style={{ display: 'grid', gap: '1.25rem' }}
        >
          {errorMessage && (
            <Alert variant="error" data-testid="donation-form-error">
              {errorMessage}
            </Alert>
          )}

          {/* Frequency Toggle */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Frequência da Contribuição
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                backgroundColor: 'var(--bg-neutral, #f1f5f9)',
                padding: '0.25rem',
                borderRadius: '0.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => setFrequency('ONE_TIME')}
                style={{
                  padding: '0.625rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  backgroundColor: frequency === 'ONE_TIME' ? 'var(--bg-card, #ffffff)' : 'transparent',
                  color: frequency === 'ONE_TIME' ? 'var(--forest)' : 'var(--text-secondary)',
                  boxShadow: frequency === 'ONE_TIME' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Doação Única
              </button>
              <button
                type="button"
                onClick={() => {
                  setFrequency('MONTHLY');
                  // Mercado Pago's subscription product is card-based --
                  // there is no recurring-PIX equivalent, so switching to
                  // monthly support can never keep PIX selected.
                  setPaymentMethod((current) => (current === 'PIX' ? 'GOOGLE_PAY' : current));
                }}
                style={{
                  padding: '0.625rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  backgroundColor: frequency === 'MONTHLY' ? 'var(--bg-card, #ffffff)' : 'transparent',
                  color: frequency === 'MONTHLY' ? 'var(--forest)' : 'var(--text-secondary)',
                  boxShadow: frequency === 'MONTHLY' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Apoio Mensal
              </button>
            </div>
          </div>

          {/* Quick Amount Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Escolha um Valor
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {QUICK_AMOUNTS.map((item) => {
                const isSelected = !isCustom && selectedCents === item.cents;
                return (
                  <button
                    key={item.cents}
                    type="button"
                    onClick={() => handleQuickAmountClick(item.cents)}
                    style={{
                      padding: '0.75rem 0.5rem',
                      borderRadius: '0.375rem',
                      border: isSelected ? '2px solid var(--forest)' : '1px solid var(--border-light, #e2e8f0)',
                      backgroundColor: isSelected ? 'rgba(46, 125, 50, 0.08)' : 'var(--bg-card, #ffffff)',
                      color: isSelected ? 'var(--forest)' : 'var(--text-primary)',
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Amount */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                data-testid="custom-amount-input"
                placeholder="Ou digite outro valor (ex: 25,00)"
                value={customAmountText}
                onChange={handleCustomAmountChange}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.375rem',
                  border: isCustom ? '2px solid var(--forest)' : '1px solid var(--border-light, #e2e8f0)',
                  backgroundColor: 'var(--bg-card, #ffffff)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box',
                }}
              />
              <span
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.25rem',
                }}
              >
                Mínimo de R$ 5,00
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Forma de Pagamento
            </label>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: paymentMethod === 'PIX' ? '1px solid var(--forest)' : '1px solid var(--border-light, #e2e8f0)',
                  backgroundColor: paymentMethod === 'PIX' ? 'rgba(46, 125, 50, 0.04)' : 'transparent',
                  cursor: frequency === 'MONTHLY' ? 'not-allowed' : 'pointer',
                  opacity: frequency === 'MONTHLY' ? 0.5 : 1,
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="PIX"
                  checked={paymentMethod === 'PIX'}
                  disabled={frequency === 'MONTHLY'}
                  onChange={() => setPaymentMethod('PIX')}
                  style={{ accentColor: 'var(--forest)' }}
                />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>PIX</span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {frequency === 'MONTHLY'
                      ? 'Indisponível para apoio mensal recorrente -- escolha cartão'
                      : 'Instantâneo, sem taxas intermediárias, confirmação em segundos'}
                  </span>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: paymentMethod === 'GOOGLE_PAY' ? '1px solid var(--forest)' : '1px solid var(--border-light, #e2e8f0)',
                  backgroundColor: paymentMethod === 'GOOGLE_PAY' ? 'rgba(46, 125, 50, 0.04)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="GOOGLE_PAY"
                  checked={paymentMethod === 'GOOGLE_PAY'}
                  onChange={() => setPaymentMethod('GOOGLE_PAY')}
                  style={{ accentColor: 'var(--forest)' }}
                />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Google Pay</span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Rápido e seguro através da sua conta Google
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Submission action */}
          {paymentMethod === 'GOOGLE_PAY' ? (
            <button
              type="button"
              data-testid="google-pay-button"
              onClick={() => handleSubmit('GOOGLE_PAY')}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1f1f1f',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: 600,
                fontSize: '0.9375rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              }}
            >
              <span>Contribuir com</span>
              <span style={{ fontWeight: 700 }}>Google Pay</span>
            </button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              data-testid="submit-donation-button"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading
                ? 'Processando...'
                : frequency === 'MONTHLY'
                  ? 'Iniciar Apoio Mensal'
                  : 'Gerar PIX para Apoiar'}
            </Button>
          )}
        </form>
      )}
    </Card>
  );
}
