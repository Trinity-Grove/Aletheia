import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {
  PedagogicalModelCatalogEntryDto,
  TheologicalTraditionCatalogEntryDto,
  PedagogicalProfileResponseDto,
  TheologicalProfileResponseDto,
} from '@aletheia/contracts';
import { PedagogicalTheologicalProfileSettings } from '../src/components/settings/pedagogical-theological-profile-settings';

const FAMILY_ID = 'fam-1';

const mockPedagogicalCatalog: PedagogicalModelCatalogEntryDto[] = [
  { code: 'CLASSICAL_TRIVIUM', name: 'Clássica (Trívio)', description: 'Gramática, lógica e retórica.' },
  { code: 'CHARLOTTE_MASON', name: 'Charlotte Mason', description: 'Livros vivos e narração.' },
  { code: 'MONTESSORI', name: 'Montessori', description: null },
];

const mockTheologicalCatalog: TheologicalTraditionCatalogEntryDto[] = [
  { code: 'REFORMED', name: 'Reformada', description: 'Tradição reformada.' },
  { code: 'BAPTIST', name: 'Batista', description: null },
];

const mockPedagogicalProfile: PedagogicalProfileResponseDto = {
  id: 'ped-profile-1',
  createdByUserId: null,
  familyId: FAMILY_ID,
  version: 2,
  primaryModelCode: 'CHARLOTTE_MASON',
  secondaryModels: [{ code: 'MONTESSORI', weight: 0.3 }],
  overrides: {},
  createdAt: '2026-01-02T00:00:00.000Z',
};

const mockPedagogicalHistory: PedagogicalProfileResponseDto[] = [
  mockPedagogicalProfile,
  {
    id: 'ped-profile-0',
    createdByUserId: null,
    familyId: FAMILY_ID,
    version: 1,
    primaryModelCode: 'CLASSICAL_TRIVIUM',
    secondaryModels: [],
    overrides: {},
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const mockTheologicalProfile: TheologicalProfileResponseDto = {
  id: 'theo-profile-1',
  createdByUserId: null,
  familyId: FAMILY_ID,
  version: 1,
  preferredTraditionCode: 'REFORMED',
  topicOverrides: {},
  createdAt: '2026-01-01T00:00:00.000Z',
};

function stubFetch(overrides: Record<string, unknown> = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      const jsonFor = (): unknown => {
        if (url.includes('/templates/catalog')) return overrides.pedagogicalCatalog ?? mockPedagogicalCatalog;
        if (url.includes('/theological-traditions/catalog'))
          return overrides.theologicalCatalog ?? mockTheologicalCatalog;
        if (url.endsWith('/pedagogical-profile/history')) return overrides.pedagogicalHistory ?? mockPedagogicalHistory;
        if (url.endsWith('/pedagogical-profile')) return overrides.pedagogicalProfile ?? mockPedagogicalProfile;
        if (url.endsWith('/theological-profile/history')) return overrides.theologicalHistory ?? [mockTheologicalProfile];
        if (url.endsWith('/theological-profile')) return overrides.theologicalProfile ?? mockTheologicalProfile;
        return null;
      };
      return Promise.resolve({ ok: true, json: async () => jsonFor() });
    }),
  );
}

