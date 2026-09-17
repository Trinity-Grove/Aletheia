import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PrivacyConsentSettings } from '../src/components/settings/privacy-consent-settings';

const mockLearners = [
  { id: 'l-1', firstName: 'Clarinha', lastName: 'Silva', displayName: 'Clarinha' },
  { id: 'l-2', firstName: 'Pedro', lastName: 'Silva', displayName: 'Pedro' },
];

const mockConsentOverview = {
  familyId: 'fam-1',
  terms: [
    {
      definition: {
        id: 'def-1',
        code: 'TERMS_OF_SERVICE',
        title: 'Termos de Serviço da Plataforma',
        description: 'Condições gerais de uso e responsabilidades dos guardiões.',
        content: '# Termos de Serviço\nRegras de uso da plataforma.',
        purposes: ['PLATFORM_USAGE'],
        scope: 'FAMILY',
        mandatory: true,
        status: 'PUBLISHED',
        schemaVersion: 1,
        version: 1,
        publishedAt: '2026-09-15T00:00:00.000Z',
        deprecatedAt: null,
        metadata: null,
        createdAt: '2026-09-15T00:00:00.000Z',
        updatedAt: '2026-09-15T00:00:00.000Z',
      },
      status: 'ACTIVE',
      familyStatus: 'ACTIVE',
      lastRecord: {
        id: 'rec-1',
        familyId: 'fam-1',
        consentDefinitionId: 'def-1',
        learnerId: null,
        action: 'GRANTED',
        consentedByUserId: 'user-1',
        ipAddress: null,
        userAgent: null,
        createdAt: '2026-09-15T10:00:00.000Z',
      },
    },
    {
      definition: {
        id: 'def-2',
        code: 'LEARNER_DATA_PROCESSING',
        title: 'Tratamento de Dados de Menores (LGPD Art. 14)',
        description: 'Consentimento específico do responsável para registro pedagógico do educando.',
        content: '# Consentimento Art. 14 LGPD\nAutorização dos responsáveis.',
        purposes: ['LEARNER_PORTFOLIO'],
        scope: 'LEARNER',
        mandatory: true,
        status: 'PUBLISHED',
        schemaVersion: 1,
        version: 1,
        publishedAt: '2026-09-15T00:00:00.000Z',
        deprecatedAt: null,
        metadata: null,
        createdAt: '2026-09-15T00:00:00.000Z',
        updatedAt: '2026-09-15T00:00:00.000Z',
      },
      status: 'PENDING',
      learnerStatuses: [
        {
          learnerId: 'l-1',
          learnerName: 'Clarinha',
          status: 'ACTIVE',
          lastRecord: {
            id: 'rec-2',
            familyId: 'fam-1',
            consentDefinitionId: 'def-2',
            learnerId: 'l-1',
            action: 'GRANTED',
            consentedByUserId: 'user-1',
            ipAddress: null,
            userAgent: null,
            createdAt: '2026-09-15T10:00:00.000Z',
          },
        },
        {
          learnerId: 'l-2',
          learnerName: 'Pedro',
          status: 'PENDING',
          lastRecord: null,
        },
      ],
    },
  ],
};

describe('PrivacyConsentSettings (Slice 2 of Issue #27)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders privacy overview with family and learner scoped terms', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockConsentOverview,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ compliant: true, pendingMandatoryTerms: [] }),
      } as Response);

    render(
      <PrivacyConsentSettings
        familyId="fam-1"
        learners={mockLearners as any}
      />
    );

    expect(screen.getByTestId('privacy-consent-settings')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Termos de Serviço da Plataforma')).toBeInTheDocument();
      expect(screen.getByText('Tratamento de Dados de Menores (LGPD Art. 14)')).toBeInTheDocument();
    });

    // Check scope badges
    expect(screen.getByText('Escopo Família')).toBeInTheDocument();
    expect(screen.getByText('Por Educando')).toBeInTheDocument();

    // Check learner status: Clarinha is ACTIVE, Pedro is PENDING
    expect(screen.getByTestId('learner-consent-status-l-1')).toHaveTextContent(/Ativo/i);
    expect(screen.getByTestId('learner-consent-status-l-2')).toHaveTextContent(/Pendente/i);
  });

  it('allows guardian to open modal and grant consent for a learner', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockConsentOverview,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ compliant: false, pendingMandatoryTerms: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'rec-3',
          familyId: 'fam-1',
          consentDefinitionId: 'def-2',
          learnerId: 'l-2',
          action: 'GRANTED',
          consentedByUserId: 'user-1',
          ipAddress: null,
          userAgent: null,
          createdAt: '2026-09-17T12:00:00.000Z',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockConsentOverview,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ compliant: true, pendingMandatoryTerms: [] }),
      } as Response);

    render(
      <PrivacyConsentSettings
        familyId="fam-1"
        learners={mockLearners as any}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('grant-consent-btn-def-2-l-2')).toBeInTheDocument();
    });

    // Click grant button for Pedro
    fireEvent.click(screen.getByTestId('grant-consent-btn-def-2-l-2'));

    // Modal should be visible
    expect(screen.getByTestId('consent-modal')).toBeInTheDocument();
    expect(screen.getByText(/Consentimento Art. 14 LGPD/i)).toBeInTheDocument();

    // Check consent statement and submit
    fireEvent.click(screen.getByTestId('confirm-grant-consent-btn'));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/v1/families/fam-1/consents/grant',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            consentDefinitionId: 'def-2',
            definitionId: 'def-2',
            learnerId: 'l-2',
          }),
        })
      );
    });
  });
});
