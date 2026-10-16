import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MentorGrantAcceptView } from '../src/components/mentors/mentor-grant-accept-view';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('accepts only on explicit action and links to the scoped inbox', async () => {
  const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ success: true, familyId: 'family-1', learnerId: 'learner-1' }) }));
  vi.stubGlobal('fetch', fetcher);
  render(<MentorGrantAcceptView token="secret-token" />);
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.click(screen.getByTestId('accept-mentor-grant'));
  expect(await screen.findByTestId('mentor-accept-success')).toBeInTheDocument();
  expect(fetcher).toHaveBeenCalledWith('/api/v1/mentors/secret-token/accept', expect.objectContaining({ method: 'POST', credentials: 'include' }));
  expect(screen.getByRole('link', { name: 'Aprovações do mentor' })).toHaveAttribute('href', '/mentor/progression');
});
it('offers sign-in with a return URL when acceptance fails', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401 })));
  render(<MentorGrantAcceptView token="secret-token" />);
  fireEvent.click(screen.getByTestId('accept-mentor-grant'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível');
  expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login?redirect=%2Fmentor%2Faccept%2Fsecret-token');
});
