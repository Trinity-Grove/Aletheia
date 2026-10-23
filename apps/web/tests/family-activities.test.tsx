import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FamilyActivitiesGallery } from '../src/components/curriculum/family-activities-gallery';

const testFamilyId = '11111111-1111-1111-1111-111111111111';

const mockActivity = {
  id: 'activity-1',
  familyId: testFamilyId,
  name: 'Passeio no parque',
  description: 'Observar plantas e insetos',
  ageMin: null,
  ageMax: null,
  estimatedDurationMinutes: null,
  supervisionRequired: false,
  riskLevel: null,
  evidenceRequirementMode: 'ANY',
  metadata: {},
  visibility: 'PRIVATE',
  createdAt: '2026-09-24T00:00:00.000Z',
  updatedAt: '2026-09-24T00:00:00.000Z',
};

describe('FamilyActivitiesGallery', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists family activities and shows their visibility badge', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockActivity],
    }) as unknown as typeof fetch;

    render(<FamilyActivitiesGallery familyId={testFamilyId} />);

    await waitFor(() => {
      expect(screen.getByText('Passeio no parque')).toBeInTheDocument();
    });
    expect(screen.getByTestId(`family-activity-visibility-badge-${mockActivity.id}`)).toHaveTextContent(
      'Privada',
    );
  });

  it('shows an empty state when the family has no activities yet', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] }) as unknown as typeof fetch;

    render(<FamilyActivitiesGallery familyId={testFamilyId} />);

    await waitFor(() => {
      expect(screen.getByText(/nenhuma atividade própria ainda/i)).toBeInTheDocument();
    });
  });

  it('shows a localized error when the family activity request fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;

    render(<FamilyActivitiesGallery familyId={testFamilyId} />);

    await waitFor(() => {
      expect(screen.getByText('Falha ao carregar atividades da família.')).toBeInTheDocument();
    });
    expect(screen.queryByText(/nenhuma atividade própria ainda/i)).not.toBeInTheDocument();
  });

  it('creates a new activity, defaulting to PRIVATE, and lets the creator switch it to PUBLIC before saving', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(<FamilyActivitiesGallery familyId={testFamilyId} />);
    await waitFor(() => {
      expect(screen.getByText(/nenhuma atividade própria ainda/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('create-family-activity-btn'));

    const nameInput = screen.getByTestId('family-activity-name-input');
    fireEvent.change(nameInput, { target: { value: 'Nova atividade' } });

    // Creator's own choice, per issue #244/#245: default PRIVATE, explicit opt-in to PUBLIC.
    fireEvent.click(screen.getByTestId('family-activity-visibility-public'));
    expect(screen.getByLabelText(/Confirmo que esta atividade será compartilhada anonimamente/i)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Confirmo que esta atividade será compartilhada anonimamente/i));

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockActivity, id: 'activity-2', name: 'Nova atividade', visibility: 'PUBLIC' }),
    });

    fireEvent.click(screen.getByTestId('family-activity-save-btn'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/v1/families/${testFamilyId}/activities`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"anonymousSharingConsent":true'),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Nova atividade')).toBeInTheDocument();
    });
  });

  it('does not allow a public activity to be saved without explicit anonymity consent', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] }) as unknown as typeof fetch;
    render(<FamilyActivitiesGallery familyId={testFamilyId} />);
    await waitFor(() => expect(screen.getByText(/nenhuma atividade própria ainda/i)).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('create-family-activity-btn'));
    fireEvent.change(screen.getByTestId('family-activity-name-input'), { target: { value: 'Atividade pública' } });
    fireEvent.click(screen.getByTestId('family-activity-visibility-public'));

    expect(screen.getByTestId('family-activity-save-btn')).toBeDisabled();
  });

  it('deletes an activity', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [mockActivity] });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });

    render(<FamilyActivitiesGallery familyId={testFamilyId} />);
    await waitFor(() => {
      expect(screen.getByText('Passeio no parque')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId(`delete-family-activity-btn-${mockActivity.id}`));

    await waitFor(() => {
      expect(screen.queryByText('Passeio no parque')).not.toBeInTheDocument();
    });
  });

  it('loads shared activities and adopts one as a private copy', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const sharedActivity = { ...mockActivity, id: 'shared-1', familyId: undefined, visibility: undefined, name: 'Mapa do bairro' };
    const adoptedActivity = { ...mockActivity, id: 'adopted-1', name: 'Mapa do bairro', visibility: 'PRIVATE' };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [] });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [sharedActivity] });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => adoptedActivity });

    render(<FamilyActivitiesGallery familyId={testFamilyId} />);
    await waitFor(() => expect(screen.getByText(/nenhuma atividade própria ainda/i)).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('community-activities-tab'));
    await waitFor(() => expect(screen.getByText('Mapa do bairro')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('adopt-community-activity-btn-shared-1'));

    await waitFor(() => expect(screen.getByText(/foi adicionada à sua família como privada/i)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/v1/families/${testFamilyId}/activities/adopt`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ sourceActivityId: 'shared-1' }) }),
    );
  });

  it('shows a community loading error and retries the catalog request', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [] });
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [{ ...mockActivity, id: 'shared-2', name: 'Horta em família' }] });

    render(<FamilyActivitiesGallery familyId={testFamilyId} />);
    await waitFor(() => expect(screen.getByText(/nenhuma atividade própria ainda/i)).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('community-activities-tab'));
    await waitFor(() => expect(screen.getByTestId('community-activities-error')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Tentar novamente'));

    await waitFor(() => expect(screen.getByText('Horta em família')).toBeInTheDocument());
  });
});
