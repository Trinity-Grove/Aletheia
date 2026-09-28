import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {
  CurriculumPackResponseDto,
  EvidenceTypeDefinitionResponseDto,
  RubricDefinitionResponseDto,
} from '@aletheia/contracts';
import { api, setApiAuthToken } from '../src/lib/api';
import { AdminCatalog } from '../src/components/catalog/admin-catalog';

describe('Seminary Theology Catalog and Curriculum Packs in Backoffice', () => {
  const mockTheologicalEssay: EvidenceTypeDefinitionResponseDto = {
    id: 'ev-theo-1',
    code: 'THEOLOGICAL_ESSAY',
    name: 'Ensaio Teológico Sistemático',
    description: 'Ensaio acadêmico sistemático com referências patrísticas e bíblicas',
    status: 'PUBLISHED',
    version: 1,
    schemaVersion: '1.0.0',
    metadata: {},
    createdAt: '2026-09-28T00:00:00.000Z',
  };

  const mockExegesisPaper: EvidenceTypeDefinitionResponseDto = {
    id: 'ev-theo-2',
    code: 'EXEGESIS_PAPER',
    name: 'Artigo Exegético Estruturado',
    description: 'Artigo exegético com base nas línguas bíblicas originais',
    status: 'PUBLISHED',
    version: 1,
    schemaVersion: '1.0.0',
    metadata: {},
    createdAt: '2026-09-28T00:00:00.000Z',
  };

  const mockGeneralEssay: EvidenceTypeDefinitionResponseDto = {
    id: 'ev-general-1',
    code: 'GENERAL_ESSAY',
    name: 'Redação Comum',
    description: 'Redação de tema livre',
    status: 'DRAFT',
    version: 1,
    schemaVersion: '1.0.0',
    metadata: {},
    createdAt: '2026-09-28T00:00:00.000Z',
  };

  const mockTheologyRubric: RubricDefinitionResponseDto = {
    id: 'rubric-theo-1',
    code: 'THEOLOGY_ACADEMIC_RIGOR_RUBRIC',
    name: 'Rubrica de Rigor Teológico e Exegético',
    description: 'Avaliação analítica de produções teológicas com 4 critérios ponderados',
    status: 'PUBLISHED',
    version: 1,
    schemaVersion: '1.0.0',
    metadata: {},
    createdAt: '2026-09-28T00:00:00.000Z',
  };

  const mockGeneralRubric: RubricDefinitionResponseDto = {
    id: 'rubric-general-1',
    code: 'GENERAL_RUBRIC',
    name: 'Rubrica Geral de Avaliação',
    description: 'Rubrica genérica sem pesos analíticos',
    status: 'PUBLISHED',
    version: 1,
    schemaVersion: '1.0.0',
    metadata: {},
    createdAt: '2026-09-28T00:00:00.000Z',
  };

  const mockSeminaryPack: CurriculumPackResponseDto = {
    id: 'pack-theo-adv-1',
    code: 'ADVANCED_SEMINARY_THEOLOGY',
    name: 'Módulo Teológico Avançado (Nível Seminário)',
    description: 'Formação teológica profunda cobrindo 4 ciclos e 24 disciplinas curriculares.',
    status: 'PUBLISHED',
    version: 1,
    schemaVersion: '1.0.0',
    metadata: {
      summary: '4 ciclos de concentração e 24 disciplinas curriculares',
      cycles: [
        { cycle: 1, name: 'Ciclo I: Fundamentos & Método' },
        { cycle: 2, name: 'Ciclo II: Teologia Sistemática I' },
        { cycle: 3, name: 'Ciclo III: Teologia Sistemática II' },
        { cycle: 4, name: 'Ciclo IV: Teologia Histórica, Pensamento & Prática' },
      ],
    },
    createdAt: '2026-09-28T00:00:00.000Z',
  };

  const mockClassicalPack: CurriculumPackResponseDto = {
    id: 'pack-classical-1',
    code: 'CLASSICAL_TRIVIUM',
    name: 'Classical Trivium Pack',
    description: 'Pacote curricular clássico focado em gramática, lógica e retórica.',
    status: 'DRAFT',
    version: 1,
    schemaVersion: '1.0.0',
    metadata: {},
    createdAt: '2026-09-20T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    setApiAuthToken(null);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('displays theological evidence types under evidence-type-definitions and filters by code or name', async () => {
    vi.spyOn(api, 'get').mockImplementation(async (path) => {
      if (path === '/admin/curriculum-definitions/evidence-type-definitions') {
        return [mockTheologicalEssay, mockExegesisPaper, mockGeneralEssay];
      }
      return [];
    });

    render(<AdminCatalog />);

    // Switch resource select to evidence-type-definitions
    fireEvent.change(screen.getByLabelText('Recurso'), {
      target: { value: 'evidence-type-definitions' },
    });

    // All evidence types initially present
    expect(await screen.findByText('Ensaio Teológico Sistemático')).toBeInTheDocument();
    expect(screen.getByText('THEOLOGICAL_ESSAY')).toBeInTheDocument();
    expect(screen.getByText('Artigo Exegético Estruturado')).toBeInTheDocument();
    expect(screen.getByText('EXEGESIS_PAPER')).toBeInTheDocument();
    expect(screen.getByText('Redação Comum')).toBeInTheDocument();

    // Verify filter input exists
    const filterInput = screen.getByTestId('catalog-filter-input');
    expect(filterInput).toBeInTheDocument();

    // Filter by code "THEOLOGICAL"
    fireEvent.change(filterInput, { target: { value: 'THEOLOGICAL' } });
    expect(screen.getByText('THEOLOGICAL_ESSAY')).toBeInTheDocument();
    expect(screen.queryByText('EXEGESIS_PAPER')).not.toBeInTheDocument();
    expect(screen.queryByText('Redação Comum')).not.toBeInTheDocument();

    // Filter by name case-insensitive "exegético"
    fireEvent.change(filterInput, { target: { value: 'exegético' } });
    expect(screen.getByText('Artigo Exegético Estruturado')).toBeInTheDocument();
    expect(screen.queryByText('THEOLOGICAL_ESSAY')).not.toBeInTheDocument();
    expect(screen.queryByText('Redação Comum')).not.toBeInTheDocument();
  });

  it('displays theological rubric definitions and filters by code', async () => {
    vi.spyOn(api, 'get').mockImplementation(async (path) => {
      if (path === '/admin/curriculum-definitions/rubric-definitions') {
        return [mockTheologyRubric, mockGeneralRubric];
      }
      return [];
    });

    render(<AdminCatalog />);

    fireEvent.change(screen.getByLabelText('Recurso'), {
      target: { value: 'rubric-definitions' },
    });

    expect(await screen.findByText('Rubrica de Rigor Teológico e Exegético')).toBeInTheDocument();
    expect(screen.getByText('THEOLOGY_ACADEMIC_RIGOR_RUBRIC')).toBeInTheDocument();
    expect(screen.getByText('Rubrica Geral de Avaliação')).toBeInTheDocument();

    const filterInput = screen.getByTestId('catalog-filter-input');
    fireEvent.change(filterInput, { target: { value: 'RIGOR' } });

    expect(screen.getByText('THEOLOGY_ACADEMIC_RIGOR_RUBRIC')).toBeInTheDocument();
    expect(screen.queryByText('GENERAL_RUBRIC')).not.toBeInTheDocument();
  });

  it('switches to curriculum-packs, fetches from /admin/curriculum-packs, and displays ADVANCED_SEMINARY_THEOLOGY with summary', async () => {
    vi.spyOn(api, 'get').mockImplementation(async (path) => {
      if (path === '/admin/curriculum-packs') {
        return [mockSeminaryPack, mockClassicalPack];
      }
      return [];
    });

    render(<AdminCatalog />);

    // Select curriculum-packs
    fireEvent.change(screen.getByLabelText('Recurso'), {
      target: { value: 'curriculum-packs' },
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/admin/curriculum-packs');
    });

    expect(await screen.findByText('Módulo Teológico Avançado (Nível Seminário)')).toBeInTheDocument();
    expect(screen.getByText('ADVANCED_SEMINARY_THEOLOGY')).toBeInTheDocument();
    expect(screen.getByText('Classical Trivium Pack')).toBeInTheDocument();
    expect(screen.getByText('CLASSICAL_TRIVIUM')).toBeInTheDocument();

    // Displays metadata summary and description
    expect(screen.getByText('4 ciclos de concentração e 24 disciplinas curriculares')).toBeInTheDocument();
    expect(
      screen.getByText('Formação teológica profunda cobrindo 4 ciclos e 24 disciplinas curriculares.'),
    ).toBeInTheDocument();
  });

  it('filters curriculum packs by search query and shows empty state when no match', async () => {
    vi.spyOn(api, 'get').mockImplementation(async (path) => {
      if (path === '/admin/curriculum-packs') {
        return [mockSeminaryPack, mockClassicalPack];
      }
      return [];
    });

    render(<AdminCatalog />);

    fireEvent.change(screen.getByLabelText('Recurso'), {
      target: { value: 'curriculum-packs' },
    });

    await screen.findByText('Módulo Teológico Avançado (Nível Seminário)');

    const filterInput = screen.getByTestId('catalog-filter-input');
    fireEvent.change(filterInput, { target: { value: 'SEMINARY' } });

    expect(screen.getByText('ADVANCED_SEMINARY_THEOLOGY')).toBeInTheDocument();
    expect(screen.queryByText('CLASSICAL_TRIVIUM')).not.toBeInTheDocument();

    // Query with no match
    fireEvent.change(filterInput, { target: { value: 'NON_EXISTENT_QUERY' } });
    expect(screen.queryByText('ADVANCED_SEMINARY_THEOLOGY')).not.toBeInTheDocument();
    expect(screen.queryByText('CLASSICAL_TRIVIUM')).not.toBeInTheDocument();
    expect(screen.getByText(/Nenhuma definição/i)).toBeInTheDocument();
  });

  it('allows creating a draft curriculum pack via /admin/curriculum-packs', async () => {
    vi.spyOn(api, 'get').mockImplementation(async (path) => {
      if (path === '/admin/curriculum-packs') {
        return [mockSeminaryPack];
      }
      return [];
    });

    const newCreatedPack: CurriculumPackResponseDto = {
      id: 'pack-new-1',
      code: 'HERMENEUTICS_FOUNDATIONS',
      name: 'Fundamentos de Hermenêutica',
      description: 'Pacote introdutório à hermenêutica reformada',
      version: 1,
      status: 'DRAFT',
      schemaVersion: '1.0.0',
      metadata: {},
      createdAt: '2026-09-28T12:00:00.000Z',
    };

    vi.spyOn(api, 'post').mockResolvedValue(newCreatedPack);

    render(<AdminCatalog />);

    fireEvent.change(screen.getByLabelText('Recurso'), {
      target: { value: 'curriculum-packs' },
    });

    await screen.findByText('Módulo Teológico Avançado (Nível Seminário)');

    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'HERMENEUTICS_FOUNDATIONS' } });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Fundamentos de Hermenêutica' } });
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: 'Pacote introdutório à hermenêutica reformada' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Criar rascunho' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/admin/curriculum-packs',
        expect.objectContaining({
          code: 'HERMENEUTICS_FOUNDATIONS',
          name: 'Fundamentos de Hermenêutica',
          description: 'Pacote introdutório à hermenêutica reformada',
          version: 1,
          status: 'DRAFT',
        }),
      );
    });

    expect(await screen.findByText('Fundamentos de Hermenêutica')).toBeInTheDocument();
  });
});
