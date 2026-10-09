import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { WeeklySupportWidget } from '../src/components/support/weekly-support-widget';
import { FeedbackForm } from '../src/components/support/feedback-form';
import { SupportWidgetPreferencesCard } from '../src/components/settings/support-widget-preferences-card';
import { api } from '../src/lib/api/client';
import { SUPPORT_WIDGET_SNOOZE_FOREVER } from '@aletheia/contracts';
const props = { familyId: 'fam-1', role: 'GUARDIAN' as const, pathname: '/', settings: { lastSeenAt: null, snoozedUntil: null } };
beforeEach(() => { vi.spyOn(api, 'patch').mockResolvedValue({}); vi.spyOn(api, 'post').mockResolvedValue({}); vi.spyOn(api, 'get').mockResolvedValue({ supportWidgetSnoozedUntil: null }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });
it('records appearance once and dismisses after twenty seconds', () => {
 vi.useFakeTimers(); const { rerender } = render(<WeeklySupportWidget {...props} />);
 expect(screen.getByTestId('weekly-support-widget')).toBeInTheDocument(); rerender(<WeeklySupportWidget {...props} />);
 expect(api.patch).toHaveBeenCalledTimes(1); act(() => vi.advanceTimersByTime(20_000));
 expect(screen.queryByTestId('weekly-support-widget')).not.toBeInTheDocument();
});
it('does not appear for educators, on support, or after recent reactivation', () => {
 const { rerender } = render(<WeeklySupportWidget {...props} role="EDUCATOR" />);
 expect(screen.queryByTestId('weekly-support-widget')).not.toBeInTheDocument();
 rerender(<WeeklySupportWidget {...props} pathname="/support" />); expect(screen.queryByTestId('weekly-support-widget')).not.toBeInTheDocument();
 rerender(<WeeklySupportWidget {...props} settings={{ lastSeenAt: new Date().toISOString(), snoozedUntil: null }} />);
 expect(screen.queryByTestId('weekly-support-widget')).not.toBeInTheDocument(); expect(api.patch).not.toHaveBeenCalled();
});
it('opens feedback with identity unchecked', () => {
 render(<WeeklySupportWidget {...props} />); fireEvent.click(screen.getByTestId('weekly-support-widget'));
 fireEvent.click(screen.getByTestId('support-widget-choose-feedback')); expect(screen.getByTestId('feedback-identify-self')).not.toBeChecked();
});
it('requires meaningful text and submits anonymously', async () => {
 render(<FeedbackForm familyId="fam-1" onSubmitted={vi.fn()} />); expect(screen.getByTestId('feedback-submit')).toBeDisabled();
 fireEvent.change(screen.getByTestId('feedback-message'), { target: { value: 'Something useful about the app' } }); fireEvent.click(screen.getByTestId('feedback-submit'));
 await screen.findByRole('status'); expect(api.post).toHaveBeenCalledWith('/families/fam-1/feedback', expect.objectContaining({ identifySelf: false, message: 'Something useful about the app' }));
});
it('keeps failed feedback editable without reporting success', async () => {
 vi.mocked(api.post).mockRejectedValue(new Error('failed')); const submitted = vi.fn(); render(<FeedbackForm familyId="fam-1" onSubmitted={submitted} />);
 fireEvent.change(screen.getByTestId('feedback-message'), { target: { value: 'Something useful about the app' } }); fireEvent.click(screen.getByTestId('feedback-submit'));
 await screen.findByRole('alert'); expect(submitted).not.toHaveBeenCalled(); expect(screen.getByTestId('feedback-message')).toHaveValue('Something useful about the app');
});
it('stores forever and clears only snooze on reactivation', async () => {
 render(<SupportWidgetPreferencesCard familyId="fam-1" />); fireEvent.click(await screen.findByTestId('support-preference-FOREVER'));
 await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/families/fam-1/settings', { supportWidgetSnoozedUntil: SUPPORT_WIDGET_SNOOZE_FOREVER }));
 fireEvent.click(screen.getByTestId('support-preference-reactivate')); await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/families/fam-1/settings', { supportWidgetSnoozedUntil: null }));
});
it('refreshes cadence on interaction and keeps the open modal after auto-dismiss', () => {
 vi.useFakeTimers(); render(<WeeklySupportWidget {...props} />); vi.mocked(api.patch).mockClear();
 fireEvent.click(screen.getByTestId('weekly-support-widget'));
 expect(api.patch).toHaveBeenCalledWith('/families/fam-1/settings', expect.objectContaining({ supportWidgetLastSeenAt: expect.any(String) }));
 act(() => vi.advanceTimersByTime(20_000)); expect(screen.getByTestId('support-widget-choose-feedback')).toBeInTheDocument();
});
it('keeps the visible appearance when server settings receive its own last-seen write', () => {
 const { rerender } = render(<WeeklySupportWidget {...props} />); fireEvent.click(screen.getByTestId('weekly-support-widget'));
 rerender(<WeeklySupportWidget {...props} settings={{ lastSeenAt: new Date().toISOString(), snoozedUntil: null }} />);
 expect(screen.getByTestId('support-widget-choose-feedback')).toBeInTheDocument();
});
