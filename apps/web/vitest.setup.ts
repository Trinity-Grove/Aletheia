import { expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// Destructive actions (delete buttons) gate on window.confirm — default it to
// "confirmed" so existing behavior-focused tests don't have to know about it.
// A test asserting the cancel path can override this per-test with
// vi.spyOn(window, 'confirm').mockReturnValueOnce(false).
window.confirm = vi.fn(() => true);
