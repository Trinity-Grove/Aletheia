'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AletheiaIcon, Alert, Badge, Button, Card, Modal } from '@aletheia/ui';
import type {
  DonationRecordResponseDto,
  SupporterSubscriptionResponseDto,
} from '@aletheia/contracts';

export interface SupporterSettingsCardProps {
  familyId?: string | null;
}

export function SupporterSettingsCard({ familyId }: SupporterSettingsCardProps) {
  const [history, setHistory] = useState<DonationRecordResponseDto[]>([]);
  const [subscriptions, setSubscriptions] = useState<SupporterSubscriptionResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [subToCancel, setSubToCancel] = useState<SupporterSubscriptionResponseDto | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);

  const activeFamilyId = familyId || (typeof localStorage !== 'undefined' ? localStorage.getItem('familyId') : null);

  const loadData = useCallback(async () => {
    if (!activeFamilyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [historyRes, subsRes] = await Promise.all([
        fetch(`/api/v1/families/${activeFamilyId}/donations/history`, { credentials: 'include' }),
        fetch(`/api/v1/families/${activeFamilyId}/donations/subscriptions`, { credentials: 'include' }),
      ]);

      if (historyRes.ok) {
        const histData = await historyRes.json();
        setHistory(Array.isArray(histData) ? histData : []);
      }

      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubscriptions(Array.isArray(subsData) ? subsData : []);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Falha ao carregar informações de apoio.');
    } finally {
      setLoading(false);
    }
  }, [activeFamilyId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activeSubscription = subscriptions.find(
    (s) => (s.status === 'CONFIRMED' || s.status === 'PENDING') && !s.cancelledAt,
  );

  const hasConfirmedDonations = history.some((h) => h.status === 'CONFIRMED');

  const handleConfirmCancel = async () => {
    if (!activeSubscription || !activeFamilyId) return;

    setCancelling(true);
    try {
      const res = await fetch(
        `/api/v1/families/${activeFamilyId}/donations/subscriptions/${activeSubscription.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Falha ao cancelar apoio mensal.');
      }

      setSubToCancel(null);
      await loadData();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Falha ao cancelar apoio mensal.');
    } finally {
      setCancelling(false);
    }
  };

  const formatCurrencyValue = (cents: number): string => {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDateValue = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card data-testid="supporter-settings-card" style={{ padding: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
            <span style={{ color: 'var(--forest)', display: 'flex', alignItems: 'center' }}>
              <AletheiaIcon name="heart" size={22} />
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Apoio Comunitário & Mecenato
            </h2>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            Gerencie sua contribuição voluntária para manter o Aletheia soberano, livre e gratuito.
          </p>
        </div>

        <Link
          href="/support"
          data-testid="support-page-link"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            backgroundColor: 'var(--forest)',
            color: '#ffffff',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          <AletheiaIcon name="heart" size={16} />
          <span>Fazer uma Contribuição</span>
        </Link>
      </div>

      {errorMessage && (
        <Alert variant="error" style={{ marginBottom: '1.25rem' }}>
          {errorMessage}
        </Alert>
      )}

      {/* Status Card */}
      <div
        style={{
          padding: '1.25rem',
          borderRadius: '0.5rem',
          backgroundColor: activeSubscription
            ? 'rgba(46, 125, 50, 0.08)'
            : 'var(--bg-neutral, #f8fafc)',
          border: '1px solid',
          borderColor: activeSubscription
            ? 'rgba(46, 125, 50, 0.25)'
            : 'var(--border-light, #e2e8f0)',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status Atual:</span>
              {activeSubscription ? (
                <Badge variant="emerald">Apoiador Mensal Ativo</Badge>
              ) : hasConfirmedDonations ? (
                <Badge variant="slate">Apoiador da Comunidade</Badge>
              ) : (
                <Badge variant="slate">Sem apoio recorrente ativo</Badge>
              )}
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
              {activeSubscription
                ? `Apoio mensal recorrente de ${formatCurrencyValue(activeSubscription.amountCents)}.`
                : 'O Aletheia é 100% livre e sem paywalls. Qualquer família pode contribuir voluntariamente quando desejar.'}
            </p>
          </div>

          {activeSubscription && (
            <Button
              variant="ghost"
              data-testid="settings-cancel-subscription-button"
              onClick={() => setSubToCancel(activeSubscription)}
              style={{ color: 'var(--color-error, #dc2626)', fontSize: '0.8125rem' }}
            >
              Cancelar Apoio Mensal
            </Button>
          )}
        </div>
      </div>

      {/* Recent Receipts Summary */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
          Recibos Recentes
        </h3>

        {loading ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Carregando recibos...</p>
        ) : history.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Nenhum recibo registrado ainda.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {history.slice(0, 5).map((record) => (
              <div
                key={record.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-light, #f1f5f9)',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {formatCurrencyValue(record.amountCents)}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    ({record.frequency === 'MONTHLY' ? 'Mensal' : 'Única'})
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {formatDateValue(record.createdAt)}
                  </span>
                </div>
                <Badge variant={record.status === 'CONFIRMED' ? 'emerald' : 'slate'}>
                  {record.status === 'CONFIRMED' ? 'Confirmado' : record.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      {subToCancel && (
        <Modal
          isOpen={!!subToCancel}
          onClose={() => setSubToCancel(null)}
          title="Cancelar Apoio Mensal?"
        >
          <div style={{ display: 'grid', gap: '1rem', padding: '0.5rem 0' }}>
            <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              Tem certeza de que deseja cancelar sua contribuição voluntária mensal de{' '}
              <strong>{formatCurrencyValue(subToCancel.amountCents)}</strong>?
            </p>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Lembrando que o Aletheia continuará 100% gratuito e com todas as ferramentas liberadas para a sua família. Nenhuma função é restrita ao cancelar.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setSubToCancel(null)} disabled={cancelling}>
                Manter Apoio
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                style={{ backgroundColor: 'var(--color-error, #dc2626)', borderColor: 'var(--color-error, #dc2626)' }}
              >
                {cancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
}