describe('PedagogicalTheologicalProfileSettings', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows a loading state before data arrives', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    render(<PedagogicalTheologicalProfileSettings familyId={FAMILY_ID} />);
    expect(screen.getByTestId('profile-settings-loading')).toBeInTheDocument();
  });

  it('loads catalogs and current profiles, pre-filling the form from real data', async () => {
    stubFetch();
    render(<PedagogicalTheologicalProfileSettings familyId={FAMILY_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId('pedagogical-profile-card')).toBeInTheDocument();
    });

    expect((screen.getByTestId('primary-model-select') as HTMLSelectElement).value).toBe('CHARLOTTE_MASON');
    expect(screen.getByTestId('secondary-model-row-MONTESSORI')).toBeInTheDocument();
    expect((screen.getByTestId('preferred-tradition-select') as HTMLSelectElement).value).toBe('REFORMED');

    // Version history renders for both profiles.
    expect(screen.getByTestId('pedagogical-profile-history-item-2')).toBeInTheDocument();
    expect(screen.getByTestId('pedagogical-profile-history-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('theological-profile-history-item-1')).toBeInTheDocument();
  });

  it('adds and removes a secondary pedagogical model before saving', async () => {
    stubFetch({ pedagogicalProfile: null, pedagogicalHistory: [] });
    render(<PedagogicalTheologicalProfileSettings familyId={FAMILY_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId('primary-model-select')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('primary-model-select'), { target: { value: 'CLASSICAL_TRIVIUM' } });
    fireEvent.change(screen.getByTestId('new-secondary-model-select'), { target: { value: 'MONTESSORI' } });
    fireEvent.change(screen.getByTestId('new-secondary-model-weight-input'), { target: { value: '0.4' } });
    fireEvent.click(screen.getByTestId('add-secondary-model-btn'));

    expect(screen.getByTestId('secondary-model-row-MONTESSORI')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('remove-secondary-model-MONTESSORI'));
    expect(screen.queryByTestId('secondary-model-row-MONTESSORI')).not.toBeInTheDocument();
  });

  it('preserves loaded overrides when saving either profile', async () => {
    const overrides = { schedule: { days: ['MONDAY', 'FRIDAY'] }, narration: true };
    const topicOverrides = { baptism: 'BELIEVERS_BAPTISM' };
    stubFetch({
      pedagogicalProfile: { ...mockPedagogicalProfile, overrides },
      theologicalProfile: { ...mockTheologicalProfile, preferredTraditionCode: null, topicOverrides },
      pedagogicalHistory: [], theologicalHistory: [],
    });
    render(<PedagogicalTheologicalProfileSettings familyId={FAMILY_ID} />);
    await screen.findByTestId('primary-model-select');
    fireEvent.change(screen.getByTestId('primary-model-select'), { target: { value: 'CLASSICAL_TRIVIUM' } });
    fireEvent.change(screen.getByTestId('preferred-tradition-select'), { target: { value: 'BAPTIST' } });
    fireEvent.click(screen.getByTestId('save-pedagogical-profile-btn'));
    fireEvent.click(screen.getByTestId('save-theological-profile-btn'));
    await screen.findByTestId('pedagogical-profile-success-alert');
    await screen.findByTestId('theological-profile-success-alert');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/pedagogical-profile'), expect.objectContaining({
      method: 'PUT', body: JSON.stringify({ primaryModelCode: 'CLASSICAL_TRIVIUM', secondaryModels: mockPedagogicalProfile.secondaryModels, overrides }),
    }));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/theological-profile'), expect.objectContaining({
      method: 'PUT', body: JSON.stringify({ preferredTraditionCode: 'BAPTIST', topicOverrides }),
    }));
  });

  it('removes a secondary model when it becomes the primary model', async () => {
    stubFetch({ pedagogicalHistory: [] });
    render(<PedagogicalTheologicalProfileSettings familyId={FAMILY_ID} />);
    await screen.findByTestId('primary-model-select');
    fireEvent.change(screen.getByTestId('primary-model-select'), { target: { value: 'MONTESSORI' } });
    expect(screen.queryByTestId('secondary-model-row-MONTESSORI')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('save-pedagogical-profile-btn'));
    await screen.findByTestId('pedagogical-profile-success-alert');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/pedagogical-profile'), expect.objectContaining({
      method: 'PUT', body: JSON.stringify({ primaryModelCode: 'MONTESSORI', secondaryModels: [], overrides: {} }),
    }));
  });

  it('lets the family remove a stale topic override after a rejected save while preserving other overrides', async () => {
    const topicOverrides = { baptism: 'DEPRECATED_POSITION', salvation: 'VALID_POSITION' };
    stubFetch({ theologicalProfile: { ...mockTheologicalProfile, topicOverrides }, theologicalHistory: [] });
    const initialFetch = vi.mocked(fetch).getMockImplementation()!;
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'PUT' && url.endsWith('/theological-profile')) {
        const payload = JSON.parse(init.body as string);
        return Promise.resolve(payload.topicOverrides.baptism
          ? { ok: false, json: async () => ({ message: 'Position DEPRECATED_POSITION is not published' }) }
          : { ok: true, json: async () => ({ ...mockTheologicalProfile, id: 'theo-retry', version: 2, ...payload }) });
      }
      return initialFetch(url, init);
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<PedagogicalTheologicalProfileSettings familyId={FAMILY_ID} />);
    await screen.findByTestId('preferred-tradition-select');
    fireEvent.click(screen.getByTestId('save-theological-profile-btn'));
    expect(await screen.findByTestId('theological-profile-error-alert')).toHaveTextContent('DEPRECATED_POSITION');
    fireEvent.click(screen.getByRole('button', { name: 'Remover exceção baptism: DEPRECATED_POSITION' }));
    expect(screen.getByRole('button', { name: 'Remover exceção salvation: VALID_POSITION' })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('save-theological-profile-btn'));
    await screen.findByTestId('theological-profile-success-alert');
    expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('/theological-profile'), expect.objectContaining({
      method: 'PUT', body: JSON.stringify({ preferredTraditionCode: 'REFORMED', topicOverrides: { salvation: 'VALID_POSITION' } }),
    }));
  });

  it('clears a pending secondary selection that becomes the primary model', async () => {
    stubFetch();
    render(<PedagogicalTheologicalProfileSettings familyId={FAMILY_ID} />);
    await screen.findByTestId('primary-model-select');
    fireEvent.change(screen.getByTestId('new-secondary-model-select'), { target: { value: 'CLASSICAL_TRIVIUM' } });
    fireEvent.change(screen.getByTestId('primary-model-select'), { target: { value: 'CLASSICAL_TRIVIUM' } });
    fireEvent.click(screen.getByTestId('add-secondary-model-btn'));
    expect(screen.queryByTestId('secondary-model-row-CLASSICAL_TRIVIUM')).not.toBeInTheDocument();
    expect(screen.getByTestId('add-secondary-model-btn')).toBeDisabled();
  });

  it('saves the pedagogical profile via PUT and appends the new version to history', async () => {
    const updatedProfile: PedagogicalProfileResponseDto = {
      ...mockPedagogicalProfile,
      id: 'ped-profile-2',
      version: 3,
    };
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'PUT' && url.endsWith('/pedagogical-profile')) {
        return Promise.resolve({ ok: true, json: async () => updatedProfile });
      }
      if (url.includes('/templates/catalog')) return Promise.resolve({ ok: true, json: async () => mockPedagogicalCatalog });
      if (url.includes('/theological-traditions/catalog'))
        return Promise.resolve({ ok: true, json: async () => mockTheologicalCatalog });
      if (url.endsWith('/pedagogical-profile/history'))
        return Promise.resolve({ ok: true, json: async () => mockPedagogicalHistory });
      if (url.endsWith('/pedagogical-profile'))
        return Promise.resolve({ ok: true, json: async () => mockPedagogicalProfile });
      if (url.endsWith('/theological-profile/history')) return Promise.resolve({ ok: true, json: async () => [] });
      if (url.endsWith('/theological-profile')) return Promise.resolve({ ok: true, json: async () => null });
      return Promise.resolve({ ok: true, json: async () => null });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<PedagogicalTheologicalProfileSettings familyId={FAMILY_ID} />);
    await waitFor(() => {
      expect(screen.getByTestId('save-pedagogical-profile-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('save-pedagogical-profile-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('pedagogical-profile-success-alert')).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/v1/families/${FAMILY_ID}/curriculum/pedagogical-profile`,
      expect.objectContaining({ method: 'PUT' }),
    );
    expect(screen.getByTestId('pedagogical-profile-history-item-3')).toBeInTheDocument();
  });

  it('shows an error alert when saving the theological profile fails', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'PUT' && url.endsWith('/theological-profile')) {
        return Promise.resolve({ ok: false, json: async () => ({ message: 'Falha ao salvar' }) });
      }
      if (url.includes('/templates/catalog')) return Promise.resolve({ ok: true, json: async () => mockPedagogicalCatalog });
      if (url.includes('/theological-traditions/catalog'))
        return Promise.resolve({ ok: true, json: async () => mockTheologicalCatalog });
      if (url.endsWith('/pedagogical-profile/history')) return Promise.resolve({ ok: true, json: async () => [] });
      if (url.endsWith('/pedagogical-profile')) return Promise.resolve({ ok: true, json: async () => null });
      if (url.endsWith('/theological-profile/history'))
        return Promise.resolve({ ok: true, json: async () => [mockTheologicalProfile] });
      if (url.endsWith('/theological-profile'))
        return Promise.resolve({ ok: true, json: async () => mockTheologicalProfile });
      return Promise.resolve({ ok: true, json: async () => null });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<PedagogicalTheologicalProfileSettings familyId={FAMILY_ID} />);
    await waitFor(() => {
      expect(screen.getByTestId('save-theological-profile-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('save-theological-profile-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('theological-profile-error-alert')).toHaveTextContent('Falha ao salvar');
    });
  });
});
