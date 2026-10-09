'use client';
import React, { useEffect, useState } from 'react';
import type { FamilyRole, FamilySettingsResponseDto } from '@aletheia/contracts';
import { api } from '../../lib/api/client';
import { WeeklySupportWidget, type WeeklySupportWidgetSettings } from './weekly-support-widget';
import { SUPPORT_WIDGET_SETTINGS_CHANGED_EVENT } from './support-widget-snooze';
export function FamilySupportWidget({ familyId, role, pathname }: { familyId: string | null; role: FamilyRole | null; pathname: string }) {
 const [settings, setSettings] = useState<{ familyId: string; value: WeeklySupportWidgetSettings } | null>(null);
 const [settingsVersion, setSettingsVersion] = useState(0);
 useEffect(() => {
  let cancelled = false;
  if (!familyId || !role || !['OWNER_GUARDIAN', 'GUARDIAN', 'CO_GUARDIAN'].includes(role)) return;
  // Uses useLocale inside child WeeklySupportWidget
  const refresh = () => {
    void api.get<FamilySettingsResponseDto>(`/families/${familyId}/settings`).then(value => {
      if (!cancelled) {
        setSettings({ familyId, value: { lastSeenAt: value.supportWidgetLastSeenAt ?? null, snoozedUntil: value.supportWidgetSnoozedUntil ?? null } });
        setSettingsVersion(version => version + 1);
      }
    }).catch(() => {});
  };
  const handleSettingsChanged = (event: Event) => {
   const detail = (event as CustomEvent<{ familyId?: string }>).detail;
   if (!detail?.familyId || detail.familyId === familyId) refresh();
  };
  refresh();
  window.addEventListener(SUPPORT_WIDGET_SETTINGS_CHANGED_EVENT, handleSettingsChanged);
  return () => { cancelled = true; window.removeEventListener(SUPPORT_WIDGET_SETTINGS_CHANGED_EVENT, handleSettingsChanged); };
 }, [familyId, role]);
 if (!familyId || settings?.familyId !== familyId) return null;
 return <WeeklySupportWidget key={`${familyId}-${settingsVersion}`} familyId={familyId} role={role} pathname={pathname} settings={settings.value} onSnoozed={() => setSettings(null)} />;
}
