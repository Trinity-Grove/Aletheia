import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LocaleProvider, useLocale } from '../src/lib/i18n/locale-context';
import { ptBR } from '../src/lib/i18n/dictionaries/pt-BR';
import { enUS } from '../src/lib/i18n/dictionaries/en-US';
import { esES } from '../src/lib/i18n/dictionaries/es-ES';
import { LoginForm } from '../src/components/auth/login-form';
import { RoleBadge } from '../src/components/auth/role-badge';

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.lang = 'pt-BR';
  vi.restoreAllMocks();
});

function Probe({ translationKey, vars }: { translationKey: string; vars?: Record<string, string | number> }) {
  const { t } = useLocale();
  return <span data-testid="probe">{t(translationKey, vars)}</span>;
}

function FormatterProbe({
  date,
  numberValue,
  currencyValue,
  currency,
}: {
  date: Date;
  numberValue: number;
  currencyValue: number;
  currency?: string;
}) {
  const { formatDate, formatTime, formatNumber, formatCurrency } = useLocale();
  return (
    <div>
      <span data-testid="formatted-date">{formatDate(date, { timeZone: 'UTC' })}</span>
      <span data-testid="formatted-time">{formatTime(date, { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' })}</span>
      <span data-testid="formatted-number">{formatNumber(numberValue)}</span>
      <span data-testid="formatted-currency">{formatCurrency(currencyValue, currency)}</span>
    </div>
  );
}

function SwitcherProbe() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div>
      <span data-testid="current-locale">{locale}</span>
      <span data-testid="translated-home">{t('common.home')}</span>
      <button data-testid="btn-set-en" onClick={() => setLocale('en-US')}>
        EN
      </button>
      <button data-testid="btn-set-es" onClick={() => setLocale('es-ES')}>
        ES
      </button>
      <button data-testid="btn-set-pt" onClick={() => setLocale('pt-BR')}>
        PT
      </button>
    </div>
  );
}

describe('i18n (Issue #33: Internacionalização, Dicionários e Formatadores)', () => {
  describe('Dicionários e Traduções', () => {
    it('translates a known key to the pt-BR default', () => {
      render(
        <LocaleProvider>
          <Probe translationKey="common.home" />
        </LocaleProvider>
      );

      expect(screen.getByTestId('probe')).toHaveTextContent('Início');
    });

    it('translates correctly in en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <LocaleProvider>
          <Probe translationKey="common.home" />
        </LocaleProvider>
      );

      expect(screen.getByTestId('probe')).toHaveTextContent('Home');
    });

    it('translates correctly in es-ES', () => {
      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <Probe translationKey="common.home" />
        </LocaleProvider>
      );

      expect(screen.getByTestId('probe')).toHaveTextContent('Inicio');
    });

    it('interpolates variables properly across languages', () => {
      // pt-BR
      const { unmount } = render(
        <LocaleProvider>
          <Probe translationKey="notifications.newCount" vars={{ count: 5 }} />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('5 novas');
      unmount();

      // en-US
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount: unmountEn } = render(
        <LocaleProvider>
          <Probe translationKey="notifications.newCount" vars={{ count: 5 }} />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('5 new');
      unmountEn();

      // es-ES
      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <Probe translationKey="notifications.newCount" vars={{ count: 5 }} />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('5 nuevas');
    });

    it('falls back to the key itself instead of throwing on a missing key', () => {
      render(
        <LocaleProvider>
          <Probe translationKey="nonexistent.key" />
        </LocaleProvider>
      );

      expect(screen.getByTestId('probe')).toHaveTextContent('nonexistent.key');
    });
  });

  describe('Formatadores por Locale (Data, Hora, Número, Moeda)', () => {
    const fixedDate = new Date('2026-09-17T14:30:00.000Z');
    const sampleNumber = 1234567.89;

    it('formats date, number and currency in pt-BR', () => {
      render(
        <LocaleProvider>
          <FormatterProbe date={fixedDate} numberValue={sampleNumber} currencyValue={150.5} />
        </LocaleProvider>
      );

      expect(screen.getByTestId('formatted-date').textContent).toMatch(/17\/0?9\/2026/);
      expect(screen.getByTestId('formatted-time').textContent).toMatch(/14:30/);
      // pt-BR uses dot for thousands and comma for decimals: 1.234.567,89
      expect(screen.getByTestId('formatted-number').textContent).toMatch(/1\.234\.567,89/);
      // pt-BR default currency is BRL (R$)
      expect(screen.getByTestId('formatted-currency').textContent).toMatch(/R\$\s?150,50/);
    });

    it('formats date, number and currency in en-US', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      render(
        <LocaleProvider>
          <FormatterProbe date={fixedDate} numberValue={sampleNumber} currencyValue={150.5} />
        </LocaleProvider>
      );

      expect(screen.getByTestId('formatted-date').textContent).toMatch(/0?9\/17\/2026/);
      expect(screen.getByTestId('formatted-time').textContent).toMatch(/0?2:30/);
      // en-US uses comma for thousands and dot for decimals: 1,234,567.89
      expect(screen.getByTestId('formatted-number').textContent).toMatch(/1,234,567\.89/);
      // en-US default currency is USD ($)
      expect(screen.getByTestId('formatted-currency').textContent).toMatch(/\$150\.50/);
    });

    it('formats date, number and currency in es-ES', () => {
      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <FormatterProbe date={fixedDate} numberValue={sampleNumber} currencyValue={150.5} />
        </LocaleProvider>
      );

      expect(screen.getByTestId('formatted-date').textContent).toMatch(/17\/0?9\/2026/);
      expect(screen.getByTestId('formatted-time').textContent).toMatch(/14:30/);
      // es-ES default currency is EUR (€)
      expect(screen.getByTestId('formatted-currency').textContent).toMatch(/150,50\s?€/);
    });

    it('respects explicit currency override in formatCurrency', () => {
      render(
        <LocaleProvider>
          <FormatterProbe date={fixedDate} numberValue={10} currencyValue={100} currency="USD" />
        </LocaleProvider>
      );

      // Explicit USD formatted with pt-BR numbers
      expect(screen.getByTestId('formatted-currency').textContent).toMatch(/US\$\s?100,00/);
    });
  });

  describe('Troca de Idioma e Sincronização', () => {
    it('switches locale dynamically and updates document.documentElement.lang and localStorage', async () => {
      render(
        <LocaleProvider>
          <SwitcherProbe />
        </LocaleProvider>
      );

      expect(screen.getByTestId('current-locale')).toHaveTextContent('pt-BR');
      expect(screen.getByTestId('translated-home')).toHaveTextContent('Início');
      expect(document.documentElement.lang).toBe('pt-BR');

      // Switch to EN
      fireEvent.click(screen.getByTestId('btn-set-en'));

      await waitFor(() => {
        expect(screen.getByTestId('current-locale')).toHaveTextContent('en-US');
        expect(screen.getByTestId('translated-home')).toHaveTextContent('Home');
        expect(document.documentElement.lang).toBe('en-US');
        expect(localStorage.getItem('aletheia_locale')).toBe('en-US');
      });

      // Switch to ES
      fireEvent.click(screen.getByTestId('btn-set-es'));

      await waitFor(() => {
        expect(screen.getByTestId('current-locale')).toHaveTextContent('es-ES');
        expect(screen.getByTestId('translated-home')).toHaveTextContent('Inicio');
        expect(document.documentElement.lang).toBe('es-ES');
        expect(localStorage.getItem('aletheia_locale')).toBe('es-ES');
      });
    });

    it('synchronizes locale choice with PATCH /api/v1/families/:familyId/settings when familyId is present', async () => {
      localStorage.setItem('familyId', 'fam-123');

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ language: 'en-US' }),
      } as Response);

      render(
        <LocaleProvider>
          <SwitcherProbe />
        </LocaleProvider>
      );

      fireEvent.click(screen.getByTestId('btn-set-en'));

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/v1/families/fam-123/settings',
          expect.objectContaining({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: 'en-US' }),
          })
        );
      });
    });

    it('does not throw when used outside a LocaleProvider (fallbackContext)', () => {
      expect(() => render(<Probe translationKey="common.home" />)).not.toThrow();
      expect(screen.getByTestId('probe')).toHaveTextContent('Início');

      const fixedDate = new Date('2026-09-17T14:30:00.000Z');
      render(<FormatterProbe date={fixedDate} numberValue={1000} currencyValue={50} />);
      expect(screen.getByTestId('formatted-date').textContent).toMatch(/17\/0?9\/2026/);
      expect(screen.getByTestId('formatted-currency').textContent).toMatch(/R\$\s?50,00/);
    });
  });

  describe('Integração de i18n em Auth e Onboarding', () => {
    it('renderiza LoginForm traduzido em en-US e es-ES', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount } = render(
        <LocaleProvider>
          <LoginForm />
        </LocaleProvider>
      );
      expect(screen.getByTestId('login-button')).toHaveTextContent('Sign in');
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      unmount();

      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <LoginForm />
        </LocaleProvider>
      );
      expect(screen.getByTestId('login-button')).toHaveTextContent('Iniciar sesión');
      expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    });

    it('renderiza RoleBadge com traduções em múltiplos idiomas', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount } = render(
        <LocaleProvider>
          <RoleBadge role="OWNER_GUARDIAN" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('role-badge')).toHaveTextContent('Primary Guardian');
      unmount();

      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <RoleBadge role="OWNER_GUARDIAN" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('role-badge')).toHaveTextContent('Tutor Principal');
    });

    it('traduz chaves de onboarding em en-US e es-ES', () => {
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount } = render(
        <LocaleProvider>
          <Probe translationKey="onboarding.wizard.welcomeTitle" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Welcome to Aletheia!');
      unmount();

      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <Probe translationKey="onboarding.wizard.welcomeTitle" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('¡Bienvenido a Aletheia!');
    });
  });
});

