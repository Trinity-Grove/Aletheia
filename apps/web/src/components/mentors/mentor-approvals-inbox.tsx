'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Button, Card } from '@aletheia/ui';
import type { MentorProgressionApprovalInboxDto } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';
import { ProgressionDecisionActions } from './progression-decision-actions';

export function MentorApprovalsInbox() {
  const { t, formatNumber } = useLocale();
  const [items, setItems] = useState<MentorProgressionApprovalInboxDto>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    setFailed(false);
    try {
      const response = await fetch('/api/v1/mentors/progression-approvals', { credentials: 'include' });
      if (!response.ok) throw new Error();
      setItems(await response.json());
    } catch {
      setItems([]);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <main style={{ maxWidth: '52rem', margin: '2rem auto', padding: '1.5rem', display: 'grid', gap: '1rem' }}>
    <h1>{t('records.approval.inboxTitle')}</h1>
    <p>{t('records.approval.inboxScope')}</p>
    {loading && <p>{t('records.approval.loading')}</p>}
    {failed && <Alert variant="error">{t('records.approval.loadError')}</Alert>}
    {failed && <><Link href="/login?redirect=%2Fmentor%2Fprogression">{t('records.approval.signIn')}</Link><Button onClick={load}>{t('records.approval.retry')}</Button></>}
    {!loading && !failed && items.length === 0 && <p>{t('records.approval.empty')}</p>}
    {items.map(({ learnerId, evaluation }) => <Card key={evaluation.trackingId} data-testid={`mentor-approval-${evaluation.trackingId}`} style={{ padding: '1.5rem' }}>
      <h2>{t('records.approval.competency', { id: evaluation.competencyDefinitionId, version: formatNumber(evaluation.competencyVersion) })}</h2>
      <p>{t('records.approval.learner', { id: learnerId })}</p>
      <Badge variant="amber">{t('records.approval.awaiting')}</Badge>
      <p>{t('records.approval.pending')}</p>
      <p>{t('records.competencies.progressEvidenceCount', { validated: formatNumber(evaluation.validatedEvidenceCount), minimum: formatNumber(evaluation.minimumEvidenceCount) })}</p>
      <ProgressionDecisionActions trackingId={evaluation.trackingId}
        endpoint={`/api/v1/mentors/progression-approvals/${evaluation.trackingId}/decision`} onSuccess={load} />
    </Card>)}
  </main>;
}
