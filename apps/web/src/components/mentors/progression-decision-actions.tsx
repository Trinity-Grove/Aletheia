'use client';

import React, { useRef, useState } from 'react';
import { Alert, Button, Textarea } from '@aletheia/ui';
import type { LearnerCompetencyApprovalDecisionDto } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

export function ProgressionDecisionActions({ trackingId, endpoint, onSuccess }: {
  trackingId: string; endpoint: string; onSuccess(): Promise<void>;
}) {
  const { t } = useLocale();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<{ payload: string; key: string } | null>(null);
  async function decide(decision: LearnerCompetencyApprovalDecisionDto['decision']) {
    if (busy) return;
    setError(null);
    if (decision === 'RETURNED' && !reason.trim()) {
      setError(t('records.approval.reasonRequired'));
      return;
    }
    const payload = JSON.stringify({ decision, ...(decision === 'RETURNED' ? { reason: reason.trim() } : {}) });
    // Retain the key after uncertain failures so retries cannot append duplicate events.
    if (request.current?.payload !== payload) request.current = { payload, key: crypto.randomUUID() };
    setBusy(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...JSON.parse(payload), idempotencyKey: request.current.key }),
      });
      if (!response.ok) throw new Error();
      await onSuccess();
      request.current = null;
      setReason('');
    } catch {
      setError(t('records.approval.error'));
    } finally {
      setBusy(false);
    }
  }
  return <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.75rem' }}>
    {error && <Alert variant="error">{error}</Alert>}
    <Textarea label={t('records.approval.reason')} data-testid={`approval-reason-${trackingId}`}
      value={reason} onChange={(event) => setReason(event.target.value)} maxLength={2000} disabled={busy} />
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      <Button data-testid={`approve-${trackingId}`} disabled={busy} onClick={() => decide('APPROVED')}>{t('records.approval.approve')}</Button>
      <Button variant="secondary" data-testid={`return-${trackingId}`} disabled={busy} onClick={() => decide('RETURNED')}>{t('records.approval.return')}</Button>
    </div>
  </div>;
}
