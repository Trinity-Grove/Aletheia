'use client';
import React, { useEffect, useState } from 'react';
import type { AdminFeedbackResponseDto, AdminFeedbackListResponseDto, FeedbackCategory, FeedbackStatus } from '@aletheia/contracts';
import { approveFeedbackSchema, rejectFeedbackSchema } from '@aletheia/contracts';
import { api, ApiError } from '../../lib/api';
import { useLocale } from '../../lib/i18n/locale-context';
const categories: FeedbackCategory[] = ['BUG', 'IDEA', 'QUESTION', 'PRAISE'];
const statuses: FeedbackStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
const categoryLabels: Record<FeedbackCategory, string> = { BUG: 'bug', IDEA: 'enhancement', QUESTION: 'question', PRAISE: 'praise' };
export function FeedbackTriageDashboard() {
  const { t, formatDate, formatNumber } = useLocale();
  const [items, setItems] = useState<AdminFeedbackResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('PENDING');
  const [category, setCategory] = useState('');
  const [skip, setSkip] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [issueError, setIssueError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [adminNote, setAdminNote] = useState('');
  const [reason, setReason] = useState('');
  const selected = items.find(item => item.id === selectedId);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false); setSelectedId(null);
    api.get<AdminFeedbackListResponseDto>('/admin/feedback', { params: { status: status || undefined, category: category || undefined, take: 50, skip } }).then(result => {
      if (active) { setItems(result.items); setTotal(result.total); }
    }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [status, category, skip]);
  function select(item: AdminFeedbackResponseDto) {
    setSelectedId(item.id); setTitle(''); setLabels(['feedback', categoryLabels[item.category]]); setAdminNote(item.adminNote || ''); setReason(''); setIssueError(Boolean(item.lastIssueError)); setError(false);
  }
  async function review(action: 'approve' | 'reject') {
    if (!selected || busy) return;
    const parsed = action === 'approve' ? approveFeedbackSchema.safeParse({ title, labels, adminNote: adminNote || undefined }) : rejectFeedbackSchema.safeParse({ reason });
    if (!parsed.success) return;
    setBusy(true); setError(false);
    try {
      const updated = await api.post<AdminFeedbackResponseDto>(`/admin/feedback/${selected.id}/${action}`, parsed.data);
      setItems(current => current.map(item => item.id === updated.id ? updated : item)); setIssueError(false);
    } catch (cause) { if (action === 'approve' && cause instanceof ApiError && cause.statusCode === 502) setIssueError(true); else setError(true); }
    finally { setBusy(false); }
  }
  return <section style={{ maxWidth: 1100 }}>
    <h1>{t('feedback.pageTitle')}</h1><p>{t('feedback.subtitle')}</p>
    <div style={{ display: 'flex', gap: 16 }}>
      <label>{t('feedback.columnStatus')}<select value={status} onChange={event => { setStatus(event.target.value); setSkip(0); }}><option value="">{t('feedback.all')}</option>{statuses.map(value => <option key={value} value={value}>{t(`feedback.status.${value}`)}</option>)}</select></label>
      <label>{t('feedback.columnCategory')}<select value={category} onChange={event => { setCategory(event.target.value); setSkip(0); }}><option value="">{t('feedback.all')}</option>{categories.map(value => <option key={value} value={value}>{t(`feedback.category.${value}`)}</option>)}</select></label>
      <p>{t('feedback.total', { count: formatNumber(total) })}</p>
    </div>
    {loading && <p role="status">{t('feedback.loading')}</p>}
    {error && <p role="alert">{t('feedback.error')}</p>}
    {!loading && !error && !items.length && <p>{t('feedback.empty')}</p>}
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(300px, 2fr)', gap: 24 }}>
      <div>{!loading && items.map(item => <button type="button" key={item.id} data-testid={`feedback-row-${item.id}`} onClick={() => select(item)} aria-pressed={selectedId === item.id} disabled={busy} style={{ display: 'block', width: '100%', padding: 16, marginBottom: 8, textAlign: 'left' }}>
        {t(`feedback.category.${item.category}`)}<br />{formatDate(item.createdAt)}<br />{t(`feedback.status.${item.status}`)}<br />{t(`feedback.identity.${item.identifySelf ? 'identified' : 'anonymous'}`)}
      </button>)}</div>
      {selected && <article>
        <h2 data-testid="feedback-detail-title">{t('feedback.panel.title')}</h2>
        <h3>{t('feedback.panel.message')}</h3><p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{selected.message}</p>
        {selected.identifySelf && <p>{selected.submitterName}<br />{selected.submitterEmail}</p>}
        <h3>{t('feedback.panel.context')}</h3><dl>{(['pagePath', 'locale', 'appVersion'] as const).map(key => <React.Fragment key={key}><dt>{t(`feedback.panel.${key}`)}</dt><dd>{selected[key] || t('feedback.unavailable')}</dd></React.Fragment>)}</dl>
        {selected.status !== 'PENDING' && selected.adminNote && <><h3>{t('feedback.panel.adminNoteLabel')}</h3><p style={{ whiteSpace: 'pre-wrap' }}>{selected.adminNote}</p></>}
        {selected.githubIssueUrl && <a href={selected.githubIssueUrl} target="_blank" rel="noreferrer">{t('feedback.issueLink')}</a>}
        {selected.status === 'PENDING' && <fieldset disabled={busy}>
          <label>{t('feedback.panel.approveTitleLabel')}<input value={title} maxLength={180} onChange={event => setTitle(event.target.value)} /></label>
          <fieldset><legend>{t('feedback.panel.labelsLabel')}</legend>{['feedback', 'bug', 'enhancement', 'question', 'praise'].map(label => { const required = label === 'feedback' || label === categoryLabels[selected.category]; return <label key={label}><input type="checkbox" checked={labels.includes(label)} disabled={required} onChange={event => setLabels(current => event.target.checked ? [...current, label] : current.filter(value => value !== label))} />{t(`feedback.labels.${label}`)}</label>; })}</fieldset>
          <label>{t('feedback.panel.adminNoteLabel')}<textarea data-testid="feedback-admin-note" value={adminNote} maxLength={2000} onChange={event => setAdminNote(event.target.value)} /></label>
          {issueError && <p role="alert" data-testid="feedback-issue-error">{t('feedback.issueError')}</p>}
          <button type="button" data-testid={issueError ? 'feedback-retry-approve' : 'feedback-approve'} disabled={!approveFeedbackSchema.safeParse({ title, labels, adminNote }).success} onClick={() => void review('approve')}>{t(issueError ? 'feedback.action.retryApprove' : 'feedback.action.approve')}</button>
          <label>{t('feedback.reject.reasonLabel')}<textarea value={reason} maxLength={1000} onChange={event => setReason(event.target.value)} /></label>
          <button type="button" disabled={!rejectFeedbackSchema.safeParse({ reason }).success} onClick={() => void review('reject')}>{t('feedback.action.reject')}</button>
        </fieldset>}
        <button type="button" disabled={busy} onClick={() => setSelectedId(null)}>{t('feedback.action.cancel')}</button>
      </article>}
    </div>
    <button type="button" disabled={loading || busy || skip === 0} onClick={() => setSkip(current => Math.max(0, current - 50))}>{t('feedback.previous')}</button>
    <button type="button" disabled={loading || busy || skip + 50 >= total} onClick={() => setSkip(current => current + 50)}>{t('feedback.next')}</button>
  </section>;
}

