import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import React from 'react';
import { AletheiaIcon, ICON_SIZES, ICON_NAMES, type IconName } from '../src/index.js';
import { resolveIcon } from '../src/components/icon.js';
import { HelpCircle } from 'lucide-react';

describe('AletheiaIcon Component', () => {
  afterEach(cleanup);

  describe('Size Resolution', () => {
    it('defaults to size md (20px)', () => {
      render(<AletheiaIcon name="home" data-testid="icon-test" />);
      const icon = screen.getByTestId('icon-test');
      expect(icon).toHaveAttribute('width', '20');
      expect(icon).toHaveAttribute('height', '20');
    });

    it('resolves standard size sm to 16px', () => {
      render(<AletheiaIcon name="home" size="sm" data-testid="icon-sm" />);
      const icon = screen.getByTestId('icon-sm');
      expect(icon).toHaveAttribute('width', '16');
      expect(icon).toHaveAttribute('height', '16');
    });

    it('resolves standard size md to 20px', () => {
      render(<AletheiaIcon name="home" size="md" data-testid="icon-md" />);
      const icon = screen.getByTestId('icon-md');
      expect(icon).toHaveAttribute('width', '20');
      expect(icon).toHaveAttribute('height', '20');
    });

    it('resolves standard size lg to 24px', () => {
      render(<AletheiaIcon name="home" size="lg" data-testid="icon-lg" />);
      const icon = screen.getByTestId('icon-lg');
      expect(icon).toHaveAttribute('width', '24');
      expect(icon).toHaveAttribute('height', '24');
    });

    it('resolves standard size xl to 32px', () => {
      render(<AletheiaIcon name="home" size="xl" data-testid="icon-xl" />);
      const icon = screen.getByTestId('icon-xl');
      expect(icon).toHaveAttribute('width', '32');
      expect(icon).toHaveAttribute('height', '32');
    });

    it('resolves custom numeric size directly in pixels', () => {
      render(<AletheiaIcon name="home" size={48} data-testid="icon-custom" />);
      const icon = screen.getByTestId('icon-custom');
      expect(icon).toHaveAttribute('width', '48');
      expect(icon).toHaveAttribute('height', '48');
    });
  });

  describe('Accessibility & Custom Attributes', () => {
    it('sets aria-hidden="true" by default when purely decorative', () => {
      render(<AletheiaIcon name="home" data-testid="icon-decorative" />);
      const icon = screen.getByTestId('icon-decorative');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).not.toHaveAttribute('role');
    });

    it('sets role="img" and aria-label when label prop is provided', () => {
      render(<AletheiaIcon name="home" label="Página inicial" data-testid="icon-semantic" />);
      const icon = screen.getByTestId('icon-semantic');
      expect(icon).toHaveAttribute('role', 'img');
      expect(icon).toHaveAttribute('aria-label', 'Página inicial');
      expect(icon).not.toHaveAttribute('aria-hidden', 'true');
    });

    it('sets role="img" and preserves aria-label when aria-label prop is provided', () => {
      render(<AletheiaIcon name="bell" aria-label="Notificações" data-testid="icon-aria-label" />);
      const icon = screen.getByTestId('icon-aria-label');
      expect(icon).toHaveAttribute('role', 'img');
      expect(icon).toHaveAttribute('aria-label', 'Notificações');
    });

    it('applies custom className alongside base ui-icon class', () => {
      render(<AletheiaIcon name="search" className="custom-color-class extra-margin" data-testid="icon-class" />);
      const icon = screen.getByTestId('icon-class');
      expect(icon.classList.contains('ui-icon')).toBe(true);
      expect(icon.classList.contains('custom-color-class')).toBe(true);
      expect(icon.classList.contains('extra-margin')).toBe(true);
    });

    it('forwards custom color and strokeWidth props', () => {
      render(
        <AletheiaIcon
          name="heart"
          color="rgb(255, 0, 0)"
          strokeWidth={1.5}
          data-testid="icon-custom-props"
        />
      );
      const icon = screen.getByTestId('icon-custom-props');
      expect(icon).toHaveAttribute('stroke', 'rgb(255, 0, 0)');
      expect(icon).toHaveAttribute('stroke-width', '1.5');
    });
  });

  describe('Alias & Casing Resolution', () => {
    it('resolves kebab-case icon names correctly', () => {
      const { unmount } = render(<AletheiaIcon name="book-open" data-testid="kebab-icon" />);
      expect(screen.getByTestId('kebab-icon')).toBeInTheDocument();
      unmount();

      render(<AletheiaIcon name="calendar-days" data-testid="kebab-icon-2" />);
      expect(screen.getByTestId('kebab-icon-2')).toBeInTheDocument();
    });

    it('resolves PascalCase icon names correctly', () => {
      const { unmount } = render(<AletheiaIcon name="BookOpen" data-testid="pascal-icon" />);
      expect(screen.getByTestId('pascal-icon')).toBeInTheDocument();
      unmount();

      render(<AletheiaIcon name="CalendarDays" data-testid="pascal-icon-2" />);
      expect(screen.getByTestId('pascal-icon-2')).toBeInTheDocument();
    });

    it('resolves domain aliases correctly', () => {
      const domainAliases: IconName[] = [
        'learners',
        'devotional',
        'curriculum',
        'schedule',
        'records',
        'portfolio',
        'attendance',
        'reports',
        'familia',
        'estudante',
        'oracao',
        'configuracoes',
      ];

      for (const alias of domainAliases) {
        const { unmount } = render(<AletheiaIcon name={alias} data-testid={`alias-${alias}`} />);
        expect(screen.getByTestId(`alias-${alias}`)).toBeInTheDocument();
        unmount();
      }
    });
  });

  describe('Catalog Governance & Completeness', () => {
    it('contains all required standard and domain icons in ICON_NAMES catalog', () => {
      const requiredIcons: string[] = [
        'home',
        'users',
        'book-open',
        'library',
        'calendar-days',
        'calendar',
        'pen-line',
        'folder-heart',
        'folder',
        'clipboard-check',
        'bar-chart-3',
        'palette',
        'image',
        'pencil',
        'settings',
        'log-out',
        'chevron-down',
        'chevron-right',
        'chevron-left',
        'chevron-up',
        'menu',
        'x',
        'bell',
        'plus',
        'search',
        'check',
        'check-circle',
        'check-circle-2',
        'alert-triangle',
        'alert-circle',
        'info',
        'clock',
        'sparkles',
        'graduation-cap',
        'heart',
        'shield',
        'file-text',
        'layers',
        'compass',
        'trash-2',
        'edit-3',
        'filter',
        'external-link',
        'refresh-cw',
        'user',
        'user-plus',
        'sun',
        'moon',
        'download',
        'upload',
        'arrow-right',
        'arrow-left',
        'lock',
        'unlock',
        'eye',
        'eye-off',
        'more-vertical',
        'more-horizontal',
      ];

      for (const iconName of requiredIcons) {
        expect(ICON_NAMES).toContain(iconName);
      }
    });

    it('successfully renders every icon defined in ICON_NAMES', () => {
      for (const iconName of ICON_NAMES) {
        const { unmount } = render(<AletheiaIcon name={iconName} data-testid={`catalog-${iconName}`} />);
        expect(screen.getByTestId(`catalog-${iconName}`)).toBeInTheDocument();
        unmount();
      }
    });

    it('exports ICON_SIZES constant with expected pixel mappings', () => {
      expect(ICON_SIZES).toEqual({
        sm: 16,
        md: 20,
        lg: 24,
        xl: 32,
      });
    });

    it('never silently falls back to HelpCircle for a declared catalog name', () => {
      // resolveIcon() falls back to HelpCircle for any unresolvable name
      // instead of throwing, so a typo'd or removed registry key would
      // otherwise still render successfully (just as the wrong glyph) and
      // pass every other test in this file undetected. This is the actual
      // regression the catalog needs protection against.
      for (const iconName of ICON_NAMES) {
        if (iconName === 'help-circle' || iconName === 'HelpCircle') continue;
        expect(resolveIcon(iconName), `"${iconName}" resolved to the HelpCircle fallback`).not.toBe(
          HelpCircle,
        );
      }
    });
  });
});
