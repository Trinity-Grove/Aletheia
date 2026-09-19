import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CurriculumPacksGallery } from '../src/components/curriculum/curriculum-packs-gallery';

const mockPublishedPacks = [
  {
    id: 'pack-1',
    code: 'CLASSICAL_TRIVIUM',
    name: 'Trivium Clássico & Artes Liberais',
    description: 'Gramática, Lógica e Retórica integrados à formação cristã com estudos clássicos.',
    version: 1,
    status: 'PUBLISHED',
    schemaVersion: '1.0.0',
    metadata: {
      category: 'Metodologia Clássica',
      targetStages: ['GRAMMAR', 'LOGIC'],
      estimatedLessons: 48,
    },
    createdAt: '2026-09-10T00:00:00.000Z',
    updatedAt: '2026-09-10T00:00:00.000Z',
  },
  {
    id: 'pack-2',
    code: 'FAMILY_FINANCE_STEWARDSHIP',
    name: 'Educação Financeira & Mordomia Bíblica',
    description: 'Princípios bíblicos de finanças, orçamento doméstico, poupança e generosidade para jovens.',
    version: 1,
    status: 'PUBLISHED',
    schemaVersion: '1.0.0',
    metadata: {
      category: 'Ofícios & Prática',
      targetStages: ['RHETORIC'],
      estimatedLessons: 24,
    },
    createdAt: '2026-09-12T00:00:00.000Z',
    updatedAt: '2026-09-12T00:00:00.000Z',
  },
];

const mockInstalledPacks = [
  {
    id: 'inst-1',
    familyId: 'fam-1',
    sourcePackId: 'pack-1',
    sourcePackCode: 'CLASSICAL_TRIVIUM',
    sourcePackVersion: 1,
    revision: 1,
    document: {
      pack: { code: 'CLASSICAL_TRIVIUM', name: 'Trivium Clássico & Artes Liberais', version: 1 },
      items: [],
    },
    createdAt: '2026-09-15T00:00:00.000Z',
    updatedAt: '2026-09-15T00:00:00.000Z',
  },
];

