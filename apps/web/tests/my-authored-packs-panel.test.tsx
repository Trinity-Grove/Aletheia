import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MyAuthoredPacksPanel } from '../src/components/curriculum/my-authored-packs-panel';

const mockProfile = {
  userId: 'user-1',
  trustScore: 45,
  tier: 'NOVICE',
  approvedPacksCount: 1,
  rejectedPacksCount: 0,
  upheldReportsCount: 0,
  lastEvaluatedAt: '2026-09-25T00:00:00.000Z',
  createdAt: '2026-09-25T00:00:00.000Z',
  updatedAt: '2026-09-25T00:00:00.000Z',
};

const draftPack = {
  id: 'pack-draft-1',
  code: 'MY.DRAFT.PACK',
  version: 1,
  status: 'DRAFT',
  schemaVersion: '1.0.0',
  name: 'Meu Pacote em Rascunho',
  description: null,
  metadata: {},
  authorUserId: 'user-1',
  moderationStatus: 'DRAFT',
  moderationNotes: null,
  createdAt: '2026-09-25T00:00:00.000Z',
  publishedAt: null,
  deprecatedAt: null,
};

const rejectedPack = {
  ...draftPack,
  id: 'pack-rejected-1',
  code: 'MY.REJECTED.PACK',
  name: 'Meu Pacote Rejeitado',
  moderationStatus: 'REJECTED',
  moderationNotes: 'Conteúdo incompleto.',
};

describe('MyAuthoredPacksPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists authored packs with status badges and the trust profile', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/my-packs')) {
        return { ok: true, json: async () => [draftPack, rejectedPack] } as Response;
      }
      if (url.includes('/author-profile')) {
        return { ok: true, json: async () => mockProfile } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    render(<MyAuthoredPacksPanel />);

    await waitFor(() => {
      expect(screen.getByText('Meu Pacote em Rascunho')).toBeInTheDocument();
      expect(screen.getByText('Meu Pacote Rejeitado')).toBeInTheDocument();
    });

    expect(screen.getByTestId('my-authored-pack-status-pack-draft-1')).toHaveTextContent('Rascunho');
    expect(screen.getByTestId('my-authored-pack-status-pack-rejected-1')).toHaveTextContent('Rejeitado');
    expect(screen.getByText('Conteúdo incompleto.')).toBeInTheDocument();
    expect(screen.getByTestId('author-trust-badge')).toBeInTheDocument();
  });

  it('submits a draft pack for review and shows a success message', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/my-packs')) {
        return { ok: true, json: async () => [draftPack] } as Response;
      }
      if (url.includes('/author-profile')) {
        return { ok: true, json: async () => mockProfile } as Response;
      }
      if (url.includes('/submit') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ ...draftPack, moderationStatus: 'PENDING_REVIEW' }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    render(<MyAuthoredPacksPanel />);

    await waitFor(() => {
      expect(screen.getByTestId('submit-for-review-btn-pack-draft-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('submit-for-review-btn-pack-draft-1'));

    await waitFor(() => {
      expect(screen.getByTestId('submit-for-review-success-pack-draft-1')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/curriculum-packs/pack-draft-1/submit',
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    );
  });

  it('renders an empty state when the author has no published packs', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/my-packs')) {
        return { ok: true, json: async () => [] } as Response;
      }
      if (url.includes('/author-profile')) {
        return { ok: true, json: async () => mockProfile } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    render(<MyAuthoredPacksPanel />);

    await waitFor(() => {
      expect(screen.getByTestId('my-authored-packs-empty')).toBeInTheDocument();
    });
  });

  it('shows an error state when loading fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 500 } as Response);

    render(<MyAuthoredPacksPanel />);

    await waitFor(() => {
      expect(screen.getByTestId('my-authored-packs-error')).toBeInTheDocument();
    });
  });
});
