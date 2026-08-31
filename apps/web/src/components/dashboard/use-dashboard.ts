import { useCallback, useEffect, useRef, useState } from 'react';
import {
  dashboardResponseSchema,
  type CompleteLessonDto,
  type DashboardActivityDto,
  type DashboardResponseDto,
} from '@aletheia/contracts';

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type DashboardStatus = 'idle' | 'loading' | 'success' | 'error';

export interface DashboardController {
  data: DashboardResponseDto | null;
  status: DashboardStatus;
  errorMessage: string | null;
  activeLearnerId: string | null;
  setActiveLearnerId(id: string | null): void;
  retry(): void;
  completeActivity(activity: DashboardActivityDto): Promise<void>;
}

export function useDashboard(): DashboardController {
  const [data, setData] = useState<DashboardResponseDto | null>(null);
  const [status, setStatus] = useState<DashboardStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeLearnerId, setActiveLearnerId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const loadDashboard = useCallback(async () => {
    const familyId = localStorage.getItem('familyId') ?? localStorage.getItem('aletheia_active_family_id');

    if (!familyId) {
      setData(null);
      setStatus('idle');
      setErrorMessage(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;

    const params = new URLSearchParams({ date: toLocalDateKey(new Date()) });
    if (activeLearnerId) {
      params.append('learnerId', activeLearnerId);
    }

    setStatus('loading');
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/v1/families/${familyId}/dashboard?${params.toString()}`, {
        credentials: 'include',
        signal: controller.signal,
      });

      if (requestId !== requestIdRef.current) return;

      if (!res.ok) {
        setData(null);
        setStatus('error');
        setErrorMessage('Não foi possível carregar o painel.');
        return;
      }

      const json: unknown = await res.json();

      if (requestId !== requestIdRef.current) return;

      const parsed = dashboardResponseSchema.safeParse(json);
      if (!parsed.success) {
        setData(null);
        setStatus('error');
        setErrorMessage('Resposta inválida do servidor.');
        return;
      }

      setData(parsed.data);
      setStatus('success');
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return;
      if (requestId !== requestIdRef.current) return;
      setData(null);
      setStatus('error');
      setErrorMessage('Falha ao carregar o painel.');
    }
  }, [activeLearnerId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const retry = useCallback(() => {
    loadDashboard();
  }, [loadDashboard]);

  const completeActivity = useCallback(
    async (activity: DashboardActivityDto): Promise<void> => {
      if (activity.type !== 'lesson') return;

      const familyId = localStorage.getItem('familyId') ?? localStorage.getItem('aletheia_active_family_id');
      if (!familyId) return;

      const body: CompleteLessonDto = { completedAt: new Date().toISOString() };

      const res = await fetch(
        `/api/v1/families/${familyId}/lessons/${activity.id}/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const err: { message?: string } = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao concluir a lição.');
      }

      await loadDashboard();
    },
    [loadDashboard],
  );

  return {
    data,
    status,
    errorMessage,
    activeLearnerId,
    setActiveLearnerId,
    retry,
    completeActivity,
  };
}
