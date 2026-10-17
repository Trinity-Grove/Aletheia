'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Button, Card, Input, Select } from '@aletheia/ui';
import type { LearnerSummaryDto, MentorGrantResponseDto } from '@aletheia/contracts';
import { useAuthRole } from '../../lib/auth/rbac-context';
import { useLocale } from '../../lib/i18n/locale-context';

type LearnerOption = Pick<LearnerSummaryDto, 'id' | 'firstName' | 'lastName' | 'preferredName'>;
const learnerName = (learner: LearnerOption) => learner.preferredName || [learner.firstName, learner.lastName].filter(Boolean).join(' ');
export function MentorGrantsSettings({ familyId, learners }: { familyId: string; learners: LearnerOption[] }) {
  const { t } = useLocale();
  const auth = useAuthRole();
  const canManage = auth?.familyId === familyId && ['OWNER_GUARDIAN', 'GUARDIAN', 'CO_GUARDIAN'].includes(auth?.role ?? '');
  const [learnerId, setLearnerId] = useState('');
  const selectedLearner = learners.find((learner) => learner.id === learnerId);
  if (!canManage) return null;
  return <Card style={{ padding: '1.75rem', marginTop: '1.5rem' }}>
    <h2>{t('settings.mentors.title')}</h2>
    <p>{t('settings.mentors.scope')}</p>
    <Select label={t('settings.mentors.learner')} data-testid="mentor-learner" value={learnerId}
      onChange={(event) => setLearnerId(event.target.value)}
      options={[{ value: '', label: t('settings.mentors.selectLearner') }, ...learners.map((learner) => ({ value: learner.id, label: learnerName(learner) }))]} />
    {selectedLearner && <LearnerMentorGrants key={familyId + learnerId} familyId={familyId} learnerId={learnerId}
      learnerName={learnerName(selectedLearner)} />}
  </Card>;
}

function LearnerMentorGrants({ familyId, learnerId, learnerName }: { familyId: string; learnerId: string; learnerName: string }) {
  const { t, formatDate } = useLocale();
  const [grants, setGrants] = useState<MentorGrantResponseDto[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const base = `/api/v1/families/${familyId}/learners/${learnerId}/mentors`;
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(base, { credentials: 'include' });
        if (!response.ok) throw new Error();
        const result: MentorGrantResponseDto[] = await response.json();
        if (!cancelled) setGrants(result);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [base]);

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFailed(false);
    setInviteToken(null);
    try {
      const response = await fetch(base, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role: role.trim(), canApproveProgression: false }),
      });
      if (!response.ok) throw new Error();
      const result: MentorGrantResponseDto = await response.json();
      setGrants((current) => [...current.filter((grant) => grant.id !== result.id), result]);
      setInviteToken(result.token ?? null);
      setEmail('');
      setRole('');
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  async function update(grant: MentorGrantResponseDto, revoke = false) {
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch(revoke ? `/api/v1/mentors/${grant.id}` : `${base}/${grant.id}/progression-approval`, {
        method: revoke ? 'DELETE' : 'PATCH', credentials: 'include',
        ...(revoke ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !grant.canApproveProgression }) }),
      });
      if (!response.ok) throw new Error();
      const updated: MentorGrantResponseDto = revoke ? { ...grant, status: 'REVOKED', canApproveProgression: false } : await response.json();
      setGrants((current) => current.map((entry) => entry.id === grant.id ? updated : entry));
      if (revoke) setInviteToken(null);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
    {loading && <p>{t('settings.mentors.loading')}</p>}
    {failed && <Alert variant="error">{t('settings.mentors.error')}</Alert>}
    {!loading && !failed && grants.length === 0 && <p>{t('settings.mentors.empty')}</p>}
    {grants.map((grant) => {
      const expired = new Date(grant.expiresAt).getTime() <= Date.now();
      const status = grant.status === 'REVOKED' ? 'revoked' : expired ? 'expired' : grant.status === 'ACCEPTED' ? 'accepted' : 'pending';
      return <div key={grant.id} data-testid={`mentor-grant-${grant.id}`} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
        <p>{grant.email} · {grant.role}</p>
        <p>{t('settings.mentors.grantScope', { learner: learnerName })}</p>
        <Badge variant="slate">{t('settings.mentors.' + status)}</Badge>
        <p>{t('settings.mentors.expires', { date: formatDate(grant.expiresAt) })}</p>
        <p>{t(grant.canApproveProgression ? 'settings.mentors.capabilityOn' : 'settings.mentors.capabilityOff')}</p>
        {grant.status !== 'REVOKED' && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {!expired && <Button variant="secondary" disabled={busy} data-testid={`mentor-capability-${grant.id}`} onClick={() => update(grant)}>
            {t(grant.canApproveProgression ? 'settings.mentors.disable' : 'settings.mentors.enable')}
          </Button>}
          <Button variant="secondary" disabled={busy} data-testid={`revoke-mentor-${grant.id}`} onClick={() => update(grant, true)}>{t('settings.mentors.revoke')}</Button>
        </div>}
      </div>;
    })}
    <form onSubmit={invite} style={{ display: 'grid', gap: '0.75rem' }}>
      <h3>{t('settings.mentors.inviteTitle')}</h3>
      <p>{t('settings.mentors.defaultOff')}</p>
      <Input label={t('settings.mentors.email')} data-testid="mentor-email" type="email" required disabled={busy}
        value={email} onChange={(event) => setEmail(event.target.value)} />
      <Input label={t('settings.mentors.role')} data-testid="mentor-role" required maxLength={100} disabled={busy}
        value={role} onChange={(event) => setRole(event.target.value)} />
      <Button type="submit" data-testid="invite-mentor" disabled={busy || !email.trim() || !role.trim()}>{t('settings.mentors.invite')}</Button>
    </form>
    {inviteToken && <div>
      <p>{t('settings.mentors.shareLink')}</p>
      <Link data-testid="mentor-accept-link" href={`/mentor/accept/${encodeURIComponent(inviteToken)}`}>
        {new URL('/mentor/accept/' + encodeURIComponent(inviteToken), window.location.origin).href}
      </Link>
    </div>}
  </div>;
}
