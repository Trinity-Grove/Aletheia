'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Card } from '@aletheia/ui';
import type { AcceptMentorGrantResponseDto } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

export function MentorGrantAcceptView({ token }: { token: string }) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [failed, setFailed] = useState(false);
  async function accept() {
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch(`/api/v1/mentors/${encodeURIComponent(token)}/accept`, { method: 'POST', credentials: 'include' });
      if (!response.ok) throw new Error();
      const result: AcceptMentorGrantResponseDto = await response.json();
      if (!result.success) throw new Error();
      setSuccess(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return <main style={{ maxWidth: '40rem', margin: '2rem auto', padding: '1.5rem' }}><Card style={{ padding: '1.5rem' }}>
    <h1>{t('records.approval.acceptTitle')}</h1>
    <p>{t('records.approval.acceptScope')}</p>
    {failed && <Alert variant="error">{t('records.approval.acceptError')}</Alert>}
    {success ? <>
      <Alert variant="success" data-testid="mentor-accept-success">{t('records.approval.accepted')}</Alert>
      <Link href="/mentor/progression">{t('records.approval.inboxTitle')}</Link>
    </> : <>
      <Button data-testid="accept-mentor-grant" isLoading={busy} disabled={busy} onClick={accept}>{t('records.approval.accept')}</Button>
      <p><Link href={`/login?redirect=${encodeURIComponent('/mentor/accept/' + encodeURIComponent(token))}`}>{t('records.approval.signIn')}</Link></p>
    </>}
  </Card></main>;
}
