// Shared by the API (tests and any future server-side check) and the
// browser widget -- @aletheia/contracts is the only package both apps
// depend on, so the rule lives here instead of being duplicated.

export const SUPPORT_WIDGET_INTERVAL_DAYS = 7;
export const SUPPORT_WIDGET_AUTO_DISMISS_MS = 20_000;

// "Sempre" is stored as a far-future timestamp, never null: null means
// "no snooze", and the widget must be able to tell those apart.
export const SUPPORT_WIDGET_SNOOZE_FOREVER = '9999-12-31T23:59:59.999Z';

export type SupportWidgetSnoozePreset = 'WEEK' | 'MONTH' | 'FOREVER';

function addDays(from: Date, days: number): Date {
  const result = new Date(from.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

// Strictly greater-than on both comparisons: exactly 7 days after the last
// appearance is eligible again, and a snooze that expires exactly now has
// already expired.
export function isWidgetEligible(
  now: Date,
  lastSeenAt: Date | null,
  snoozedUntil: Date | null,
): boolean {
  if (snoozedUntil !== null && snoozedUntil.getTime() > now.getTime()) return false;
  if (lastSeenAt !== null && addDays(lastSeenAt, SUPPORT_WIDGET_INTERVAL_DAYS).getTime() > now.getTime()) {
    return false;
  }
  return true;
}
