import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { LocaleProvider, useLocale } from '../src/lib/i18n/locale-context';
import { ptBR } from '../src/lib/i18n/dictionaries/pt-BR';
import { enUS } from '../src/lib/i18n/dictionaries/en-US';
import { esES } from '../src/lib/i18n/dictionaries/es-ES';

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.lang = 'pt-BR';
});

function Probe({
  translationKey,
  vars,
}: {
  translationKey: string;
  vars?: Record<string, string | number>;
}) {
  const { t } = useLocale();
  return <span data-testid="probe">{t(translationKey, vars)}</span>;
}

function collectKeysAndValues(
  obj: Record<string, any>,
  prefix = ''
): { key: string; value: string }[] {
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

const WAVE_5_NAMESPACES = [
  'learners',
  'invitations',
  'landing',
  'shared',
  'showcase',
  'settings',
  'auth',
] as const;

describe('Wave 5 Global i18n — Dicionários e Testes TDD', () => {
  describe('Registro de Namespaces da Onda 5', () => {
    it('registra todos os namespaces da Onda 5 em ptBR, enUS e esES', () => {
      for (const ns of WAVE_5_NAMESPACES) {
        expect(ptBR, `Namespace '${ns}' ausente em ptBR`).toHaveProperty(ns);
        expect(enUS, `Namespace '${ns}' ausente em enUS`).toHaveProperty(ns);
        expect(esES, `Namespace '${ns}' ausente em esES`).toHaveProperty(ns);
      }
    });
  });

  describe('Integridade e Não-Vacuidade dos Dicionários da Onda 5', () => {
    it('garante que nenhum valor de tradução da Onda 5 seja vazio ou apenas espaços', () => {
      for (const ns of WAVE_5_NAMESPACES) {
        const ptEntries = collectKeysAndValues((ptBR as Record<string, any>)[ns] ?? {}, ns);
        const enEntries = collectKeysAndValues((enUS as Record<string, any>)[ns] ?? {}, ns);
        const esEntries = collectKeysAndValues((esES as Record<string, any>)[ns] ?? {}, ns);

        expect(ptEntries.length, `Namespace '${ns}' em ptBR não deve ser vazio`).toBeGreaterThan(0);
        expect(enEntries.length, `Namespace '${ns}' em enUS não deve ser vazio`).toBeGreaterThan(0);
        expect(esEntries.length, `Namespace '${ns}' em esES não deve ser vazio`).toBeGreaterThan(0);

        for (const entry of [...ptEntries, ...enEntries, ...esEntries]) {
          expect(entry.value.trim().length, `Chave vazia detectada: ${entry.key}`).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Simetria de Chaves e Paridade de Tokens {var}', () => {
    it('garante simetria exata de chaves e variáveis nos namespaces da Onda 5 entre pt-BR, en-US e es-ES', () => {
      for (const ns of WAVE_5_NAMESPACES) {
        const ptEntries = collectKeysAndValues((ptBR as Record<string, any>)[ns] ?? {}, ns);
        const enMap = new Map(
          collectKeysAndValues((enUS as Record<string, any>)[ns] ?? {}, ns).map((e) => [e.key, e.value])
        );
        const esMap = new Map(
          collectKeysAndValues((esES as Record<string, any>)[ns] ?? {}, ns).map((e) => [e.key, e.value])
        );

        // All PT keys must exist in EN and ES
        for (const { key, value: ptValue } of ptEntries) {
          expect(enMap.has(key), `Chave '${key}' presente em pt-BR mas ausente em en-US`).toBe(true);
          expect(esMap.has(key), `Chave '${key}' presente em pt-BR mas ausente em es-ES`).toBe(true);

          const ptVars = extractVariables(ptValue);
          const enVars = extractVariables(enMap.get(key)!);
          const esVars = extractVariables(esMap.get(key)!);

          expect(enVars, `Discrepância de variáveis {var} na chave '${key}' entre pt-BR e en-US`).toEqual(ptVars);
          expect(esVars, `Discrepância de variáveis {var} na chave '${key}' entre pt-BR e es-ES`).toEqual(ptVars);
        }

        // No extra keys in EN or ES
        const ptKeySet = new Set(ptEntries.map((e) => e.key));
        for (const enKey of enMap.keys()) {
          expect(ptKeySet.has(enKey), `Chave '${enKey}' presente em en-US mas ausente em pt-BR`).toBe(true);
        }
        for (const esKey of esMap.keys()) {
          expect(ptKeySet.has(esKey), `Chave '${esKey}' presente em es-ES mas ausente em pt-BR`).toBe(true);
        }
      }
    });
  });

  describe('Renderização no LocaleProvider com t(...)', () => {
    it('traduz chaves dos novos namespaces da Onda 5 em pt-BR, en-US e es-ES', () => {
      // pt-BR (default)
      const { unmount } = render(
        <LocaleProvider>
          <div>
            <Probe translationKey="learners.title" />
            <Probe translationKey="invitations.title" />
            <Probe translationKey="landing.actions.schedule" />
            <Probe translationKey="shared.loading" />
            <Probe translationKey="showcase.tabs.tokens" />
          </div>
        </LocaleProvider>
      );

      expect(screen.getByText('Gestão de Educandos')).toBeInTheDocument();
      expect(screen.getByText('Convite para Família')).toBeInTheDocument();
      expect(screen.getByText('Agenda & Checklist')).toBeInTheDocument();
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
      expect(screen.getByText('Cores & Tokens')).toBeInTheDocument();
      unmount();

      // en-US
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount: unmountEn } = render(
        <LocaleProvider>
          <div>
            <Probe translationKey="learners.title" />
            <Probe translationKey="invitations.title" />
            <Probe translationKey="landing.actions.schedule" />
            <Probe translationKey="shared.loading" />
            <Probe translationKey="showcase.tabs.tokens" />
          </div>
        </LocaleProvider>
      );

      expect(screen.getByText('Learner Management')).toBeInTheDocument();
      expect(screen.getByText('Family Invitation')).toBeInTheDocument();
      expect(screen.getByText('Schedule & Checklist')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('Colors & Tokens')).toBeInTheDocument();
      unmountEn();

      // es-ES
      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <div>
            <Probe translationKey="learners.title" />
            <Probe translationKey="invitations.title" />
            <Probe translationKey="landing.actions.schedule" />
            <Probe translationKey="shared.loading" />
            <Probe translationKey="showcase.tabs.tokens" />
          </div>
        </LocaleProvider>
      );

      expect(screen.getByText('Gestión de Educandos')).toBeInTheDocument();
      expect(screen.getByText('Invitación para la Familia')).toBeInTheDocument();
      expect(screen.getByText('Agenda y Lista de Tareas')).toBeInTheDocument();
      expect(screen.getByText('Cargando...')).toBeInTheDocument();
      expect(screen.getByText('Colores y Tokens')).toBeInTheDocument();
    });

    it('interpola variáveis corretamente nos novos namespaces', () => {
      // pt-BR
      const { unmount } = render(
        <LocaleProvider>
          <Probe translationKey="learners.accessModal.title" vars={{ name: 'Samuel' }} />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Acesso do Educando — Samuel');
      unmount();

      // en-US
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount: unmountEn } = render(
        <LocaleProvider>
          <Probe translationKey="learners.accessModal.title" vars={{ name: 'Samuel' }} />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Learner Access — Samuel');
      unmountEn();

      // es-ES
      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <Probe translationKey="learners.accessModal.title" vars={{ name: 'Samuel' }} />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Acceso del Educando — Samuel');
    });
  });
});