describe('CurriculumPacksGallery (Task 7 & 8: Plugins / Pacotes Curriculares)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders available curriculum packs gallery with installed status', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPublishedPacks,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockInstalledPacks,
      } as Response);

    render(<CurriculumPacksGallery familyId="fam-1" />);

    expect(screen.getByTestId('curriculum-packs-gallery')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Trivium Clássico & Artes Liberais')).toBeInTheDocument();
      expect(screen.getByText('Educação Financeira & Mordomia Bíblica')).toBeInTheDocument();
    });

    // Verify correct family-scoped available endpoint was called
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/families/fam-1/curriculum-packs/available',
      expect.objectContaining({ credentials: 'include' })
    );

    // pack-1 is already installed
    expect(screen.getByTestId('installed-badge-pack-1')).toBeInTheDocument();
    expect(screen.getByTestId('manage-pack-btn-pack-1')).toBeInTheDocument();

    // pack-2 is available for install
    expect(screen.getByTestId('install-pack-btn-pack-2')).toBeInTheDocument();
  });

  it('allows guardian to install an available curriculum pack into family', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPublishedPacks,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'inst-2',
          familyId: 'fam-1',
          sourcePackId: 'pack-2',
          sourcePackCode: 'FAMILY_FINANCE_STEWARDSHIP',
          sourcePackVersion: 1,
          revision: 1,
          document: {
            pack: { code: 'FAMILY_FINANCE_STEWARDSHIP', name: 'Educação Financeira & Mordomia Bíblica', version: 1 },
            items: [],
          },
          createdAt: '2026-09-17T00:00:00.000Z',
          updatedAt: '2026-09-17T00:00:00.000Z',
        }),
      } as Response);

    render(<CurriculumPacksGallery familyId="fam-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('install-pack-btn-pack-2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('install-pack-btn-pack-2'));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/v1/families/fam-1/curriculum-packs',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ sourcePackId: 'pack-2' }),
        })
      );
      expect(screen.getByTestId('installed-badge-pack-2')).toBeInTheDocument();
      expect(screen.getByTestId('manage-pack-btn-pack-2')).toBeInTheDocument();
    });
  });

  it('opens family pack management modal, displays media list, and attaches new media link', async () => {
    let addMediaPayload: Record<string, unknown> | null = null;

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/available')) {
        return { ok: true, json: async () => mockPublishedPacks } as Response;
      }
      if (url.endsWith('/curriculum-packs')) {
        return { ok: true, json: async () => mockInstalledPacks } as Response;
      }
      if (url.includes('/media') && init?.method === 'POST') {
        addMediaPayload = JSON.parse(String(init.body));
        return {
          ok: true,
          status: 201,
          json: async () => ({
            id: 'media-new-1',
            familyCurriculumPackId: 'inst-1',
            mediaType: 'DOCUMENT',
            sourceType: 'EXTERNAL_URL',
            title: 'Guia de Leitura em PDF',
            url: 'https://exemplo.com/guia.pdf',
            description: 'Guia complementar de apoio',
            createdAt: '2026-09-17T12:00:00.000Z',
            updatedAt: '2026-09-17T12:00:00.000Z',
          }),
        } as Response;
      }
      if (url.includes('/media')) {
        return {
          ok: true,
          json: async () => [
            {
              id: 'media-existing-1',
              familyCurriculumPackId: 'inst-1',
              mediaType: 'IMAGE',
              sourceType: 'EXTERNAL_URL',
              title: 'Mapa do Trivium Clássico',
              url: 'https://exemplo.com/mapa.png',
              description: 'Infográfico explicativo',
              createdAt: '2026-09-16T10:00:00.000Z',
              updatedAt: '2026-09-16T10:00:00.000Z',
            },
          ],
        } as Response;
      }
      if (url.includes('/revisions')) {
        return {
          ok: true,
          json: async () => [
            {
              id: 'rev-1',
              familyCurriculumPackId: 'inst-1',
              revision: 1,
              document: { pack: { code: 'CLASSICAL_TRIVIUM', name: 'Trivium Clássico' } },
              createdAt: '2026-09-15T00:00:00.000Z',
            },
          ],
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    render(<CurriculumPacksGallery familyId="fam-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('manage-pack-btn-pack-1')).toBeInTheDocument();
    });

    // Open management modal
    fireEvent.click(screen.getByTestId('manage-pack-btn-pack-1'));

    expect(screen.getByTestId('family-pack-modal')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/v1/families/fam-1/curriculum-packs/inst-1/media',
        expect.objectContaining({ credentials: 'include' })
      );
      expect(screen.getByText('Mapa do Trivium Clássico')).toBeInTheDocument();
    });

    // Fill in new media form
    fireEvent.change(screen.getByTestId('pack-media-type-select'), {
      target: { value: 'DOCUMENT' },
    });
    fireEvent.change(screen.getByTestId('pack-media-title-input'), {
      target: { value: 'Guia de Leitura em PDF' },
    });
    fireEvent.change(screen.getByTestId('pack-media-url-input'), {
      target: { value: 'https://exemplo.com/guia.pdf' },
    });
    fireEvent.change(screen.getByTestId('pack-media-description-input'), {
      target: { value: 'Guia complementar de apoio' },
    });

    // Click attach button
    fireEvent.click(screen.getByTestId('add-pack-media-btn'));

    await waitFor(() => {
      expect(addMediaPayload).toEqual({
        sourceType: 'EXTERNAL_URL',
        mediaType: 'DOCUMENT',
        title: 'Guia de Leitura em PDF',
        url: 'https://exemplo.com/guia.pdf',
        description: 'Guia complementar de apoio',
      });
      expect(screen.getByText('Guia de Leitura em PDF')).toBeInTheDocument();
      expect(screen.getByTestId('pack-modal-success')).toHaveTextContent(/Mídia complementar anexada com sucesso/i);
    });
  });

  it('switches to revisions tab and displays pack revision history', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/available')) {
        return { ok: true, json: async () => mockPublishedPacks } as Response;
      }
      if (url.endsWith('/curriculum-packs')) {
        return { ok: true, json: async () => mockInstalledPacks } as Response;
      }
      if (url.includes('/media')) {
        return { ok: true, json: async () => [] } as Response;
      }
      if (url.includes('/revisions')) {
        return {
          ok: true,
          json: async () => [
            {
              id: 'rev-2',
              familyCurriculumPackId: 'inst-1',
              revision: 2,
              document: { pack: { code: 'CLASSICAL_TRIVIUM', name: 'Trivium Clássico' } },
              createdAt: '2026-09-16T12:00:00.000Z',
            },
            {
              id: 'rev-1',
              familyCurriculumPackId: 'inst-1',
              revision: 1,
              document: { pack: { code: 'CLASSICAL_TRIVIUM', name: 'Trivium Clássico' } },
              createdAt: '2026-09-15T00:00:00.000Z',
            },
          ],
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    render(<CurriculumPacksGallery familyId="fam-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('manage-pack-btn-pack-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-pack-btn-pack-1'));

    expect(screen.getByTestId('family-pack-modal')).toBeInTheDocument();

    // Click on revisions tab
    fireEvent.click(screen.getByTestId('pack-modal-tab-revisions'));

    await waitFor(() => {
      expect(screen.getByTestId('pack-revisions-list')).toBeInTheDocument();
      expect(screen.getByText(/Revisão 2/i)).toBeInTheDocument();
      expect(screen.getByText(/Revisão 1/i)).toBeInTheDocument();
    });
  });

  it('allows deleting an attached media from the family pack', async () => {
    let deletedId: string | null = null;

    vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/available')) {
        return { ok: true, json: async () => mockPublishedPacks } as Response;
      }
      if (url.endsWith('/curriculum-packs')) {
        return { ok: true, json: async () => mockInstalledPacks } as Response;
      }
      if (url.includes('/media/media-to-delete') && init?.method === 'DELETE') {
        deletedId = 'media-to-delete';
        return { ok: true, status: 204 } as Response;
      }
      if (url.includes('/media')) {
        return {
          ok: true,
          json: async () => [
            {
              id: 'media-to-delete',
              familyCurriculumPackId: 'inst-1',
              mediaType: 'IMAGE',
              sourceType: 'EXTERNAL_URL',
              title: 'Imagem Para Exclusão',
              url: 'https://exemplo.com/del.png',
              description: null,
              createdAt: '2026-09-16T10:00:00.000Z',
              updatedAt: '2026-09-16T10:00:00.000Z',
            },
          ],
        } as Response;
      }
      if (url.includes('/revisions')) {
        return { ok: true, json: async () => [] } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    render(<CurriculumPacksGallery familyId="fam-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('manage-pack-btn-pack-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-pack-btn-pack-1'));

    await waitFor(() => {
      expect(screen.getByText('Imagem Para Exclusão')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-pack-media-btn-media-to-delete'));

    await waitFor(() => {
      expect(deletedId).toBe('media-to-delete');
      expect(screen.queryByText('Imagem Para Exclusão')).not.toBeInTheDocument();
      expect(screen.getByTestId('pack-modal-success')).toHaveTextContent(/Mídia removida com sucesso/i);
    });
  });

  it('allows customizing pack content in editor tab and saving a new revision', async () => {
    let putPayload: any = null;

    const firstPack = mockInstalledPacks[0]!;
    const updatedPack = {
      ...firstPack,
      revision: 2,
      document: {
        ...firstPack.document,
        pack: {
          ...firstPack.document.pack,
          name: 'Trivium Clássico Customizado da Família Silva',
          description: 'Adaptação especial com ênfase em história antiga.',
        },
      },
    };

    vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/available')) {
        return { ok: true, json: async () => mockPublishedPacks } as Response;
      }
      if (url.endsWith('/curriculum-packs')) {
        return { ok: true, json: async () => mockInstalledPacks } as Response;
      }
      if (url.includes('/curriculum-packs/inst-1') && init?.method === 'PUT') {
        putPayload = JSON.parse(String(init?.body));
        return {
          ok: true,
          json: async () => updatedPack,
        } as Response;
      }
      if (url.includes('/media')) {
        return { ok: true, json: async () => [] } as Response;
      }
      if (url.includes('/revisions')) {
        return {
          ok: true,
          json: async () => [
            {
              id: 'rev-2',
              familyCurriculumPackId: 'inst-1',
              revision: 2,
              createdAt: '2026-09-17T15:00:00.000Z',
            },
            {
              id: 'rev-1',
              familyCurriculumPackId: 'inst-1',
              revision: 1,
              createdAt: '2026-09-15T00:00:00.000Z',
            },
          ],
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    render(<CurriculumPacksGallery familyId="fam-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('manage-pack-btn-pack-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-pack-btn-pack-1'));

    // Open Editor tab
    const editorTab = screen.getByTestId('pack-modal-tab-editor');
    expect(editorTab).toBeInTheDocument();
    fireEvent.click(editorTab);

    // Verify inputs populated
    const nameInput = screen.getByTestId('pack-edit-name-input');
    expect(nameInput).toHaveValue('Trivium Clássico & Artes Liberais');

    // Modify name and notes
    fireEvent.change(nameInput, {
      target: { value: 'Trivium Clássico Customizado da Família Silva' },
    });

    const notesInput = screen.getByTestId('pack-edit-notes-input');
    fireEvent.change(notesInput, {
      target: { value: 'Enfatizar leitura em voz alta às quintas.' },
    });

    // Submit save revision
    const saveBtn = screen.getByTestId('save-pack-revision-btn');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(putPayload).toBeDefined();
      expect(putPayload.document.pack.name).toBe('Trivium Clássico Customizado da Família Silva');
      expect(putPayload.document.pack.metadata.familyNotes).toBe('Enfatizar leitura em voz alta às quintas.');
      expect(screen.getByTestId('pack-edit-success-alert')).toBeInTheDocument();
      expect(screen.getByText(/Nova revisão do pacote salva com sucesso!/i)).toBeInTheDocument();
    });

    // Check that gallery card badge updated to Rev. 2
    expect(screen.getByTestId('installed-badge-pack-1')).toHaveTextContent(/Rev\. 2/i);
  });

  it('displays error alert when revision save fails or name is empty', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/available')) {
        return { ok: true, json: async () => mockPublishedPacks } as Response;
      }
      if (url.endsWith('/curriculum-packs')) {
        return { ok: true, json: async () => mockInstalledPacks } as Response;
      }
      if (url.includes('/curriculum-packs/inst-1') && init?.method === 'PUT') {
        return {
          ok: false,
          json: async () => ({ message: 'Documento inválido rejeitado pelo servidor.' }),
        } as Response;
      }
      if (url.includes('/media')) {
        return { ok: true, json: async () => [] } as Response;
      }
      if (url.includes('/revisions')) {
        return { ok: true, json: async () => [] } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    render(<CurriculumPacksGallery familyId="fam-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('manage-pack-btn-pack-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-pack-btn-pack-1'));

    fireEvent.click(screen.getByTestId('pack-modal-tab-editor'));

    const nameInput = screen.getByTestId('pack-edit-name-input');
    const saveBtn = screen.getByTestId('save-pack-revision-btn');

    // Validation: empty name
    fireEvent.change(nameInput, { target: { value: '   ' } });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByTestId('pack-edit-error-alert')).toHaveTextContent(
        'O nome do pacote não pode ficar vazio.'
      );
    });

    // Backend error
    fireEvent.change(nameInput, { target: { value: 'Nome Válido' } });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByTestId('pack-edit-error-alert')).toHaveTextContent(
        'Documento inválido rejeitado pelo servidor.'
      );
    });
  });
});
