import { describe, expect, it } from 'vitest';
import {
  SUPPORT_WIDGET_AUTO_DISMISS_MS,
  SUPPORT_WIDGET_INTERVAL_DAYS,
  SUPPORT_WIDGET_SNOOZE_FOREVER,
  isWidgetEligible,
} from './support-widget.js';

const NOW = new Date('2026-10-04T12:00:00.000Z');
const daysAgo = (n: number): Date => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

describe('isWidgetEligible', () => {
  it('is eligible when the family has never seen it', () => {
    expect(isWidgetEligible(NOW, null, null)).toBe(true);
  });

  it('is not eligible 6 days after the last appearance', () => {
    expect(isWidgetEligible(NOW, daysAgo(6), null)).toBe(false);
  });

  it('is eligible again exactly 7 days after the last appearance', () => {
    expect(isWidgetEligible(NOW, daysAgo(SUPPORT_WIDGET_INTERVAL_DAYS), null)).toBe(true);
  });

  it('is not eligible while a snooze is still in the future', () => {
    const in3days = new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000);
    expect(isWidgetEligible(NOW, null, in3days)).toBe(false);
  });

  it('is eligible the instant the snooze expires', () => {
    expect(isWidgetEligible(NOW, null, NOW)).toBe(true);
  });

  it('stays hidden forever for the "sempre" sentinel', () => {
    expect(isWidgetEligible(NOW, null, new Date(SUPPORT_WIDGET_SNOOZE_FOREVER))).toBe(false);
  });

  it('a cleared snooze (null) does NOT bypass a recent lastSeenAt', () => {
    expect(isWidgetEligible(NOW, daysAgo(1), null)).toBe(false);
  });

  it('pins the 20 second auto-dismiss and the 7 day interval', () => {
    expect(SUPPORT_WIDGET_AUTO_DISMISS_MS).toBe(20_000);
    expect(SUPPORT_WIDGET_INTERVAL_DAYS).toBe(7);
  });
});
