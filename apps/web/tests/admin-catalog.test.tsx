import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminCatalogPage from '../app/(dashboard)/admin/catalog/page';
import { AuthContext, type AuthContextValue } from '../src/lib/auth/auth-context';
import { api } from '../src/lib/api';

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => '/admin/catalog', useRouter: () => router }));

const base = '/admin/curriculum-definitions';
const domain = { id: '00000000-0000-4000-8000-000000000001', code: 'MUSIC', name: 'Música', status: 'DRAFT', version: 1 };

function session(isPlatformAdmin = true, status: AuthContextValue['status'] = 'authenticated'): AuthContextValue {
  return {
    status,
    user:
      status === 'authenticated'
        ? {
            id: 'admin',
            email: 'admin@example.com',
            fullName: 'Admin',
            emailVerified: true,
            mfaEnabled: false,
            isPlatformAdmin,
            createdAt: '',
          }
        : null,
    token: null,
    activeFamilyId: null,
    activeFamily: null,
    families: [],
    activeRole: null,
    login: vi.fn(),
    verifyMfa: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    selectFamily: vi.fn(),
    refreshSession: vi.fn(),
    setActiveFamilyFromCreated: vi.fn(),
    changePassword: vi.fn(),
    changeEmail: vi.fn(),
  };
}

function page(value = session()) {
  return (
    <AuthContext.Provider value={value}>
      <AdminCatalogPage />
    </AuthContext.Provider>
  );
}

beforeEach(() => {
  vi.spyOn(api, 'get').mockImplementation(async (path) => {
    if (path === `${base}/learning-domains`) return [domain];
    if (path === '/admin/curriculum-definitions/version-operations/logs') return [];
    return [];
  });
  vi.spyOn(api, 'post').mockImplementation(async (path, body) => {
    if (path === '/admin/curriculum-definitions/version-operations/rollback') {
      const payload = body as { entityType: string; code: string; version: number };
      return {
        entityType: payload.entityType,
        code: payload.code,
        rolledBackVersion: payload.version,
        newCurrentVersion: 1,
        logId: '11111111-1111-1111-1111-111111111111',
      };
    }
    return { ...domain, id: 'new', code: 'ART', name: 'Artes' };
  });
  vi.spyOn(api, 'patch').mockResolvedValue({ ...domain, status: 'PUBLISHED' });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  router.replace.mockClear();
});

