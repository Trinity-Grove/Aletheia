'use client';
import React, { useState } from 'react';
import type { FeedbackCategory, SubmitterFeedbackResponseDto } from '@aletheia/contracts';
import { Button } from '@aletheia/ui';
import { api } from '../../lib/api/client';
import { useLocale } from '../../lib/i18n/locale-context';
export function FeedbackForm({ familyId, onSubmitted }: { familyId: string; onSubmitted: () => void }) {
 const { t, locale } = useLocale();
 const [category, setCategory] = useState<FeedbackCategory>('IDEA');
 const [message, setMessage] = useState('');
 const [identifySelf, setIdentifySelf] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [error, setError] = useState(false);
 const [submitted, setSubmitted] = useState(false);
 async function submit(event: React.FormEvent) {
  event.preventDefault(); if (submitting || message.trim().length < 10) return;
  setSubmitting(true); setError(false);
  try {
   await api.post<SubmitterFeedbackResponseDto>(`/families/${familyId}/feedback`, { category, message: message.trim(), identifySelf, pagePath: window.location.pathname.slice(0, 200), locale, userAgent: navigator.userAgent.slice(0, 400) });
   setSubmitted(true); onSubmitted();
  } catch { setError(true); } finally { setSubmitting(false); }
 }
 if (submitted) return <p role="status">{t('supportWidget.feedback.success')}</p>;
 return <form onSubmit={submit} style={{ display: 'grid', gap: '1rem' }}>
  <label>{t('supportWidget.feedback.categoryLabel')}<select value={category} onChange={event => setCategory(event.target.value as FeedbackCategory)}>
   {(['BUG', 'IDEA', 'QUESTION', 'PRAISE'] as const).map(value => <option key={value} value={value}>{t(`supportWidget.feedback.categories.${value}`)}</option>)}
  </select></label>
  <label>{t('supportWidget.feedback.messageLabel')}<textarea data-testid="feedback-message" value={message} maxLength={4000} rows={6} onChange={event => setMessage(event.target.value)} /></label>
  <label><input data-testid="feedback-identify-self" type="checkbox" checked={identifySelf} onChange={event => setIdentifySelf(event.target.checked)} />{t('supportWidget.feedback.identifySelfLabel')}</label>
  <p>{t('supportWidget.feedback.publicWarning')}</p>
  {error && <p role="alert">{t('supportWidget.feedback.error')}</p>}
  <Button data-testid="feedback-submit" type="submit" disabled={submitting || message.trim().length < 10}>{t(submitting ? 'supportWidget.feedback.submitting' : 'supportWidget.feedback.submit')}</Button>
 </form>;
}
