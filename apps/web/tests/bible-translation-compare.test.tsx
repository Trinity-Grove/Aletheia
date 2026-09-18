import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComparePassageResponseDto } from '@aletheia/contracts';
import {
  AVAILABLE_TRANSLATIONS,
  BibleTranslationCompareView,
} from '../src/components/devotional/bible-translation-compare-view';
import BibleTranslationComparePage from '../app/(dashboard)/devotional/comparador/page';
import { DevotionalView } from '../src/components/devotional/devotional-view';
import { AuthContext, type AuthContextValue } from '../src/lib/auth/auth-context';
import { AuthProvider as RbacAuthProvider } from '../src/lib/auth/rbac-context';
import { setApiAuthToken } from '../src/lib/api';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => '/devotional/comparador',
  useParams: () => ({}),
}));

function createAuthContextValue(
  status: AuthContextValue['status'] = 'authenticated',
  familyId = 'fam-uuid-123'
): AuthContextValue {
  return {
    status,
    user: {
      id: 'user-uuid-1',
      email: 'parent@example.com',
      fullName: 'Ana Silva',
      emailVerified: true,
      mfaEnabled: false,
      isPlatformAdmin: false,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    token: 'test-jwt-token',
    activeFamilyId: familyId,
    activeFamily: null,
    families: [],
    activeRole: 'OWNER_GUARDIAN',
    login: vi.fn(),
    verifyMfa: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    selectFamily: vi.fn(),
    refreshSession: vi.fn().mockResolvedValue(undefined),
    setActiveFamilyFromCreated: vi.fn(),
    changePassword: vi.fn(),
    changeEmail: vi.fn(),
  };
}

const mockCompareResponse: ComparePassageResponseDto = {
  reference: 'João 1:1',
  results: [
    {
      translationCode: 'ARC',
      translationName: 'Almeida Revista e Corrigida',
      reference: 'João 1:1',
      content: 'No princípio, era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.',
      copyright: 'Sociedade Bíblica do Brasil (ARC)',
    },
    {
      translationCode: 'ARA',
      translationName: 'Almeida Revista e Atualizada',
      reference: 'João 1:1',
      content: 'No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.',
      copyright: 'Sociedade Bíblica do Brasil (ARA)',
    },
  ],
};

describe('BibleTranslationCompareView', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('familyId', 'fam-uuid-123');
    localStorage.setItem('aletheia_active_family_id', 'fam-uuid-123');
    setApiAuthToken('test-jwt-token');
    mockPush.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders initial view with default selected translations and empty state', () => {
    const authValue = createAuthContextValue();

    render(
      <AuthContext.Provider value={authValue}>
        <BibleTranslationCompareView />
      </AuthContext.Provider>
    );

    expect(screen.getByTestId('bible-translation-compare-view')).toBeInTheDocument();
    expect(screen.getByLabelText(/Referência Bíblica/i)).toBeInTheDocument();
    expect(screen.getByTestId('bible-reference-input')).toHaveValue('');

    // Default translations should be checked (ARC, ARA)
    const arcCheckbox = screen.getByTestId('translation-checkbox-ARC') as HTMLInputElement;
    const araCheckbox = screen.getByTestId('translation-checkbox-ARA') as HTMLInputElement;
    expect(arcCheckbox.checked).toBe(true);
    expect(araCheckbox.checked).toBe(true);

    // Other translations should be unchecked initially
    const nviCheckbox = screen.getByTestId('translation-checkbox-NVI') as HTMLInputElement;
    expect(nviCheckbox.checked).toBe(false);

    // Empty state is rendered before search
    expect(screen.getByTestId('compare-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/Escolha uma passagem para comparar/i)).toBeInTheDocument();
    expect(screen.queryByTestId('bible-compare-grid')).not.toBeInTheDocument();
  });

  it('fills reference input when quick suggestion button is clicked', () => {
    const authValue = createAuthContextValue();

    render(
      <AuthContext.Provider value={authValue}>
        <BibleTranslationCompareView />
      </AuthContext.Provider>
    );

    const input = screen.getByTestId('bible-reference-input');
    const quickRefBtn = screen.getByTestId('quick-ref-joão-1:1');

    fireEvent.click(quickRefBtn);
    expect(input).toHaveValue('João 1:1');
  });

  it('allows toggling translations selection in the filter list', () => {
    const authValue = createAuthContextValue();

    render(
      <AuthContext.Provider value={authValue}>
        <BibleTranslationCompareView />
      </AuthContext.Provider>
    );

    const nviCheckbox = screen.getByTestId('translation-checkbox-NVI') as HTMLInputElement;
    expect(nviCheckbox.checked).toBe(false);

    fireEvent.click(nviCheckbox);
    expect(nviCheckbox.checked).toBe(true);

    const arcCheckbox = screen.getByTestId('translation-checkbox-ARC') as HTMLInputElement;
    expect(arcCheckbox.checked).toBe(true);
    fireEvent.click(arcCheckbox);
    expect(arcCheckbox.checked).toBe(false);
  });

  it('shows error if comparing with an empty reference', async () => {
    const authValue = createAuthContextValue();

    render(
      <AuthContext.Provider value={authValue}>
        <BibleTranslationCompareView />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByTestId('compare-btn'));

    await waitFor(() => {
      const errorAlert = screen.getByTestId('compare-error-alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(/informe uma referência bíblica/i);
    });
  });

  it('shows error if comparing with zero translations selected', async () => {
    const authValue = createAuthContextValue();

    render(
      <AuthContext.Provider value={authValue}>
        <BibleTranslationCompareView />
      </AuthContext.Provider>
    );

    // Enter reference
    fireEvent.change(screen.getByTestId('bible-reference-input'), {
      target: { value: 'João 1:1' },
    });

    // Uncheck ARC and ARA
    fireEvent.click(screen.getByTestId('translation-checkbox-ARC'));
    fireEvent.click(screen.getByTestId('translation-checkbox-ARA'));

    fireEvent.click(screen.getByTestId('compare-btn'));

    await waitFor(() => {
      const errorAlert = screen.getByTestId('compare-error-alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(/Selecione pelo menos uma tradução/i);
    });
  });

  it('executes comparison search against API and renders side-by-side cards', async () => {
    const authValue = createAuthContextValue();

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockCompareResponse,
    } as Response);

    render(
      <AuthContext.Provider value={authValue}>
        <BibleTranslationCompareView initialReference="João 1:1" />
      </AuthContext.Provider>
    );

    const compareBtn = screen.getByTestId('compare-btn');
    fireEvent.click(compareBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/v1/families/fam-uuid-123/curriculum/bible-translations/compare?reference=Jo%C3%A3o+1%3A1&translationCodes=ARC%2CARA',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-jwt-token',
          }),
        })
      );
    });

    // Verify grid and cards rendered
    await waitFor(() => {
      expect(screen.getByTestId('bible-compare-grid')).toBeInTheDocument();
    });

    expect(screen.getByText('Comparação: João 1:1')).toBeInTheDocument();

    const arcCard = screen.getByTestId('compare-card-ARC');
    expect(arcCard).toBeInTheDocument();
    expect(arcCard).toHaveTextContent('ARC');
    expect(arcCard).toHaveTextContent('Almeida Revista e Corrigida');
    expect(arcCard).toHaveTextContent(
      'No princípio, era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.'
    );
    expect(screen.getByTestId('compare-copyright-ARC')).toHaveTextContent(
      'Sociedade Bíblica do Brasil (ARC)'
    );

    const araCard = screen.getByTestId('compare-card-ARA');
    expect(araCard).toBeInTheDocument();
    expect(araCard).toHaveTextContent('ARA');
    expect(araCard).toHaveTextContent('Almeida Revista e Atualizada');
    expect(araCard).toHaveTextContent(
      'No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.'
    );
    expect(screen.getByTestId('compare-copyright-ARA')).toHaveTextContent(
      'Sociedade Bíblica do Brasil (ARA)'
    );
  });

  it('displays error alert when endpoint returns 400 with message', async () => {
    const authValue = createAuthContextValue();

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        statusCode: 400,
        message: 'None of the requested translation codes match a published BibleTranslationDefinition.',
      }),
    } as Response);

    render(
      <AuthContext.Provider value={authValue}>
        <BibleTranslationCompareView initialReference="John 3:16" />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByTestId('compare-btn'));

    await waitFor(() => {
      const errorAlert = screen.getByTestId('compare-error-alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(
        'None of the requested translation codes match a published BibleTranslationDefinition.'
      );
    });
  });

  it('displays error alert when network fails', async () => {
    const authValue = createAuthContextValue();

    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error connecting to Bible service'));

    render(
      <AuthContext.Provider value={authValue}>
        <BibleTranslationCompareView initialReference="Romanos 8:28" />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByTestId('compare-btn'));

    await waitFor(() => {
      const errorAlert = screen.getByTestId('compare-error-alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent('Network error connecting to Bible service');
    });
  });

  it('renders destination page BibleTranslationComparePage with back link', () => {
    const authValue = createAuthContextValue();

    render(
      <AuthContext.Provider value={authValue}>
        <BibleTranslationComparePage />
      </AuthContext.Provider>
    );

    expect(screen.getByText('Comparador de Traduções Bíblicas')).toBeInTheDocument();
    const backLink = screen.getByTestId('back-to-devotional-link');
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/devotional');
  });

  it('renders shortcut button in DevotionalView pointing to /devotional/comparador', () => {
    render(
      <RbacAuthProvider initialRole="OWNER_GUARDIAN">
        <DevotionalView
          currentDate="2026-08-25"
          devotional={null}
          onEdit={vi.fn()}
          onDateChange={vi.fn()}
        />
      </RbacAuthProvider>
    );

    const compareNavBtn = screen.getByTestId('compare-translations-nav-btn');
    expect(compareNavBtn).toBeInTheDocument();
    expect(compareNavBtn).toHaveTextContent(/Comparar Traduções 📖/i);
    expect(compareNavBtn).toHaveAttribute('href', '/devotional/comparador');
  });
});
