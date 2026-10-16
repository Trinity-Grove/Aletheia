import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MentorApprovalsInbox } from '../src/components/mentors/mentor-approvals-inbox';
import { RouteProviders } from '../src/components/layout/route-providers';
import { LocaleProvider } from '../src/lib/i18n/locale-context';

vi.mock('next/navigation', () => ({ usePathname: () => '/mentor/progression' }));
const item = { familyId: 'family-1', learnerId: 'learner-1', evaluation: {
  learnerId: 'learner-1', trackingId: 'tracking-1', trackingStatus: 'ACTIVE',
  curriculumDefinitionId: null, competencyDefinitionId: 'competency-1', competencyVersion: 1,
  policyId: 'policy-1', policyVersion: 1, validatedEvidenceCount: 2, minimumEvidenceCount: 2,
  state: 'AWAITING_APPROVAL', unmetPrerequisites: [],
  requiredEvidenceCountMet: true, rubricAssessmentSatisfied: true, humanApprovalRequired: true,
  humanApprovalEligible: true, freshWorkRequired: false,
} };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); });

it('loads only the mentor inbox even with a stored family, and requires a return reason', async () => {
  localStorage.setItem('familyId', 'private-family');
  const fetcher = vi.fn(async (_url: string, init?: RequestInit) => ({ ok: true, json: async () => init?.method ? {} : [item] }));
  vi.stubGlobal('fetch', fetcher);
  render(<RouteProviders><MentorApprovalsInbox /></RouteProviders>);
  await screen.findByTestId('mentor-approval-tracking-1');
  expect(fetcher.mock.calls.map(([url]) => url)).toEqual(['/api/v1/mentors/progression-approvals']);
  fireEvent.click(screen.getByTestId('return-tracking-1'));
  expect(screen.getByRole('alert')).toHaveTextContent('Informe o motivo');
  expect(fetcher).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByTestId('approval-reason-tracking-1'), { target: { value: '  Nova avaliação  ' } });
  fireEvent.click(screen.getByTestId('return-tracking-1'));
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith('/api/v1/mentors/progression-approvals/tracking-1/decision', expect.objectContaining({
    method: 'POST', credentials: 'include', body: expect.any(String),
  })));
  expect(JSON.parse(fetcher.mock.calls[1]![1]!.body as string)).toEqual({ decision: 'RETURNED', reason: 'Nova avaliação', idempotencyKey: expect.any(String) });
  expect(fetcher.mock.calls.every(([url]) => url.startsWith('/api/v1/mentors/'))).toBe(true);
});

it.each([
  ['pt-BR', 'Aprovações do mentor'], ['en-US', 'Mentor approvals'], ['es-ES', 'Aprobaciones del mentor'],
])('localizes the inbox in %s', async (locale, title) => {
  localStorage.setItem('aletheia_locale', locale);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));
  render(<LocaleProvider><MentorApprovalsInbox /></LocaleProvider>);
  expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
});

it('shows scoped access failure and sign-in navigation without family fallback', async () => {
  const fetcher = vi.fn(async () => ({ ok: false, status: 403 }));
  vi.stubGlobal('fetch', fetcher);
  render(<MentorApprovalsInbox />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível');
  expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', expect.stringContaining('/login'));
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it('reuses the idempotency key when retrying a failed approval, then refreshes the scoped list', async () => {
  let decisions = 0;
  const fetcher = vi.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === 'POST') {
      decisions++;
      return { ok: decisions > 1, json: async () => ({}) };
    }
    return { ok: true, json: async () => decisions > 1 ? [] : [item] };
  });
  vi.stubGlobal('fetch', fetcher);
  render(<MentorApprovalsInbox />);
  fireEvent.click(await screen.findByTestId('approve-tracking-1'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível registrar');
  fireEvent.click(screen.getByTestId('approve-tracking-1'));
  await waitFor(() => expect(screen.queryByTestId('mentor-approval-tracking-1')).not.toBeInTheDocument());
  const bodies = fetcher.mock.calls.filter(([, init]) => init?.method === 'POST').map(([, init]) => JSON.parse(init!.body as string));
  expect(bodies).toHaveLength(2);
  expect(bodies[0]).toEqual({ decision: 'APPROVED', idempotencyKey: expect.stringMatching(/^[a-f0-9-]{36}$/) });
  expect(bodies[1]).toEqual(bodies[0]);
});

it('keeps a denied decision visible as an error after a grant expires without fetching family data', async () => {
  const fetcher = vi.fn(async (_url: string, init?: RequestInit) => init?.method === 'POST'
    ? { ok: false, status: 403, json: async () => ({}) }
    : { ok: true, json: async () => [item] });
  vi.stubGlobal('fetch', fetcher);
  render(<MentorApprovalsInbox />);
  fireEvent.click(await screen.findByTestId('approve-tracking-1'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível registrar');
  expect(screen.getByTestId('mentor-approval-tracking-1')).toBeInTheDocument();
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(fetcher.mock.calls.every(([url]) => url.startsWith('/api/v1/mentors/progression-approvals'))).toBe(true);
});
