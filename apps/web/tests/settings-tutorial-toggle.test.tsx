import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import type { FamilySettingsResponseDto } from '@aletheia/contracts';
import { FamilyGeneralSettings } from '../src/components/settings/family-general-settings';
import { ProductShell } from '../src/components/layout/product-shell';
import { AuthProvider } from '../src/lib/auth/rbac-context';

const nextNavigation = vi.hoisted(() => ({
  pathname: '/',
  routerReplace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => nextNavigation.pathname,
  useRouter: () => ({ replace: nextNavigation.routerReplace, push: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props} data-next-link="true" />
  ),
}));

const mockSettings: FamilySettingsResponseDto = {
  id: '00000000-0000-0000-0000-000000000001',
  familyId: '11111111-1111-1111-1111-111111111111',
  homeschoolName: 'Academia Familiar Silva',
  defaultGradingScale: 'MASTERY_QUALITATIVE',
  timezone: 'America/Sao_Paulo',
  language: 'pt-BR',
  devotionalReminderTime: '07:00',
  dailyScheduleReminderTime: '08:30',
  attendanceReminderEnabled: true,
  emailNotificationsEnabled: true,
  inAppNotificationsEnabled: true,
  supportWidgetLastSeenAt: null,
  supportWidgetSnoozedUntil: null,
  onboardingDismissed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('Settings Tutorial Toggle & On-Demand Tour Button', () => {
  afterEach(() => {
    cleanup();
    nextNavigation.pathname = '/';
    nextNavigation.routerReplace.mockClear();
  });

  describe('FamilyGeneralSettings - Tutorial Toggle', () => {
    it('renders the tutorial toggle switch enabled when onboardingDismissed is false', () => {
      render(
        <AuthProvider role="OWNER_GUARDIAN">
          <FamilyGeneralSettings settings={mockSettings} onSave={vi.fn()} />
        </AuthProvider>,
      );

      const toggle = screen.getByTestId('tutorial-toggle') as HTMLInputElement;
      expect(toggle).toBeDefined();
      expect(toggle.checked).toBe(true);
      expect(screen.getByText('Tutorial de Primeiros Passos')).toBeDefined();
      expect(
        screen.getByText('Exibir tour interativo guiado pelas principais ferramentas do sistema.'),
      ).toBeDefined();
    });

    it('renders the tutorial toggle switch unchecked when onboardingDismissed is true', () => {
      render(
        <AuthProvider role="OWNER_GUARDIAN">
          <FamilyGeneralSettings
            settings={{ ...mockSettings, onboardingDismissed: true }}
            onSave={vi.fn()}
          />
        </AuthProvider>,
      );

      const toggle = screen.getByTestId('tutorial-toggle') as HTMLInputElement;
      expect(toggle).toBeDefined();
      expect(toggle.checked).toBe(false);
    });

    it('toggling switch from enabled to disabled calls onSave with onboardingDismissed: true', async () => {
      const onSaveMock = vi.fn().mockResolvedValue(undefined);

      render(
        <AuthProvider role="OWNER_GUARDIAN">
          <FamilyGeneralSettings
            settings={{ ...mockSettings, onboardingDismissed: false }}
            onSave={onSaveMock}
          />
        </AuthProvider>,
      );

      const toggle = screen.getByTestId('tutorial-toggle') as HTMLInputElement;
      expect(toggle.checked).toBe(true);

      fireEvent.click(toggle);
      expect(toggle.checked).toBe(false);

      fireEvent.click(screen.getByTestId('save-family-settings-btn'));

      await waitFor(() => {
        expect(onSaveMock).toHaveBeenCalledWith(
          expect.objectContaining({
            onboardingDismissed: true,
          }),
        );
      });
    });

    it('toggling switch from disabled to enabled calls onSave with onboardingDismissed: false', async () => {
      const onSaveMock = vi.fn().mockResolvedValue(undefined);

      render(
        <AuthProvider role="OWNER_GUARDIAN">
          <FamilyGeneralSettings
            settings={{ ...mockSettings, onboardingDismissed: true }}
            onSave={onSaveMock}
          />
        </AuthProvider>,
      );

      const toggle = screen.getByTestId('tutorial-toggle') as HTMLInputElement;
      expect(toggle.checked).toBe(false);

      fireEvent.click(toggle);
      expect(toggle.checked).toBe(true);

      fireEvent.click(screen.getByTestId('save-family-settings-btn'));

      await waitFor(() => {
        expect(onSaveMock).toHaveBeenCalledWith(
          expect.objectContaining({
            onboardingDismissed: false,
          }),
        );
      });
    });

    it('disables the tutorial toggle switch when role is EDUCATOR', () => {
      render(
        <AuthProvider role="EDUCATOR">
          <FamilyGeneralSettings settings={mockSettings} onSave={vi.fn()} />
        </AuthProvider>,
      );

      const toggle = screen.getByTestId('tutorial-toggle') as HTMLInputElement;
      expect(toggle.disabled).toBe(true);
    });
  });

  describe('ProductShell - On-Demand Tour Button', () => {
    it('renders on-demand tour button in topbar and calls onStartTour when clicked', () => {
      const onStartTourMock = vi.fn();

      render(
        <ProductShell
          user={{ id: 'u-1', name: 'Responsável', role: 'OWNER_GUARDIAN' }}
          onStartTour={onStartTourMock}
        >
          <p>Conteúdo</p>
        </ProductShell>,
      );

      const tourButton = screen.getByTestId('start-tour-btn');
      expect(tourButton).toBeDefined();
      expect(tourButton).toHaveTextContent('Fazer Tour');

      fireEvent.click(tourButton);
      expect(onStartTourMock).toHaveBeenCalledTimes(1);
    });

    it('does not render on-demand tour button when onStartTour prop is not provided', () => {
      render(
        <ProductShell user={{ id: 'u-1', name: 'Responsável', role: 'OWNER_GUARDIAN' }}>
          <p>Conteúdo</p>
        </ProductShell>,
      );

      expect(screen.queryByTestId('start-tour-btn')).toBeNull();
    });
  });
});
