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
          body: expect.stringContaining('"visibility":"PUBLIC"'),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Nova atividade')).toBeInTheDocument();
    });
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
});
