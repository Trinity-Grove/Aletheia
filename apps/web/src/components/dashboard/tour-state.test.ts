import { describe, expect, it } from 'vitest';
import { shouldShowTourTrigger } from './tour-state';

describe('shouldShowTourTrigger', () => {
  it('does not show the trigger before the dashboard has loaded', () => {
    expect(shouldShowTourTrigger(null, false)).toBe(false);
  });

  it('shows the trigger for an available, incomplete tour', () => {
    expect(shouldShowTourTrigger({ onboarding: { dismissed: false } }, false)).toBe(true);
  });

  it('hides the trigger after the tour is completed locally', () => {
    expect(shouldShowTourTrigger({ onboarding: { dismissed: false } }, true)).toBe(false);
  });

  it('hides the trigger when onboarding was already dismissed', () => {
    expect(shouldShowTourTrigger({ onboarding: { dismissed: true } }, false)).toBe(false);
  });
});