describe('platform admin catalog', () => {
  it('removes catalog content and navigation when admin access is revoked', async () => {
    const view = render(page());
    await screen.findByText('Música');
    vi.mocked(api.get).mockClear();
    view.rerender(page(session(false)));
    expect(screen.getByText('Acesso restrito')).toBeInTheDocument();
    expect(screen.queryByText('Música')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Catálogo administrativo' })).not.toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('ignores a late list response after switching resources', async () => {
    let finish!: (rows: typeof domain[]) => void;
    vi.mocked(api.get).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    render(page());
    fireEvent.change(screen.getByLabelText('Recurso'), { target: { value: 'pedagogical-model-definitions' } });
    await screen.findByText('Nenhuma definição cadastrada');
    await act(async () => { finish([domain]); });
    expect(screen.queryByText('Música')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Modelos pedagógicos' })).toBeInTheDocument();
  });

  it('requires an existing domain before creating competencies', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    render(page());
    fireEvent.change(screen.getByLabelText('Recurso'), { target: { value: 'competency-definitions' } });
    expect(await screen.findByText('Crie um domínio de aprendizagem antes de cadastrar competências.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar rascunho' })).toBeDisabled();
  });

  it('prevents repeated publication while the request is pending', async () => {
    let finish!: (row: typeof domain) => void;
    vi.mocked(api.patch).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    render(page());
    const publish = await screen.findByRole('button', { name: 'Publicar MUSIC' });
    fireEvent.click(publish);
    expect(publish).toBeDisabled();
    fireEvent.click(publish);
    expect(api.patch).toHaveBeenCalledTimes(1);
    await act(async () => { finish({ ...domain, status: 'PUBLISHED' }); });
    expect(screen.queryByRole('button', { name: 'Publicar MUSIC' })).not.toBeInTheDocument();
  });

  it.each(['loading', 'unauthenticated', 'authenticated'] as const)(
    'does not fetch or render catalogs for non-admin %s sessions',
    async (status) => {
      render(page(session(false, status)));
      expect(api.get).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: 'Criar rascunho' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Catálogo administrativo' })).not.toBeInTheDocument();
      if (status === 'authenticated') expect(screen.getByText('Acesso restrito')).toBeInTheDocument();
      if (status === 'unauthenticated')
        await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login?redirect=%2Fadmin%2Fcatalog'));
    },
  );

  it('shows the admin navigation without requiring a family and lists code, name, status and version', async () => {
    render(page());
    expect(screen.getByRole('link', { name: 'Catálogo administrativo' })).toHaveAttribute('href', '/admin/catalog');
    expect(await screen.findByText('Música')).toBeInTheDocument();
    expect(screen.getByText('MUSIC')).toBeInTheDocument();
    expect(screen.getByText('DRAFT')).toBeInTheDocument();
    expect(screen.getByText('Versão 1')).toBeInTheDocument();
  });

  it.each([
    ['learning-domains', 'Domínios de aprendizagem'],
    ['competency-definitions', 'Competências'],
    ['pedagogical-model-definitions', 'Modelos pedagógicos'],
  ])('creates and publishes %s using its contract', async (resource, label) => {
    vi.mocked(api.patch).mockResolvedValue({
      ...domain,
      id: 'new',
      code: 'ART',
      name: 'Artes',
      title: 'Artes',
      status: 'PUBLISHED',
    });
    render(page());
    await screen.findByText('Música');
    fireEvent.change(screen.getByLabelText('Recurso'), { target: { value: resource } });
    await screen.findByRole('heading', { name: label });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Criar rascunho' })).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'ART' } });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Artes' } });
    if (resource === 'competency-definitions') {
      fireEvent.change(screen.getByLabelText('Domínio de aprendizagem'), { target: { value: domain.id } });
      expect(screen.queryByLabelText('Descrição')).not.toBeInTheDocument();
    } else {
      fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Descrição de artes' } });
    }
    fireEvent.click(screen.getByRole('button', { name: 'Criar rascunho' }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        `${base}/${resource}`,
        expect.objectContaining({
          code: 'ART',
          version: 1,
          status: 'DRAFT',
          ...(resource === 'competency-definitions'
            ? { title: 'Artes', domainId: domain.id }
            : { name: 'Artes', description: 'Descrição de artes' }),
        }),
      ),
    );
    expect(await screen.findByText('Artes')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Publicar ART' }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith(`${base}/${resource}/new/status`, { status: 'PUBLISHED' }));
    expect(await screen.findByText('PUBLISHED')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publicar ART' })).not.toBeInTheDocument();
  });

  it('validates the code before sending a create request', async () => {
    render(page());
    await screen.findByText('Música');
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'invalid code' } });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Artes' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar rascunho' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows a load failure and supports retry', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Falha de rede'));
    render(page());
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Música')).toBeInTheDocument();
  });

  it('preserves the form after a rejected create and the draft after a rejected publish', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Código já existe'));
    vi.mocked(api.patch).mockRejectedValue(new Error('Publicação recusada'));
    render(page());
    await screen.findByText('Música');
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'MUSIC' } });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Música' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar rascunho' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Código já existe');
    expect(screen.getByLabelText('Código')).toHaveValue('MUSIC');
    fireEvent.click(screen.getByRole('button', { name: 'Publicar MUSIC' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Publicação recusada');
    expect(screen.getByText('DRAFT')).toBeInTheDocument();
  });

  it('routes consent-definitions and jurisdiction-definitions to dedicated admin paths', async () => {
    render(page());
    await screen.findByText('Música');

    fireEvent.change(screen.getByLabelText('Recurso'), { target: { value: 'consent-definitions' } });
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/admin/consent-definitions'));

    fireEvent.change(screen.getByLabelText('Recurso'), { target: { value: 'jurisdiction-definitions' } });
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/admin/jurisdiction-definitions'));
  });

  it('creates and publishes consent-definitions and rubric-definitions correctly', async () => {
    vi.mocked(api.post).mockImplementation(async (path, body) => {
      const b = body as { code: string; title?: string; name?: string };
      return {
        id: 'new-id',
        code: b.code,
        title: b.title || b.name,
        name: b.name || b.title,
        version: 1,
        status: 'DRAFT',
      };
    });

    render(page());
    await screen.findByText('Música');

    // Rubric definitions
    fireEvent.change(screen.getByLabelText('Recurso'), { target: { value: 'rubric-definitions' } });
    await screen.findByRole('heading', { name: 'Rubricas de avaliação' });
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'MUSIC.RUBRIC' } });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Rubrica de Baixo' } });
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Avaliação prática de execução' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar rascunho' }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        `${base}/rubric-definitions`,
        expect.objectContaining({
          code: 'MUSIC.RUBRIC',
          name: 'Rubrica de Baixo',
          version: 1,
          status: 'DRAFT',
        }),
      ),
    );
    expect(await screen.findByText('Rubrica de Baixo')).toBeInTheDocument();

    // Consent definitions
    fireEvent.change(screen.getByLabelText('Recurso'), { target: { value: 'consent-definitions' } });
    await screen.findByRole('heading', { name: 'Termos de consentimento / Privacidade' });
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'LGPD_TERMS_2026' } });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Termos de Uso 2026' } });
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Termos de conformidade e privacidade' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar rascunho' }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/admin/consent-definitions',
        expect.objectContaining({
          code: 'LGPD_TERMS_2026',
          title: 'Termos de Uso 2026',
          version: 1,
          purposes: ['AUDIT_COMPLIANCE'],
        }),
      ),
    );
    expect(await screen.findByText('Termos de Uso 2026')).toBeInTheDocument();
  });

  it('navigates to version operations tab, lists logs, and performs logical rollback', async () => {
    const mockLog = {
      id: '11111111-1111-1111-1111-111111111111',
      operationType: 'ROLLBACK' as const,
      definitionCode: 'MUSIC.BASS',
      fromVersion: 2,
      toVersion: 1,
      affectedEntityType: 'CompetencyDefinition',
      affectedEntityIds: [],
      performedByUserId: '00000000-0000-0000-0000-000000000001',
      metadata: { reason: 'Taxonomia corrigida' },
      createdAt: '2026-09-17T12:00:00.000Z',
    };

    vi.mocked(api.get).mockImplementation(async (path) => {
      if (path === `${base}/learning-domains`) return [domain];
      if (path === '/admin/curriculum-definitions/version-operations/logs') return [mockLog];
      return [];
    });

    render(page());
    await screen.findByText('Música');

    fireEvent.click(screen.getByTestId('tab-version-operations'));
    expect(await screen.findByText('Rollback Lógico de Definições')).toBeInTheDocument();
    expect(screen.getByTestId('version-operation-logs-list')).toBeInTheDocument();
    expect(screen.getByText('MUSIC.BASS')).toBeInTheDocument();
    expect(screen.getByText('Taxonomia corrigida')).toBeInTheDocument();

    // Fill rollback form
    fireEvent.change(screen.getByTestId('rollback-entity-type-select'), {
      target: { value: 'CompetencyDefinition' },
    });
    fireEvent.change(screen.getByTestId('rollback-code-input'), {
      target: { value: 'MUSIC.BASS' },
    });
    fireEvent.change(screen.getByTestId('rollback-version-input'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByTestId('rollback-reason-input'), {
      target: { value: 'Erro detectado na versão 2' },
    });

    fireEvent.click(screen.getByTestId('execute-rollback-btn'));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/admin/curriculum-definitions/version-operations/rollback', {
        entityType: 'CompetencyDefinition',
        code: 'MUSIC.BASS',
        version: 2,
        reason: 'Erro detectado na versão 2',
      }),
    );

    expect(await screen.findByTestId('rollback-success-alert')).toBeInTheDocument();
  });

  it('displays an error alert when rollback execution fails', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Versão não elegível para rollback'));
    render(page());
    await screen.findByText('Música');

    fireEvent.click(screen.getByTestId('tab-version-operations'));
    await screen.findByTestId('rollback-form');

    fireEvent.change(screen.getByTestId('rollback-code-input'), {
      target: { value: 'MUSIC.BASS' },
    });
    fireEvent.change(screen.getByTestId('rollback-version-input'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByTestId('execute-rollback-btn'));

    expect(await screen.findByTestId('rollback-error-alert')).toHaveTextContent('Versão não elegível para rollback');
  });
});
