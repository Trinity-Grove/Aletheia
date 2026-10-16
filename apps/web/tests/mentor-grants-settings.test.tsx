import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MentorGrantsSettings } from '../src/components/settings/mentor-grants-settings';
import { AuthProvider } from '../src/lib/auth/rbac-context';

const learners = [{ id: 'learner-1', firstName: 'Ana' }, { id: 'learner-2', firstName: 'Beto' }];
const grant = { id: 'grant-1', familyId: 'family-1', learnerId: 'learner-1', email: 'mentor@example.com',
  role: 'Tutor', canApproveProgression: false, status: 'PENDING', invitedBy: 'guardian-1',
  expiresAt: '2099-01-01T00:00:00Z', createdAt: '2026-10-16T00:00:00Z' };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('invites for one learner with approval OFF, exposes the link, toggles only capability and revokes', async () => {
  const fetcher = vi.fn(async (_url: string, init?: RequestInit) => ({
    ok: true, json: async () => init?.method === 'POST' ? { ...grant, token: 'invite-token' } : init?.method === 'PATCH' ? { ...grant, canApproveProgression: true } : [grant],
  }));
  vi.stubGlobal('fetch', fetcher);
  render(<AuthProvider role="GUARDIAN" familyId="family-1"><MentorGrantsSettings familyId="family-1" learners={learners} /></AuthProvider>);
  fireEvent.change(screen.getByTestId('mentor-learner'), { target: { value: 'learner-1' } });
  await screen.findByTestId('mentor-grant-grant-1');
  expect(screen.getByTestId('mentor-grant-grant-1')).toHaveTextContent('Ana');
  expect(screen.getByTestId('mentor-grant-grant-1')).toHaveTextContent('Pendente');
  fireEvent.change(screen.getByTestId('mentor-email'), { target: { value: 'mentor@example.com' } });
  fireEvent.change(screen.getByTestId('mentor-role'), { target: { value: 'Tutor' } });
  fireEvent.click(screen.getByTestId('invite-mentor'));
  expect(await screen.findByTestId('mentor-accept-link')).toHaveAttribute('href', '/mentor/accept/invite-token');
  const invite = fetcher.mock.calls.find(([, init]) => init?.method === 'POST')!;
  expect(invite[0]).toBe('/api/v1/families/family-1/learners/learner-1/mentors');
  expect(JSON.parse(invite[1]!.body as string)).toEqual({ email: 'mentor@example.com', role: 'Tutor', canApproveProgression: false });
  fireEvent.click(screen.getByTestId('mentor-capability-grant-1'));
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith('/api/v1/families/family-1/learners/learner-1/mentors/grant-1/progression-approval', expect.objectContaining({ method: 'PATCH', body: '{"enabled":true}' })));
  fireEvent.click(screen.getByTestId('revoke-mentor-grant-1'));
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith('/api/v1/mentors/grant-1', expect.objectContaining({ method: 'DELETE' })));
});

it.each(['EDUCATOR', null] as const)('offers no management controls or grant reads for %s', (role) => {
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  render(<AuthProvider role={role} familyId="family-1"><MentorGrantsSettings familyId="family-1" learners={learners} /></AuthProvider>);
  expect(screen.queryByTestId('invite-mentor')).not.toBeInTheDocument();
  expect(fetcher).not.toHaveBeenCalled();
});

it('clears the first learner grants and invitation link when switching learners', async () => {
  const fetcher = vi.fn(async (url: string, init?: RequestInit) => ({
    ok: true, json: async () => init?.method === 'POST' ? { ...grant, token: 'private-token' } : url.includes('learner-2') ? [] : [grant],
  }));
  vi.stubGlobal('fetch', fetcher);
  render(<AuthProvider role="OWNER_GUARDIAN" familyId="family-1"><MentorGrantsSettings familyId="family-1" learners={learners} /></AuthProvider>);
  fireEvent.change(screen.getByTestId('mentor-learner'), { target: { value: 'learner-1' } });
  await screen.findByTestId('mentor-grant-grant-1');
  fireEvent.change(screen.getByTestId('mentor-email'), { target: { value: 'mentor@example.com' } });
  fireEvent.change(screen.getByTestId('mentor-role'), { target: { value: 'Tutor' } });
  fireEvent.click(screen.getByTestId('invite-mentor'));
  await screen.findByTestId('mentor-accept-link');
  fireEvent.change(screen.getByTestId('mentor-learner'), { target: { value: 'learner-2' } });
  expect(screen.queryByTestId('mentor-accept-link')).not.toBeInTheDocument();
  expect(screen.queryByTestId('mentor-grant-grant-1')).not.toBeInTheDocument();
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith('/api/v1/families/family-1/learners/learner-2/mentors', { credentials: 'include' }));
});

it('disables approval without revoking access and hides actions once revoked', async () => {
  const fetcher = vi.fn(async (_url: string, init?: RequestInit) => ({
    ok: true, json: async () => init?.method === 'PATCH' ? { ...grant, status: 'ACCEPTED', canApproveProgression: false } : [{ ...grant, status: 'ACCEPTED', canApproveProgression: true }],
  }));
  vi.stubGlobal('fetch', fetcher);
  render(<AuthProvider role="CO_GUARDIAN" familyId="family-1"><MentorGrantsSettings familyId="family-1" learners={learners} /></AuthProvider>);
  fireEvent.change(screen.getByTestId('mentor-learner'), { target: { value: 'learner-1' } });
  fireEvent.click(await screen.findByTestId('mentor-capability-grant-1'));
  await waitFor(() => expect(screen.getByTestId('mentor-grant-grant-1')).toHaveTextContent('Aprovação de progressão desabilitada'));
  expect(screen.getByTestId('mentor-grant-grant-1')).toHaveTextContent('Aceito');
  expect(fetcher).toHaveBeenCalledWith(expect.stringContaining('/progression-approval'), expect.objectContaining({ method: 'PATCH', body: '{"enabled":false}' }));
  expect(fetcher.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false);
  fireEvent.click(screen.getByTestId('revoke-mentor-grant-1'));
  await waitFor(() => expect(screen.getByTestId('mentor-grant-grant-1')).toHaveTextContent('Revogado'));
  expect(screen.queryByTestId('mentor-capability-grant-1')).not.toBeInTheDocument();
  expect(screen.queryByTestId('revoke-mentor-grant-1')).not.toBeInTheDocument();
});

it('does not use a guardian role from a different family', () => {
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  render(<AuthProvider role="GUARDIAN" familyId="other-family"><MentorGrantsSettings familyId="family-1" learners={learners} /></AuthProvider>);
  expect(screen.queryByTestId('invite-mentor')).not.toBeInTheDocument();
  expect(fetcher).not.toHaveBeenCalled();
});

it('shows expired grants without offering capability changes', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [{ ...grant, expiresAt: '2000-01-01T00:00:00Z' }] })));
  render(<AuthProvider role="GUARDIAN" familyId="family-1"><MentorGrantsSettings familyId="family-1" learners={learners} /></AuthProvider>);
  fireEvent.change(screen.getByTestId('mentor-learner'), { target: { value: 'learner-1' } });
  expect(await screen.findByTestId('mentor-grant-grant-1')).toHaveTextContent('Expirado');
  expect(screen.queryByTestId('mentor-capability-grant-1')).not.toBeInTheDocument();
  expect(screen.getByTestId('revoke-mentor-grant-1')).toBeInTheDocument();
});
