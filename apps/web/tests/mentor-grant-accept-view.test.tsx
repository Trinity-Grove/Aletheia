import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MentorGrantAcceptView } from '../src/components/mentors/mentor-grant-accept-view';
import { LocaleProvider } from '../src/lib/i18n/locale-context';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); });
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

it.each([
  ['pt-BR', 'Aceitar convite de mentor', 'Aceitar convite', 'Não foi possível aceitar'],
  ['en-US', 'Accept mentor invitation', 'Accept invitation', 'Could not accept'],
  ['es-ES', 'Aceptar invitación de mentor', 'Aceptar invitación', 'No se pudo aceptar'],
])('localizes acceptance and expired-link feedback in %s', async (locale, title, action, error) => {
  localStorage.setItem('aletheia_locale', locale);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 400 })));
  render(<LocaleProvider syncFamily={false}><MentorGrantAcceptView token="expired-token" /></LocaleProvider>);
  expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: action }));
  expect(await screen.findByRole('alert')).toHaveTextContent(error);
  expect(screen.queryByTestId('mentor-accept-success')).not.toBeInTheDocument();
});

it('does not report acceptance for an unsuccessful response body', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ success: false }) })));
  render(<MentorGrantAcceptView token="invalid-token" />);
  fireEvent.click(screen.getByTestId('accept-mentor-grant'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível aceitar');
  expect(screen.queryByTestId('mentor-accept-success')).not.toBeInTheDocument();
});
