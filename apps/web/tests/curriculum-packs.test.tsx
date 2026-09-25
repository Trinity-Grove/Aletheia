import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CurriculumPacksGallery } from '../src/components/curriculum/curriculum-packs-gallery';
import { AuthorTrustBadge } from '../src/components/curriculum/author-trust-badge';
import { LocaleProvider } from '../src/lib/i18n/locale-context';

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
    localStorage.clear();
    document.documentElement.lang = 'pt-BR';
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

    const installedPack = mockInstalledPacks[0]!;
    const updatedPack = {
      ...installedPack,
      revision: 2,
      document: {
        ...installedPack.document,
        pack: {
          ...installedPack.document.pack,
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

  describe('AuthorTrustBadge e Moderação Comunitária (Task 7)', () => {
    it('renders AuthorTrustBadge for each tier with localized labels and tooltip', () => {
      const { rerender } = render(
        <LocaleProvider>
          <AuthorTrustBadge tier="NOVICE" trustScore={45} />
        </LocaleProvider>
      );

      const noviceBadge = screen.getByTestId('author-trust-badge');
      expect(noviceBadge).toHaveAttribute('data-tier', 'NOVICE');
      expect(noviceBadge).toHaveTextContent('Autor Iniciante');
      expect(noviceBadge).toHaveAttribute('title', 'Índice de Confiabilidade: 45/100');

      rerender(
        <LocaleProvider>
          <AuthorTrustBadge tier="VERIFIED" trustScore={75} />
        </LocaleProvider>
      );
      const verifiedBadge = screen.getByTestId('author-trust-badge');
      expect(verifiedBadge).toHaveAttribute('data-tier', 'VERIFIED');
      expect(verifiedBadge).toHaveTextContent('Autor Verificado');
      expect(verifiedBadge).toHaveAttribute('title', 'Índice de Confiabilidade: 75/100');

      rerender(
        <LocaleProvider>
          <AuthorTrustBadge tier="TRUSTED" trustScore={95} showScore={true} />
        </LocaleProvider>
      );
      const trustedBadge = screen.getByTestId('author-trust-badge');
      expect(trustedBadge).toHaveAttribute('data-tier', 'TRUSTED');
      expect(trustedBadge).toHaveTextContent('Autor Confiável');
      expect(trustedBadge).toHaveTextContent('(95)');
      expect(trustedBadge).toHaveAttribute('title', 'Índice de Confiabilidade: 95/100');
    });

    it('renders AuthorTrustBadge in english and spanish locales', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount } = render(
        <LocaleProvider>
          <AuthorTrustBadge tier="TRUSTED" trustScore={90} />
        </LocaleProvider>
      );
      expect(screen.getByTestId('author-trust-badge')).toHaveTextContent('Trusted Author');
      expect(screen.getByTestId('author-trust-badge')).toHaveAttribute('title', 'Trust Score: 90/100');
      unmount();

      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <AuthorTrustBadge tier="TRUSTED" trustScore={90} />
        </LocaleProvider>
      );
      expect(screen.getByTestId('author-trust-badge')).toHaveTextContent('Autor Confiable');
      expect(screen.getByTestId('author-trust-badge')).toHaveAttribute('title', 'Índice de Confianza: 90/100');
    });

    it('renders AuthorTrustBadge on pack cards in CurriculumPacksGallery', async () => {
      const packsWithTiers = [
        {
          ...mockPublishedPacks[0]!,
          metadata: {
            ...mockPublishedPacks[0]!.metadata,
            authorTrustTier: 'TRUSTED',
            authorTrustScore: 92,
          },
        },
        {
          ...mockPublishedPacks[1]!,
          metadata: {
            ...mockPublishedPacks[1]!.metadata,
            authorTrustTier: 'VERIFIED',
            authorTrustScore: 78,
          },
        },
      ];

      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => packsWithTiers,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as Response);

      render(
        <LocaleProvider>
          <CurriculumPacksGallery familyId="fam-1" />
        </LocaleProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Trivium Clássico & Artes Liberais')).toBeInTheDocument();
      });

      const badges = screen.getAllByTestId('author-trust-badge');
      expect(badges.length).toBe(2);
      expect(badges[0]).toHaveAttribute('data-tier', 'TRUSTED');
      expect(badges[0]).toHaveTextContent('Autor Confiável');
      expect(badges[0]).toHaveAttribute('title', 'Índice de Confiabilidade: 92/100');
      expect(badges[1]).toHaveAttribute('data-tier', 'VERIFIED');
      expect(badges[1]).toHaveTextContent('Autor Verificado');
      expect(badges[1]).toHaveAttribute('title', 'Índice de Confiabilidade: 78/100');
    });

    it('opens PackReportModal when report button is clicked and displays form fields', async () => {
      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPublishedPacks,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as Response);

      render(
        <LocaleProvider>
          <CurriculumPacksGallery familyId="fam-1" />
        </LocaleProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('report-pack-btn-pack-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('report-pack-btn-pack-1'));

      expect(screen.getByTestId('pack-report-modal')).toBeInTheDocument();
      expect(screen.getByText('Denunciar Pacote Curricular')).toBeInTheDocument();
      expect(screen.getByTestId('report-reason-select')).toBeInTheDocument();
      expect(screen.getByTestId('report-details-textarea')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-report-btn')).toBeInTheDocument();
      expect(screen.getByTestId('submit-report-btn')).toBeInTheDocument();

      // Check default reason option
      expect(screen.getByTestId('report-reason-select')).toHaveValue('SPAM_COMMERCIAL');

      // Click cancel to close
      fireEvent.click(screen.getByTestId('cancel-report-btn'));
      expect(screen.queryByTestId('pack-report-modal')).not.toBeInTheDocument();
    });

    it('submits pack report with expected payload to /api/v1/curriculum-packs/:id/reports', async () => {
      let reportCall: { url: string; init?: RequestInit } | null = null;

      vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
        const url = String(input);
        if (url.includes('/available')) {
          return { ok: true, json: async () => mockPublishedPacks } as Response;
        }
        if (url.endsWith('/curriculum-packs')) {
          return { ok: true, json: async () => [] } as Response;
        }
        if (url.includes('/reports') && init?.method === 'POST') {
          reportCall = { url, init };
          return {
            ok: true,
            status: 201,
            json: async () => ({
              id: 'rep-1',
              packId: 'pack-1',
              reason: 'HARMFUL_INAPPROPRIATE',
              details: 'Conteúdo contém erros doutrinários graves.',
              status: 'OPEN',
            }),
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      render(
        <LocaleProvider>
          <CurriculumPacksGallery familyId="fam-1" />
        </LocaleProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('report-pack-btn-pack-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('report-pack-btn-pack-1'));

      expect(screen.getByTestId('pack-report-modal')).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('report-reason-select'), {
        target: { value: 'HARMFUL_INAPPROPRIATE' },
      });
      fireEvent.change(screen.getByTestId('report-details-textarea'), {
        target: { value: 'Conteúdo contém erros doutrinários graves.' },
      });

      fireEvent.click(screen.getByTestId('submit-report-btn'));

      await waitFor(() => {
        expect(reportCall).toBeDefined();
        expect(reportCall?.url).toBe('/api/v1/curriculum-packs/pack-1/reports');
        expect(reportCall?.init?.credentials).toBe('include');
        expect(reportCall?.init?.headers).toEqual(
          expect.objectContaining({
            'Content-Type': 'application/json',
            'x-family-id': 'fam-1',
          })
        );
        const parsedBody = JSON.parse(String(reportCall?.init?.body));
        expect(parsedBody).toEqual({
          reason: 'HARMFUL_INAPPROPRIATE',
          details: 'Conteúdo contém erros doutrinários graves.',
          familyId: 'fam-1',
        });
        expect(screen.getByTestId('report-success-alert')).toBeInTheDocument();
        expect(screen.getByText('Denúncia enviada aos moderadores da plataforma.')).toBeInTheDocument();
      });
    });

    it('handles 409 conflict when family has already reported the pack', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
        const url = String(input);
        if (url.includes('/available')) {
          return { ok: true, json: async () => mockPublishedPacks } as Response;
        }
        if (url.endsWith('/curriculum-packs')) {
          return { ok: true, json: async () => [] } as Response;
        }
        if (url.includes('/reports') && init?.method === 'POST') {
          return {
            ok: false,
            status: 409,
            json: async () => ({ message: 'Report conflict' }),
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      render(
        <LocaleProvider>
          <CurriculumPacksGallery familyId="fam-1" />
        </LocaleProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('report-pack-btn-pack-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('report-pack-btn-pack-1'));

      fireEvent.click(screen.getByTestId('submit-report-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('report-conflict-alert')).toBeInTheDocument();
        expect(screen.getByText('Sua família já enviou uma denúncia para este pacote.')).toBeInTheDocument();
      });
    });

    it('handles generic error on report failure', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
        const url = String(input);
        if (url.includes('/available')) {
          return { ok: true, json: async () => mockPublishedPacks } as Response;
        }
        if (url.endsWith('/curriculum-packs')) {
          return { ok: true, json: async () => [] } as Response;
        }
        if (url.includes('/reports') && init?.method === 'POST') {
          return {
            ok: false,
            status: 500,
            json: async () => ({ message: 'Internal server error' }),
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      render(
        <LocaleProvider>
          <CurriculumPacksGallery familyId="fam-1" />
        </LocaleProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('report-pack-btn-pack-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('report-pack-btn-pack-1'));

      fireEvent.click(screen.getByTestId('submit-report-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('report-error-alert')).toBeInTheDocument();
        expect(screen.getByText('Falha ao enviar denúncia. Tente novamente mais tarde.')).toBeInTheDocument();
      });
    });
  });

  describe('Publicar pacote customizado na comunidade (issue #244)', () => {
    it('publishes an installed pack via the modal and shows a success message', async () => {
      const publishedPack = {
        id: 'community-pack-1',
        code: 'MY.FAMILY.PACK',
        version: 1,
        status: 'DRAFT',
        schemaVersion: '1.0.0',
        name: 'Meu Pacote de Família',
        description: null,
        metadata: {},
        authorUserId: 'user-1',
        moderationStatus: 'DRAFT',
        createdAt: '2026-09-25T00:00:00.000Z',
        publishedAt: null,
        deprecatedAt: null,
      };

      vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
        const url = String(input);
        if (url.includes('/available')) {
          return { ok: true, json: async () => mockPublishedPacks } as Response;
        }
        if (url.endsWith('/curriculum-packs')) {
          return { ok: true, json: async () => mockInstalledPacks } as Response;
        }
        if (url.includes('/publish-to-community') && init?.method === 'POST') {
          return { ok: true, status: 201, json: async () => publishedPack } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      render(<CurriculumPacksGallery familyId="fam-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('publish-to-community-btn-pack-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('publish-to-community-btn-pack-1'));

      expect(screen.getByTestId('publish-to-community-modal')).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('publish-code-input'), {
        target: { value: 'my.family.pack' },
      });
      fireEvent.change(screen.getByTestId('publish-name-input'), {
        target: { value: 'Meu Pacote de Família' },
      });

      fireEvent.click(screen.getByTestId('submit-publish-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('publish-success-alert')).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/families/fam-1/curriculum-packs/inst-1/publish-to-community',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ code: 'MY.FAMILY.PACK', name: 'Meu Pacote de Família' }),
        })
      );
    });

    it('shows a conflict message when the chosen code already exists', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
        const url = String(input);
        if (url.includes('/available')) {
          return { ok: true, json: async () => mockPublishedPacks } as Response;
        }
        if (url.endsWith('/curriculum-packs')) {
          return { ok: true, json: async () => mockInstalledPacks } as Response;
        }
        if (url.includes('/publish-to-community') && init?.method === 'POST') {
          return { ok: false, status: 400, json: async () => ({ message: 'Code taken' }) } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      render(<CurriculumPacksGallery familyId="fam-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('publish-to-community-btn-pack-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('publish-to-community-btn-pack-1'));
      fireEvent.change(screen.getByTestId('publish-code-input'), { target: { value: 'TAKEN' } });
      fireEvent.change(screen.getByTestId('publish-name-input'), { target: { value: 'X' } });
      fireEvent.click(screen.getByTestId('submit-publish-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('publish-conflict-alert')).toBeInTheDocument();
      });
    });

    it('switches to the "Meus Packs Comunitários" tab and renders the author panel', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
        const url = String(input);
        if (url.includes('/available')) {
          return { ok: true, json: async () => mockPublishedPacks } as Response;
        }
        if (url.endsWith('/curriculum-packs')) {
          return { ok: true, json: async () => [] } as Response;
        }
        if (url.includes('/curriculum-packs/my-packs')) {
          return { ok: true, json: async () => [] } as Response;
        }
        if (url.includes('/curriculum-packs/author-profile')) {
          return {
            ok: true,
            json: async () => ({
              userId: 'user-1',
              trustScore: 10,
              tier: 'NOVICE',
              approvedPacksCount: 0,
              rejectedPacksCount: 0,
              upheldReportsCount: 0,
              lastEvaluatedAt: '2026-09-25T00:00:00.000Z',
              createdAt: '2026-09-25T00:00:00.000Z',
              updatedAt: '2026-09-25T00:00:00.000Z',
            }),
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      render(<CurriculumPacksGallery familyId="fam-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('curriculum-view-tab-my-packs')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('curriculum-view-tab-my-packs'));

      await waitFor(() => {
        expect(screen.getByTestId('my-authored-packs-panel')).toBeInTheDocument();
        expect(screen.getByTestId('my-authored-packs-empty')).toBeInTheDocument();
      });
    });
  });
});
