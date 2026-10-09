'use client';
import React, { useEffect, useState } from 'react';
import { Button, Card, Alert } from '@aletheia/ui';
import { SUPPORT_WIDGET_SNOOZE_FOREVER, type FamilySettingsResponseDto, type SupportWidgetSnoozePreset } from '@aletheia/contracts';
import { api } from '../../lib/api/client';
import { useLocale } from '../../lib/i18n/locale-context';
import { SUPPORT_WIDGET_PRESETS, SUPPORT_WIDGET_SETTINGS_CHANGED_EVENT, supportWidgetSnoozeUntil } from '../support/support-widget-snooze';
export function SupportWidgetPreferencesCard({ familyId }: { familyId?: string | null }) {
 const { t, formatDate } = useLocale();
 const [snoozedUntil, setSnoozedUntil] = useState<string | null>(null);
 const [loaded, setLoaded] = useState(false);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState(false);
 useEffect(() => {
  let cancelled = false; setLoaded(false); setError(false);
  if (!familyId) return;
  void api.get<FamilySettingsResponseDto>(`/families/${familyId}/settings`).then(settings => { if (!cancelled) { setSnoozedUntil(settings.supportWidgetSnoozedUntil); setLoaded(true); } }).catch(() => { if (!cancelled) setError(true); });
  return () => { cancelled = true; };
 }, [familyId]);
 async function save(preset: SupportWidgetSnoozePreset | null) {
  if (!familyId || saving) return;
  const until = preset ? supportWidgetSnoozeUntil(preset) : null;
  setSaving(true); setError(false);
  try { await api.patch(`/families/${familyId}/settings`, { supportWidgetSnoozedUntil: until }); setSnoozedUntil(until); window.dispatchEvent(new CustomEvent(SUPPORT_WIDGET_SETTINGS_CHANGED_EVENT, { detail: { familyId } })); }
  catch { setError(true); } finally { setSaving(false); }
 }
 return <Card><h3>{t('supportWidget.settings.title')}</h3><p>{t('supportWidget.settings.description')}</p>
  {loaded && <p>{snoozedUntil === SUPPORT_WIDGET_SNOOZE_FOREVER ? t('supportWidget.settings.activeForever') : snoozedUntil && new Date(snoozedUntil).getTime() > Date.now() ? t('supportWidget.settings.snoozedUntil', { date: formatDate(snoozedUntil) }) : t('supportWidget.settings.active')}</p>}
  {error && <Alert variant="error">{t('supportWidget.feedback.error')}</Alert>}
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>{SUPPORT_WIDGET_PRESETS.map(preset => <Button key={preset} data-testid={`support-preference-${preset}`} disabled={!loaded || saving} onClick={() => void save(preset)}>{t(`supportWidget.snooze.${preset}`)}</Button>)}
  <Button data-testid="support-preference-reactivate" disabled={!loaded || saving || snoozedUntil === null} onClick={() => void save(null)}>{t('supportWidget.settings.reactivate')}</Button></div>
 </Card>;
}
