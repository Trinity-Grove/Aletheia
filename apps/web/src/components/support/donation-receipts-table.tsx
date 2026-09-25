'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AletheiaIcon, Alert, Badge, Button, Card, Modal } from '@aletheia/ui';
import type {
  DonationRecordResponseDto,
  SupporterSubscriptionResponseDto,
} from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

export interface DonationReceiptsTableProps {
  familyId?: string | null;
}

export function DonationReceiptsTable({ familyId }: DonationReceiptsTableProps) {
  const { t, formatDate, formatCurrency } = useLocale();
  const [history, setHistory] = useState<DonationRecordResponseDto[]>([]);
  const [subscriptions, setSubscriptions] = useState<SupporterSubscriptionResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cancellation state
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
      setErrorMessage(err instanceof Error ? err.message : t('support.loadHistoryError'));
    } finally {
      setLoading(false);
    }
  }, [activeFamilyId, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activeSubscription = subscriptions.find(
    (s) => (s.status === 'CONFIRMED' || s.status === 'PENDING') && !s.cancelledAt,
  );

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
        throw new Error(errData.message || t('support.cancelSubscriptionError'));
      }

      setSubToCancel(null);
      await loadData();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('support.cancelSubscriptionError'));
    } finally {
      setCancelling(false);
    }
  };

  const formatCurrencyValue = (cents: number): string => {
    return formatCurrency(cents / 100, 'BRL');
  };

  const formatDateValue = (dateStr: string): string => {
    try {
      return formatDate(dateStr, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge variant="emerald">{t('support.statusConfirmed')}</Badge>;
      case 'PENDING':
        return <Badge variant="amber">{t('support.statusPending')}</Badge>;
      case 'FAILED':
        return <Badge variant="rose">{t('support.statusFailed')}</Badge>;
      case 'CANCELLED':
        return <Badge variant="slate">{t('support.statusCancelled')}</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const formatFrequency = (freq: string) => {
    return freq === 'MONTHLY' ? t('support.frequencyMonthly') : t('support.frequencyOneTime');
  };

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'PIX':
        return t('support.methodPix');
      case 'GOOGLE_PAY':
        return t('support.methodGooglePay');
      case 'CREDIT_CARD':
        return t('support.methodCard');
      default:
        return method;
    }
  };

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {errorMessage && (
        <Alert variant="error" data-testid="receipts-error-alert">
          {errorMessage}
        </Alert>
      )}

      {/* Active Subscriber Banner */}
      {activeSubscription && (
        <Card
          data-testid="active-subscriber-banner"
          style={{
            padding: '1.25rem',
            backgroundColor: 'rgba(46, 125, 50, 0.06)',
            borderColor: 'rgba(46, 125, 50, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(46, 125, 50, 0.15)',
                color: 'var(--forest)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AletheiaIcon name="heart" size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {t('support.activeSubscriberTitle')}
                </h3>
                <Badge variant="emerald">{t('support.activeBadge')}</Badge>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.125rem 0 0 0' }}>
                {t('support.activeSubscriberDescription', {
                  amount: formatCurrencyValue(activeSubscription.amountCents),
                  method: formatPaymentMethod(activeSubscription.paymentMethod),
                })}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            data-testid="cancel-subscription-button"
            onClick={() => setSubToCancel(activeSubscription)}
            style={{ color: 'var(--color-error, #dc2626)' }}
          >
            {t('support.cancelMonthlySupport')}
          </Button>
        </Card>
      )}

      {/* Receipts Table Card */}
      <Card data-testid="donation-receipts-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {t('support.receiptsTitle')}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
              {t('support.receiptsDescription')}
            </p>
          </div>
          <Button variant="ghost" onClick={loadData} disabled={loading} style={{ fontSize: '0.8125rem' }}>
            <AletheiaIcon name="refresh-cw" size={14} />
            <span>{t('support.refreshButton')}</span>
          </Button>
        </div>

        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {t('support.loadingHistory')}
          </div>
        ) : history.length === 0 ? (
          <div data-testid="empty-receipts-state" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
              <AletheiaIcon name="hand-heart" size={36} />
            </div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
              {t('support.emptyHistoryTitle')}
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
              {t('support.emptyHistoryDescription')}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              data-testid="receipts-table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.875rem',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light, #e2e8f0)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{t('support.tableColDate')}</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{t('support.tableColAmount')}</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{t('support.tableColFrequency')}</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{t('support.tableColMethod')}</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{t('support.tableColStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr
                    key={record.id}
                    data-testid={`receipt-row-${record.id}`}
                    style={{ borderBottom: '1px solid var(--border-light, #f1f5f9)' }}
                  >
                    <td style={{ padding: '0.875rem 0.5rem', color: 'var(--text-secondary)' }}>
                      {formatDateValue(record.createdAt)}
                    </td>
                    <td style={{ padding: '0.875rem 0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatCurrencyValue(record.amountCents)}
                    </td>
                    <td style={{ padding: '0.875rem 0.5rem', color: 'var(--text-secondary)' }}>
                      {formatFrequency(record.frequency)}
                    </td>
                    <td style={{ padding: '0.875rem 0.5rem', color: 'var(--text-secondary)' }}>
                      {formatPaymentMethod(record.paymentMethod)}
                    </td>
                    <td style={{ padding: '0.875rem 0.5rem' }}>
                      {renderStatusBadge(record.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Cancel Confirmation Dialog */}
      {subToCancel && (
        <Modal
          isOpen={!!subToCancel}
          onClose={() => setSubToCancel(null)}
          title={t('support.cancelModalTitle')}
        >
          <div style={{ display: 'grid', gap: '1rem', padding: '0.5rem 0' }}>
            <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {t('support.cancelModalPrompt', { amount: formatCurrencyValue(subToCancel.amountCents) })}
            </p>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {t('support.cancelModalReassurance')}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setSubToCancel(null)} disabled={cancelling}>
                {t('support.keepSupportButton')}
              </Button>
              <Button
                variant="primary"
                data-testid="confirm-cancel-subscription-button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                style={{ backgroundColor: 'var(--color-error, #dc2626)', borderColor: 'var(--color-error, #dc2626)' }}
              >
                {cancelling ? t('support.cancellingButton') : t('support.confirmCancelButton')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
