import { SUPPORT_WIDGET_SNOOZE_FOREVER, type SupportWidgetSnoozePreset } from '@aletheia/contracts';
export function supportWidgetSnoozeUntil(preset: SupportWidgetSnoozePreset, now = new Date()): string {
 if (preset === 'FOREVER') return SUPPORT_WIDGET_SNOOZE_FOREVER;
 const until = new Date(now);
 if (preset === 'WEEK') until.setUTCDate(until.getUTCDate() + 7);
 else until.setUTCMonth(until.getUTCMonth() + 1);
 return until.toISOString();
}
export const SUPPORT_WIDGET_PRESETS: SupportWidgetSnoozePreset[] = ['WEEK', 'MONTH', 'FOREVER'];
export const SUPPORT_WIDGET_SETTINGS_CHANGED_EVENT = 'aletheia:support-widget-settings-changed';
