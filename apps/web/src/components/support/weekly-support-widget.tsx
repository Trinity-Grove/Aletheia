'use client';
import React, { useEffect, useRef, useState } from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import { isWidgetEligible, SUPPORT_WIDGET_AUTO_DISMISS_MS, type FamilyRole, type SupportWidgetSnoozePreset } from '@aletheia/contracts';
import { api } from '../../lib/api/client';
import { useLocale } from '../../lib/i18n/locale-context';
import { SupportWidgetModal } from './support-widget-modal';
export interface WeeklySupportWidgetSettings { lastSeenAt: string | null; snoozedUntil: string | null }
export interface WeeklySupportWidgetProps { familyId: string | null; role: FamilyRole | null; pathname: string; settings: WeeklySupportWidgetSettings; onSeen?: () => void; onSnoozed?: (preset: SupportWidgetSnoozePreset) => void }
const GUARDIAN_ROLES: FamilyRole[] = ['OWNER_GUARDIAN', 'GUARDIAN', 'CO_GUARDIAN'];
export function WeeklySupportWidget({ familyId, role, pathname, settings, onSeen, onSnoozed }: WeeklySupportWidgetProps) {
 const { t } = useLocale();
 const [dismissed, setDismissed] = useState(false);
 const [modalOpen, setModalOpen] = useState(false);
 const recorded = useRef(false);
 const eligible = familyId !== null && role !== null && GUARDIAN_ROLES.includes(role) && pathname !== '/support' && !pathname.startsWith('/aluno') && (!settings.snoozedUntil || new Date(settings.snoozedUntil).getTime() <= Date.now()) && (recorded.current || isWidgetEligible(new Date(), settings.lastSeenAt ? new Date(settings.lastSeenAt) : null, settings.snoozedUntil ? new Date(settings.snoozedUntil) : null));
 const visible = eligible && !dismissed;
 function recordInteraction() { if (familyId) void api.patch(`/families/${familyId}/settings`, { supportWidgetLastSeenAt: new Date().toISOString() }).catch(() => {}); }
 useEffect(() => {
  if (!visible || !familyId) return;
  if (!recorded.current) { recorded.current = true; void api.patch(`/families/${familyId}/settings`, { supportWidgetLastSeenAt: new Date().toISOString() }).catch(() => {}); onSeen?.(); }
  const timer = setTimeout(() => setDismissed(true), SUPPORT_WIDGET_AUTO_DISMISS_MS);
  return () => clearTimeout(timer);
 }, [visible, familyId, onSeen]);
 if (!familyId || !eligible) return null;
 return <>
  {visible && <button type="button" data-testid="weekly-support-widget" aria-label={t('supportWidget.triggerLabel')} onClick={() => { recordInteraction(); setModalOpen(true); }} style={{ position: 'fixed', right: 'var(--support-widget-right, 1.5rem)', bottom: 'var(--support-widget-bottom, 1.5rem)', width: 44, height: 44, borderRadius: '50%', zIndex: 200 }}><AletheiaIcon name="book" size={20} /></button>}
  <SupportWidgetModal familyId={familyId} isOpen={modalOpen} onSubmitted={recordInteraction} onClose={() => { recordInteraction(); setModalOpen(false); setDismissed(true); }} onSnoozed={preset => { setDismissed(true); onSnoozed?.(preset); }} />
 </>;
}
