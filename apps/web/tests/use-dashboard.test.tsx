import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type DashboardActivityDto,
  type DashboardResponseDto,
} from '@aletheia/contracts';
import { toLocalDateKey, useDashboard } from '../src/components/dashboard/use-dashboard';

const FAMILY_ID = '11111111-1111-4111-8111-111111111111';
const LEARNER_A = '22222222-2222-4222-8222-222222222222';
const LEARNER_B = '33333333-3333-4333-8333-333333333333';
const LESSON_ID = '55555555-5555-4555-8555-555555555555';
const TOKEN = 'jwt-test-token';

function validPayload(overrides: Partial<DashboardResponseDto> = {}): DashboardResponseDto {
  return {
    date: '2026-08-29',
    family: { id: FAMILY_ID, name: 'Família Teste' },
    learners: [
      { id: LEARNER_A, displayName: 'Ana' },
      { id: LEARNER_B, displayName: 'Mateus' },
    ],
    activeLearnerId: null,
    journey: {
      completedMinutes: 60,
      targetMinutes: 240,
      completedLessons: 1,
      totalLessons: 3,
      daySequence: 7,
    },
    activities: [
      {
        id: '44444444-4444-4444-8444-444444444444',
        title: 'Devocional Matinal',
        completed: true,
        type: 'devotional',
      },
      {
        id: LESSON_ID,
        title: 'Lições de Latim',
        subjectName: 'Latim',
        completed: false,
        type: 'lesson',
      },
    ],
    ...overrides,
  };
}

describe('useDashboard hook', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('stays idle and does not fetch when no token or family is stored', () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
    expect(result.current.activeLearnerId).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows loading, then fetches with auth and local date and reaches success', async () => {
    localStorage.setItem('token', TOKEN);
    localStorage.setItem('familyId', FAMILY_ID);

    let resolveFetch!: (value: unknown) => void;
    fetchMock.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const { result } = renderHook(() => useDashboard());

    expect(result.current.status).toBe('loading');

    await act(async () => {
      resolveFetch({ ok: true, status: 200, json: async () => validPayload() });
    });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data).toEqual(validPayload());

    const url = fetchMock.mock.calls[0]![0] as string;
    const expectedDate = toLocalDateKey(new Date());
    expect(url).toBe(`/api/v1/families/${FAMILY_ID}/dashboard?date=${expectedDate}`);

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.credentials).toBe('include');
  });

  it('transitions to error on a non-ok HTTP response', async () => {
    localStorage.setItem('token', TOKEN);
    localStorage.setItem('familyId', FAMILY_ID);

    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.data).toBeNull();
    expect(result.current.errorMessage).toBeTruthy();
  });

  it('transitions to error when the payload fails schema validation', async () => {
    localStorage.setItem('token', TOKEN);
    localStorage.setItem('familyId', FAMILY_ID);

    const invalid = validPayload();
    delete (invalid as { journey?: unknown }).journey;

    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => invalid });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.data).toBeNull();
    expect(result.current.errorMessage).toBeTruthy();
  });

  it('retries a failed request and recovers to success', async () => {
    localStorage.setItem('token', TOKEN);
    localStorage.setItem('familyId', FAMILY_ID);

    const body = validPayload();
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => body });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data).toEqual(body);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('refetches with learnerId when the active learner changes', async () => {
    localStorage.setItem('token', TOKEN);
    localStorage.setItem('familyId', FAMILY_ID);

    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => validPayload() });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setActiveLearnerId(LEARNER_B);
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const url = fetchMock.mock.calls[1]![0] as string;
    expect(url).toContain(`learnerId=${LEARNER_B}`);
    expect(result.current.activeLearnerId).toBe(LEARNER_B);
  });

  it('ignores a stale response from a superseded request', async () => {
    localStorage.setItem('token', TOKEN);
    localStorage.setItem('familyId', FAMILY_ID);

    let resolveFirst!: (value: unknown) => void;
    let resolveSecond!: (value: unknown) => void;
    fetchMock
      .mockImplementationOnce(
        () => new Promise((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockImplementationOnce(
        () => new Promise((resolve) => {
          resolveSecond = resolve;
        }),
      );

    const { result } = renderHook(() => useDashboard());

    act(() => {
      result.current.setActiveLearnerId(LEARNER_B);
    });

    const payloadB = validPayload({ activeLearnerId: LEARNER_B });
    const payloadA = validPayload();

    await act(async () => {
      resolveSecond({ ok: true, status: 200, json: async () => payloadB });
    });
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data?.activeLearnerId).toBe(LEARNER_B);

    await act(async () => {
      resolveFirst({ ok: true, status: 200, json: async () => payloadA });
    });
    expect(result.current.data?.activeLearnerId).toBe(LEARNER_B);
  });

  it('completes a lesson activity then refetches the dashboard', async () => {
    localStorage.setItem('token', TOKEN);
    localStorage.setItem('familyId', FAMILY_ID);

    const updated = validPayload({
      activities: [
        {
          id: '44444444-4444-4444-8444-444444444444',
          title: 'Devocional Matinal',
          completed: true,
          type: 'devotional',
        },
        {
          id: LESSON_ID,
          title: 'Lições de Latim',
          subjectName: 'Latim',
          completed: true,
          type: 'lesson',
        },
      ],
    });
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => validPayload() })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => updated });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const lesson = result.current.data!.activities.find((a) => a.type === 'lesson')! as DashboardActivityDto;

    await act(async () => {
      await result.current.completeActivity(lesson);
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);

    const completeCall = fetchMock.mock.calls[1]!;
    expect(completeCall[0]).toBe(
      `/api/v1/families/${FAMILY_ID}/lessons/${LESSON_ID}/complete`,
    );
    const completeInit = completeCall[1] as RequestInit;
    expect(completeInit.method).toBe('POST');
    const completeHeaders = completeInit.headers as Record<string, string>;
    expect(completeHeaders['Content-Type']).toBe('application/json');
    expect(completeInit.credentials).toBe('include');

    await waitFor(() => expect(result.current.data?.activities.find((a) => a.id === LESSON_ID)?.completed).toBe(true));
  });

  it('does not mutate progress when completion fails', async () => {
    localStorage.setItem('token', TOKEN);
    localStorage.setItem('familyId', FAMILY_ID);

    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => validPayload() })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'server error' }),
      });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.status).toBe('success'));
    const before = result.current.data;
    const lesson = before!.activities.find((a) => a.type === 'lesson')!;
    expect(lesson.completed).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    let thrown: unknown;
    await act(async () => {
      try {
        await result.current.completeActivity(lesson);
      } catch (error) {
        thrown = error;
      }
    });

    expect(thrown).toBeInstanceOf(Error);
    expect(result.current.data).toEqual(before);
    expect(result.current.status).toBe('success');
    expect(result.current.data!.activities.find((a) => a.id === LESSON_ID)?.completed).toBe(false);
  });

  it('does nothing for non-lesson completion calls', async () => {
    localStorage.setItem('token', TOKEN);
    localStorage.setItem('familyId', FAMILY_ID);

    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => validPayload() });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.status).toBe('success'));

    const devotional = result.current.data!.activities.find((a) => a.type === 'devotional')! as DashboardActivityDto;

    await act(async () => {
      await result.current.completeActivity(devotional);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('success');
  });
});
