'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AletheiaIcon, Button, Modal } from '@aletheia/ui';
import type { SupportWidgetSnoozePreset } from '@aletheia/contracts';
import { api } from '../../lib/api/client';
import { useLocale } from '../../lib/i18n/locale-context';
import { DonationFormCard } from './donation-form-card';
import { FeedbackForm } from './feedback-form';
import { supportWidgetSnoozeUntil, SUPPORT_WIDGET_PRESETS } from './support-widget-snooze';
export function SupportWidgetModal({ familyId, isOpen, onClose, onSnoozed, onSubmitted }: { familyId: string; isOpen: boolean; onClose: () => void; onSubmitted?: () => void; onSnoozed?: (preset: SupportWidgetSnoozePreset) => void }) {
 const { t } = useLocale();
 const [view, setView] = useState<'entry' | 'feedback' | 'donation'>('entry');
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState(false);
 useEffect(() => { if (isOpen) { setView('entry'); setError(false); } }, [isOpen]);
 async function snooze(preset: SupportWidgetSnoozePreset) {
  setSaving(true); setError(false);
  try { await api.patch(`/families/${familyId}/settings`, { supportWidgetSnoozedUntil: supportWidgetSnoozeUntil(preset) }); onSnoozed?.(preset); onClose(); }
  catch { setError(true); } finally { setSaving(false); }
 }
 return <Modal isOpen={isOpen} onClose={onClose} title={t('supportWidget.entry.title')} description={t('supportWidget.entry.subtitle')} maxWidth="sm" footer={view === 'entry' ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
  <Button onClick={onClose}>{t('supportWidget.entry.dismissNow')}</Button>
  {SUPPORT_WIDGET_PRESETS.map(preset => <Button key={preset} data-testid={`support-widget-snooze-${preset}`} disabled={saving} onClick={() => void snooze(preset)}>{t(`supportWidget.snooze.${preset}`)}</Button>)}
 </div> : <Button onClick={() => setView('entry')}>{t('supportWidget.entry.back')}</Button>}>
  {error && <p role="alert">{t('supportWidget.feedback.error')}</p>}
  {view === 'entry' && <div style={{ display: 'grid', gap: '1rem' }}>
   <button type="button" data-testid="support-widget-choose-support" onClick={() => setView('donation')} style={{ textAlign: 'left', padding: '1rem' }}><AletheiaIcon name="heart" size={20} /><strong>{t('supportWidget.entry.supportTitle')}</strong><p>{t('supportWidget.entry.supportDescription')}</p></button>
   <button type="button" data-testid="support-widget-choose-feedback" onClick={() => setView('feedback')} style={{ textAlign: 'left', padding: '1rem' }}><AletheiaIcon name="lightbulb" size={20} /><strong>{t('supportWidget.entry.feedbackTitle')}</strong><p>{t('supportWidget.entry.feedbackDescription')}</p></button>
  </div>}
  {view === 'feedback' && <FeedbackForm familyId={familyId} onSubmitted={() => onSubmitted?.()} />}
  {view === 'donation' && <><div data-testid="donation-form-card"><DonationFormCard familyId={familyId} /></div><Link href="/support">{t('supportWidget.donation.fullPageLink')}</Link></>}
 </Modal>;
}
