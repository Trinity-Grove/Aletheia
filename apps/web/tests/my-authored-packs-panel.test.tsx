import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { CurriculumPackResponseDto } from '@aletheia/contracts';
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

    render(<MyAuthoredPacksPanel onOpenCatalog={vi.fn()} onOpenImport={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('my-authored-packs-empty')).toBeInTheDocument();
    });
    expect(screen.getByTestId('empty-create-community-pack-btn')).toBeInTheDocument();
    expect(screen.getByTestId('empty-open-catalog-btn')).toBeInTheDocument();
    expect(screen.getByTestId('empty-import-material-btn')).toBeInTheDocument();
  });

  it('shows an actionable retry when loading the author workspace fails', async () => {
    let attempts = 0;
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      attempts += 1;
      if (attempts <= 2) return { ok: false, status: 500 } as Response;
      const url = String(input);
      if (url.includes('/my-packs')) return { ok: true, json: async () => [draftPack] } as Response;
      if (url.includes('/author-profile')) return { ok: true, json: async () => mockProfile } as Response;
      return { ok: false, status: 404 } as Response;
    });

    render(<MyAuthoredPacksPanel />);
    await waitFor(() => expect(screen.getByTestId('my-authored-packs-error')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /tentar carregar novamente/i }));
    await waitFor(() => expect(screen.getByText('Meu Pacote em Rascunho')).toBeInTheDocument());
  });

  it('explains the publication visibility and moderation progress', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/my-packs')) return { ok: true, json: async () => [rejectedPack] } as Response;
      if (url.includes('/author-profile')) return { ok: true, json: async () => mockProfile } as Response;
      return { ok: false, status: 404 } as Response;
    });

    render(<MyAuthoredPacksPanel />);

    await waitFor(() => expect(screen.getByTestId('community-pack-publication-status-pack-rejected-1')).toBeInTheDocument());
    expect(screen.getByTestId('community-pack-visibility-pack-rejected-1')).toHaveTextContent('Não publicado');
    expect(screen.getByTestId('community-pack-progress-step-pack-rejected-1-rejected')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByTestId('community-pack-moderation-notes-pack-rejected-1')).toHaveTextContent('Conteúdo incompleto.');
  });

  it('shows an error state when loading fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 500 } as Response);

    render(<MyAuthoredPacksPanel />);

    await waitFor(() => {
      expect(screen.getByTestId('my-authored-packs-error')).toBeInTheDocument();
    });
  });

  it('creates a draft from a public base without publishing it', async () => {
    let createRequest: { url: string; init?: RequestInit } | undefined;
    const basePack: CurriculumPackResponseDto = {
      ...draftPack,
      id: 'public-base-1',
      code: 'CLASSICAL_BASE',
      name: 'Base público',
      description: 'Descrição da base',
      authorUserId: null,
      status: 'PUBLISHED' as const,
      moderationStatus: 'APPROVED' as const,
      metadata: { category: 'Clássico' },
    };

    vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/my-packs')) return { ok: true, json: async () => [] } as Response;
      if (url.includes('/author-profile')) return { ok: true, json: async () => mockProfile } as Response;
      if (url === '/api/v1/curriculum-packs' && init?.method === 'POST') {
        createRequest = { url, init };
        return { ok: true, json: async () => draftPack } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    render(<MyAuthoredPacksPanel availablePacks={[basePack]} />);

    await waitFor(() => expect(screen.getByTestId('create-community-pack-btn')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('create-community-pack-btn'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'public-base-1' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar rascunho/i }));

    await waitFor(() => expect(screen.getByText('Material salvo como rascunho.')).toBeInTheDocument());
    expect(createRequest).toBeDefined();
    const savedRequest = createRequest as { url: string; init?: RequestInit };
    expect(savedRequest.url).toBe('/api/v1/curriculum-packs');
    expect(JSON.parse(String(savedRequest.init?.body))).toMatchObject({
      code: 'CLASSICAL_BASE_AUTHOR',
      status: 'DRAFT',
      metadata: { category: 'Clássico' },
    });
  });

  it('edits and archives only an owned draft', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/my-packs')) return { ok: true, json: async () => [draftPack] } as Response;
      if (url.includes('/author-profile')) return { ok: true, json: async () => mockProfile } as Response;
      if (url.endsWith('/pack-draft-1') && init?.method === 'PATCH') {
        return { ok: true, json: async () => ({ ...draftPack, name: 'Nome editado' }) } as Response;
      }
      if (url.endsWith('/pack-draft-1/archive') && init?.method === 'POST') {
        return { ok: true, json: async () => ({ ...draftPack, status: 'ARCHIVED' }) } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<MyAuthoredPacksPanel />);
    await waitFor(() => expect(screen.getByTestId('edit-community-pack-btn-pack-draft-1')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('edit-community-pack-btn-pack-draft-1'));
    fireEvent.change(screen.getByTestId('community-pack-name-input'), { target: { value: 'Nome editado' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar rascunho/i }));
    await waitFor(() => expect(screen.getByText('Rascunho atualizado.')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('archive-community-pack-btn-pack-draft-1'));
    await waitFor(() => expect(screen.getByText('Material arquivado.')).toBeInTheDocument());
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/curriculum-packs/pack-draft-1/archive',
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    );
  });

  it('adds, reorders and saves the authored pack composition with a preview', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/my-packs')) return { ok: true, json: async () => [draftPack] } as Response;
      if (url.includes('/author-profile')) return { ok: true, json: async () => mockProfile } as Response;
      if (url.includes('/composition-catalog')) {
        return {
          ok: true,
          json: async () => [
            {
              definitionType: 'SkillDefinition',
              code: 'READING',
              version: 1,
              label: 'Leitura',
              description: null,
              status: 'PUBLISHED',
              schemaVersion: '1.0.0',
            },
            {
              definitionType: 'SkillDefinition',
              code: 'WRITING',
              version: 1,
              label: 'Escrita',
              description: null,
              status: 'PUBLISHED',
              schemaVersion: '1.0.0',
            },
          ],
        } as Response;
      }
      if (url.endsWith('/composition') && !init?.method) {
        return { ok: true, json: async () => ({ packId: 'pack-draft-1', revision: 0, items: [], preview: [] }) } as Response;
      }
      if (url.endsWith('/composition/revisions')) return { ok: true, json: async () => [] } as Response;
      if (url.endsWith('/composition') && init?.method === 'PUT') {
        return {
          ok: true,
          json: async () => ({
            packId: 'pack-draft-1',
            revision: 1,
            items: [
              { definitionType: 'SkillDefinition', code: 'WRITING', version: 1, position: 0 },
              { definitionType: 'SkillDefinition', code: 'READING', version: 1, position: 1 },
            ],
            preview: [],
          }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    render(<MyAuthoredPacksPanel />);
    await waitFor(() => expect(screen.getByTestId('edit-community-pack-btn-pack-draft-1')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('edit-community-pack-btn-pack-draft-1'));
    await waitFor(() => expect(screen.getByTestId('community-pack-composition-editor')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('add-composition-item-SkillDefinition-READING-1'));
    fireEvent.click(screen.getByTestId('add-composition-item-SkillDefinition-WRITING-1'));
    fireEvent.click(screen.getByTestId('move-composition-item-up-SkillDefinition-WRITING-1'));
    expect(screen.getByTestId('composition-preview')).toHaveTextContent('WRITING');
    fireEvent.click(screen.getByTestId('save-composition-btn'));

    await waitFor(() => expect(screen.getByTestId('composition-saved-alert')).toBeInTheDocument());
    const saveCall = fetchSpy.mock.calls.find(([request, requestInit]) => String(request).endsWith('/composition') && requestInit?.method === 'PUT');
    expect(saveCall).toBeDefined();
    expect(JSON.parse(String(saveCall?.[1]?.body))).toMatchObject({
      expectedRevision: 0,
      items: [
        { definitionType: 'SkillDefinition', code: 'WRITING', version: 1 },
        { definitionType: 'SkillDefinition', code: 'READING', version: 1 },
      ],
    });
  });
});
