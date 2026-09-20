import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { LearnerResponseDto } from '@aletheia/contracts';
import { LearnerAccessModal } from '../src/components/learners/learner-access-modal';

const mockLearner: LearnerResponseDto = {
  id: 'a0000000-0000-0000-0000-000000000001',
  familyId: 'f0000000-0000-0000-0000-000000000001',
  firstName: 'Clara',
  lastName: 'Silva',
  preferredName: 'Clarinha',
  birthDate: '2016-05-12',
  stage: 'PRIMARY',
  customGrade: '3º Ano',
  avatarColor: '#3B82F6',
  specialNeeds: null,
  notes: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  archivedAt: null,
};

describe('LearnerAccessModal', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders modal when open and fetches initial status and consent compliance', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/access')) {
        return {
          ok: true,
          json: async () => ({
            learnerId: mockLearner.id,
            enabled: false,
            createdAt: null,
            regeneratedAt: null,
            lastUsedAt: null,
          }),
        } as Response;
      }
      if (url.includes('/consents/compliance')) {
        return {
          ok: true,
          json: async () => ({
            compliant: true,
            pendingMandatoryTerms: [],
          }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    render(
      <LearnerAccessModal
        isOpen={true}
        onClose={vi.fn()}
        learner={mockLearner}
        familyId="f0000000-0000-0000-0000-000000000001"
      />
    );

    expect(screen.getByTestId('learner-access-modal')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Acesso do Educando/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/v1/families/f0000000-0000-0000-0000-000000000001/learners/a0000000-0000-0000-0000-000000000001/access',
        expect.objectContaining({ credentials: 'include' })
      );
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/v1/families/f0000000-0000-0000-0000-000000000001/consents/compliance?learnerId=a0000000-0000-0000-0000-000000000001',
        expect.objectContaining({ credentials: 'include' })
      );
    });

    expect(screen.getByTestId('grant-access-btn')).toBeInTheDocument();
    expect(screen.getByTestId('learner-consent-section')).toBeInTheDocument();
    expect(screen.getByTestId('consent-compliant-badge')).toHaveTextContent(/Termos Aceitos/i);
  });

  it('generates access code when guardian clicks grant access', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/access/grant') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            grant: {
              learnerId: mockLearner.id,
              enabled: true,
              createdAt: '2026-09-17T00:00:00.000Z',
              regeneratedAt: null,
              lastUsedAt: null,
            },
            code: '749201',
          }),
        } as Response;
      }
      if (url.includes('/access')) {
        return {
          ok: true,
          json: async () => ({
            learnerId: mockLearner.id,
            enabled: false,
            createdAt: null,
            regeneratedAt: null,
            lastUsedAt: null,
          }),
        } as Response;
      }
      if (url.includes('/consents/compliance')) {
        return {
          ok: true,
          json: async () => ({ compliant: true, pendingMandatoryTerms: [] }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    render(
      <LearnerAccessModal
        isOpen={true}
        onClose={vi.fn()}
        learner={mockLearner}
        familyId="f0000000-0000-0000-0000-000000000001"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('grant-access-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('grant-access-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('access-code-display')).toHaveTextContent('749201');
    });
  });

  it('generates access code and direct access url and copies url to clipboard', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/access/grant') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            grant: {
              learnerId: mockLearner.id,
              enabled: true,
              createdAt: '2026-09-17T00:00:00.000Z',
              regeneratedAt: null,
              lastUsedAt: null,
            },
            code: '749201',
            accessToken: 'sample-jwt-token',
            accessUrl: '/aluno/login?token=sample-jwt-token',
          }),
        } as Response;
      }
      if (url.includes('/access')) {
        return {
          ok: true,
          json: async () => ({
            learnerId: mockLearner.id,
            enabled: false,
            createdAt: null,
            regeneratedAt: null,
            lastUsedAt: null,
          }),
        } as Response;
      }
      if (url.includes('/consents/compliance')) {
        return {
          ok: true,
          json: async () => ({ compliant: true, pendingMandatoryTerms: [] }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    render(
      <LearnerAccessModal
        isOpen={true}
        onClose={vi.fn()}
        learner={mockLearner}
        familyId="f0000000-0000-0000-0000-000000000001"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('grant-access-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('grant-access-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('access-code-display')).toHaveTextContent('749201');
      expect(screen.getByTestId('learner-access-url-section')).toBeInTheDocument();
      expect(screen.getByTestId('access-url-display')).toHaveTextContent('/aluno/login?token=sample-jwt-token');
      expect(screen.getByTestId('copy-access-url-btn')).toHaveTextContent('Copiar Link de Acesso');
    });

    fireEvent.click(screen.getByTestId('copy-access-url-btn'));
    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('/aluno/login?token=sample-jwt-token'));
    await waitFor(() => {
      expect(screen.getByTestId('copy-access-url-btn')).toHaveTextContent('Link Copiado!');
    });
  });

  it('shows regenerate and revoke actions when access is already active', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/access')) {
        return {
          ok: true,
          json: async () => ({
            learnerId: mockLearner.id,
            enabled: true,
            createdAt: '2026-09-10T00:00:00.000Z',
            regeneratedAt: null,
            lastUsedAt: null,
          }),
        } as Response;
      }
      if (url.includes('/consents/compliance')) {
        return {
          ok: true,
          json: async () => ({ compliant: true, pendingMandatoryTerms: [] }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    render(
      <LearnerAccessModal
        isOpen={true}
        onClose={vi.fn()}
        learner={mockLearner}
        familyId="f0000000-0000-0000-0000-000000000001"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('regenerate-access-btn')).toBeInTheDocument();
      expect(screen.getByTestId('revoke-access-btn')).toBeInTheDocument();
    });
  });

  it('displays pending consent warning and allows guardian to grant consent directly in modal', async () => {
    let grantCalled = false;
    let grantPayload: Record<string, unknown> | null = null;

    vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/consents/grant') && init?.method === 'POST') {
        grantCalled = true;
        grantPayload = JSON.parse(String(init.body));
        return {
          ok: true,
          json: async () => ({
            id: 'rec-1',
            action: 'GRANTED',
            consentDefinitionId: 'term-lgpd-1',
            learnerId: mockLearner.id,
          }),
        } as Response;
      }
      if (url.includes('/consents/compliance')) {
        return {
          ok: true,
          json: async () => ({
            compliant: grantCalled,
            pendingMandatoryTerms: grantCalled
              ? []
              : [
                  {
                    id: 'term-lgpd-1',
                    code: 'LEARNER_DATA_PROTECTION',
                    version: 1,
                    title: 'Proteção de Dados de Menores e LGPD',
                    scope: 'LEARNER',
                    mandatory: true,
                  },
                ],
          }),
        } as Response;
      }
      if (url.includes('/access')) {
        return {
          ok: true,
          json: async () => ({
            learnerId: mockLearner.id,
            enabled: false,
            createdAt: null,
            regeneratedAt: null,
            lastUsedAt: null,
          }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    render(
      <LearnerAccessModal
        isOpen={true}
        onClose={vi.fn()}
        learner={mockLearner}
        familyId="f0000000-0000-0000-0000-000000000001"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('consent-pending-badge')).toHaveTextContent(/Consentimento Pendente/i);
      expect(screen.getByTestId('consent-pending-alert')).toBeInTheDocument();
      expect(screen.getByText(/Proteção de Dados de Menores e LGPD/i)).toBeInTheDocument();
      expect(screen.getByTestId('privacy-settings-link')).toHaveAttribute('href', '/settings/privacy');
    });

    const grantBtn = screen.getByTestId('grant-consent-btn-term-lgpd-1');
    fireEvent.click(grantBtn);

    await waitFor(() => {
      expect(grantPayload).toEqual({
        consentDefinitionId: 'term-lgpd-1',
        learnerId: mockLearner.id,
      });
      expect(screen.getByTestId('consent-success-alert')).toHaveTextContent(/Consentimento concedido com sucesso/i);
    });
  });
});
