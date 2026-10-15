import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CommunityLearningResourcesGallery } from '../src/components/curriculum/community-learning-resources-gallery';

const resource = {
  id: '11111111-1111-4111-8111-111111111111',
  familyId: '22222222-2222-4222-8222-222222222222',
  resourceType: 'MATERIAL' as const,
  title: 'Cartões de leitura',
  description: 'Para praticar em família.',
  subject: 'Português',
  ageMin: 6,
  ageMax: 8,
  content: { kind: 'MATERIAL' as const, items: [{ type: 'TEXT' as const, title: 'Cartões', value: 'Palavras simples' }] },
  visibility: 'PUBLIC' as const,
  createdAt: '2026-10-15T00:00:00.000Z',
  updatedAt: '2026-10-15T00:00:00.000Z',
};

describe('CommunityLearningResourcesGallery', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('loads owned resources and community resources through separate tabs', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [resource] })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ ...resource, familyId: undefined }] });
    vi.stubGlobal('fetch', fetchMock);

    render(<CommunityLearningResourcesGallery familyId={resource.familyId} />);

    expect(await screen.findByTestId('learning-resource-card-11111111-1111-4111-8111-111111111111')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('community-learning-resources-tab'));

    await waitFor(() => expect(screen.getByTestId('community-learning-resource-card-11111111-1111-4111-8111-111111111111')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenLastCalledWith('/api/v1/community/learning-resources', { credentials: 'include' });
  });

  it('creates a material as private by default', async () => {
    const created = { ...resource, id: '33333333-3333-4333-8333-333333333333', visibility: 'PRIVATE' as const };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => created });
    vi.stubGlobal('fetch', fetchMock);

    render(<CommunityLearningResourcesGallery familyId={resource.familyId} />);
    fireEvent.click(await screen.findByTestId('new-learning-resource-button'));
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Meu material' } });
    fireEvent.change(screen.getByLabelText('Materiais'), { target: { value: 'Caderno' } });
    fireEvent.click(screen.getByTestId('save-learning-resource-button'));

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      `/api/v1/families/${resource.familyId}/learning-resources`,
      expect.objectContaining({ method: 'POST', body: expect.stringContaining('PRIVATE') }),
    ));
  });
});