describe('Guardrails de Integridade Estrutural e Paridade de Dicionários', () => {
  function collectKeysAndValues(obj: Record<string, any>, prefix = ''): { key: string; value: string }[] {
    const entries: { key: string; value: string }[] = [];
    for (const [k, v] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'string') {
        entries.push({ key: fullKey, value: v });
      } else if (v && typeof v === 'object') {
        entries.push(...collectKeysAndValues(v, fullKey));
      }
    }
    return entries;
  }

  function extractVariables(template: string): string[] {
    const matches = [...template.matchAll(/\{(\w+)\}/g)];
    return matches.map((m) => m[1]!).sort();
  }

  it('garante que nenhuma chave em nenhum idioma seja vazia ou apenas espaços', () => {
    const ptEntries = collectKeysAndValues(ptBR);
    const enEntries = collectKeysAndValues(enUS);
    const esEntries = collectKeysAndValues(esES);

    for (const entry of [...ptEntries, ...enEntries, ...esEntries]) {
      expect(entry.value.trim().length, `Chave vazia detectada: ${entry.key}`).toBeGreaterThan(0);
    }
  });

  it('garante simetria exata de chaves e variáveis de interpolação {var} entre todos os idiomas', () => {
    const ptEntries = collectKeysAndValues(ptBR);
    const enMap = new Map(collectKeysAndValues(enUS).map((e) => [e.key, e.value]));
    const esMap = new Map(collectKeysAndValues(esES).map((e) => [e.key, e.value]));

    for (const { key, value: ptValue } of ptEntries) {
      expect(enMap.has(key), `Chave '${key}' presente em pt-BR mas ausente em en-US`).toBe(true);
      expect(esMap.has(key), `Chave '${key}' presente em pt-BR mas ausente em es-ES`).toBe(true);

      const ptVars = extractVariables(ptValue);
      const enVars = extractVariables(enMap.get(key)!);
      const esVars = extractVariables(esMap.get(key)!);

      expect(enVars, `Discrepância de variáveis {var} na chave '${key}' entre pt-BR e en-US`).toEqual(ptVars);
      expect(esVars, `Discrepância de variáveis {var} na chave '${key}' entre pt-BR e es-ES`).toEqual(ptVars);
    }
  });
});

