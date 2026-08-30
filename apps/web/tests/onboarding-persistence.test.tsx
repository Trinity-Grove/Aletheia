import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import type { FamilyResponseDto } from '@aletheia/contracts';
import { api, ApiError } from '../src/lib/api';
import { AuthContext, type AuthContextValue } from '../src/lib/auth/auth-context';
import OnboardingPage from '../app/(dashboard)/onboarding/page';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/onboarding',
}));

describe('OnboardingPage persistence and navigation', () => {
  const mockFamilyResponse: FamilyResponseDto = {
    id: 'fam-new-123',
    name: 'Família Silva',
    countryCode: 'BRA',
    stateProvince: 'SP',
    createdAt: '2026-08-30T00:00:00.000Z',
    updatedAt: '2026-08-30T00:00:00.000Z',
    members: [
      {
        id: 'mem-1',
        familyId: 'fam-new-123',
        userId: 'user-1',
        role: 'OWNER_GUARDIAN',
        createdAt: '2026-08-30T00:00:00.000Z',
      },
    ],
  };

  let mockAuthContext: AuthContextValue;

  beforeEach(() => {
    mockPush.mockReset();
    vi.restoreAllMocks();

    mockAuthContext = {
      status: 'authenticated',
      user: {
        id: 'user-1',
        email: 'guardian@aletheia.edu',
        fullName: 'Guardian Silva',
        createdAt: '2026-08-30T00:00:00.000Z',
      },
      token: 'jwt-mock-token',
      activeFamilyId: null,
      activeFamily: null,
      families: [],
      activeRole: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      selectFamily: vi.fn(),
      refreshSession: vi.fn(),
      setActiveFamilyFromCreated: vi.fn(),
    };
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  function renderWithAuth(ui: React.ReactElement, authOverrides: Partial<AuthContextValue> = {}) {
    const value = { ...mockAuthContext, ...authOverrides };
    return render(<AuthContext.Provider value={value}>{ui}</AuthContext.Provider>);
  }

  it('renders onboarding header and input fields with default country', () => {
    renderWithAuth(<OnboardingPage />);

    expect(screen.getByTestId('onboarding-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /bem-vindo ao aletheia!/i })).toBeInTheDocument();
    expect(screen.getByTestId('family-name-input')).toHaveValue('');
    expect(screen.getByTestId('country-select')).toHaveValue('BRA');
    expect(screen.getByTestId('state-input')).toHaveValue('');
    expect(screen.getByTestId('create-family-button')).toHaveTextContent('Criar e Começar');
  });

  it('submits POST /families with trimmed data, sets active family, and redirects to /learners', async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue(mockFamilyResponse);

    renderWithAuth(<OnboardingPage />);

    fireEvent.change(screen.getByTestId('family-name-input'), {
      target: { value: '  Família Silva  ' },
    });
    fireEvent.change(screen.getByTestId('country-select'), {
      target: { value: 'BRA' },
    });
    fireEvent.change(screen.getByTestId('state-input'), {
      target: { value: '  SP  ' },
    });

    fireEvent.click(screen.getByTestId('create-family-button'));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/families', {
        name: 'Família Silva',
        countryCode: 'BRA',
        stateProvince: 'SP',
      });
    });

    expect(mockAuthContext.setActiveFamilyFromCreated).toHaveBeenCalledWith(mockFamilyResponse);
    expect(mockPush).toHaveBeenCalledWith('/learners');
  });

  it('sends undefined for stateProvince when input is empty or whitespace only', async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue(mockFamilyResponse);

    renderWithAuth(<OnboardingPage />);

    fireEvent.change(screen.getByTestId('family-name-input'), {
      target: { value: 'Família Silva' },
    });
    fireEvent.change(screen.getByTestId('state-input'), {
      target: { value: '   ' },
    });

    fireEvent.click(screen.getByTestId('create-family-button'));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/families', {
        name: 'Família Silva',
        countryCode: 'BRA',
        stateProvince: undefined,
      });
    });
  });

  it('disables button and shows "Criando..." while submission is in flight', async () => {
    let resolveApi: (value: FamilyResponseDto) => void = () => {};
    const pendingPromise = new Promise<FamilyResponseDto>((resolve) => {
      resolveApi = resolve;
    });

    vi.spyOn(api, 'post').mockReturnValue(pendingPromise);

    renderWithAuth(<OnboardingPage />);

    fireEvent.change(screen.getByTestId('family-name-input'), {
      target: { value: 'Família Silva' },
    });
    fireEvent.click(screen.getByTestId('create-family-button'));

    const button = screen.getByTestId('create-family-button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Criando...');
    expect(screen.getByTestId('family-name-input')).toBeDisabled();

    resolveApi(mockFamilyResponse);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/learners');
    });
  });

  it('displays API error in [data-testid="error-message"] and keeps the form visible for correction', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(
      new ApiError(400, 'Bad Request', 'O nome da família já está em uso.'),
    );

    renderWithAuth(<OnboardingPage />);

    fireEvent.change(screen.getByTestId('family-name-input'), {
      target: { value: 'Família Duplicada' },
    });
    fireEvent.click(screen.getByTestId('create-family-button'));

    const errorAlert = await screen.findByTestId('error-message');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent('O nome da família já está em uso.');
    expect(errorAlert).toHaveAttribute('role', 'alert');

    // Form remains visible and inputs are re-enabled
    expect(screen.getByTestId('family-onboarding-form')).toBeInTheDocument();
    expect(screen.getByTestId('family-name-input')).toHaveValue('Família Duplicada');
    expect(screen.getByTestId('create-family-button')).not.toBeDisabled();
    expect(screen.getByTestId('create-family-button')).toHaveTextContent('Criar e Começar');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('handles generic network errors gracefully', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(new Error('Network disconnected'));

    renderWithAuth(<OnboardingPage />);

    fireEvent.change(screen.getByTestId('family-name-input'), {
      target: { value: 'Família Nova' },
    });
    fireEvent.click(screen.getByTestId('create-family-button'));

    const errorAlert = await screen.findByTestId('error-message');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent('Network disconnected');
    expect(screen.getByTestId('family-onboarding-form')).toBeInTheDocument();
  });

  it('does not submit when family name is blank or only whitespace', () => {
    const postSpy = vi.spyOn(api, 'post');

    renderWithAuth(<OnboardingPage />);

    fireEvent.change(screen.getByTestId('family-name-input'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByTestId('create-family-button'));

    expect(postSpy).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
