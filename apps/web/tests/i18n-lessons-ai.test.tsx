import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { LocaleProvider, useLocale } from '../src/lib/i18n/locale-context';
import { ptBR } from '../src/lib/i18n/dictionaries/pt-BR';
import { enUS } from '../src/lib/i18n/dictionaries/en-US';
import { esES } from '../src/lib/i18n/dictionaries/es-ES';

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.lang = 'pt-BR';
  vi.restoreAllMocks();
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

describe('i18n Lessons AI Assistant Dictionaries & Parity', () => {
  function collectKeysAndValues(
    obj: Record<string, any>,
    prefix = '',
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

  it('guarantees that lessons.aiAssistant exists in pt-BR, en-US, and es-ES', () => {
    expect((ptBR.lessons as any).aiAssistant).toBeDefined();
    expect((enUS.lessons as any).aiAssistant).toBeDefined();
    expect((esES.lessons as any).aiAssistant).toBeDefined();
  });

  it('guarantees that all required aiAssistant keys are present and non-empty in all 3 languages', () => {
    const requiredKeys = [
      'openButton',
      'configTitle',
      'configSubtitle',
      'learnerLabel',
      'subjectLabel',
      'topicLabel',
      'topicPlaceholder',
      'durationLabel',
      'instructionsLabel',
      'instructionsPlaceholder',
      'generateButton',
      'generating',
      'reviewTitle',
      'reviewNotice',
      'titleLabel',
      'summaryLabel',
      'materialsLabel',
      'dateLabel',
      'stepsTitle',
      'step',
      'stepInstructions',
      'stepNarration',
      'assessmentLabel',
      'approveButton',
      'approving',
      'rejectButton',
      'rejecting',
      'backButton',
      'consentNoticeTitle',
      'consentNoticeDescription',
      'goToConsentButton',
      'closeButton',
      'coppaBadge',
      'quotaRemaining',
      'quotaExceeded',
      'genericError',
      'successScheduled',
    ];

    const ptAi = (ptBR.lessons as any)?.aiAssistant || {};
    const enAi = (enUS.lessons as any)?.aiAssistant || {};
    const esAi = (esES.lessons as any)?.aiAssistant || {};

    for (const key of requiredKeys) {
      expect(typeof ptAi[key], `Missing pt-BR key: ${key}`).toBe('string');
      expect(ptAi[key].trim().length, `Empty pt-BR value for key: ${key}`).toBeGreaterThan(0);

      expect(typeof enAi[key], `Missing en-US key: ${key}`).toBe('string');
      expect(enAi[key].trim().length, `Empty en-US value for key: ${key}`).toBeGreaterThan(0);

      expect(typeof esAi[key], `Missing es-ES key: ${key}`).toBe('string');
      expect(esAi[key].trim().length, `Empty es-ES value for key: ${key}`).toBeGreaterThan(0);
    }
  });

  it('guarantees 100% exact parity of keys and interpolation variables between all locales', () => {
    const ptEntries = collectKeysAndValues((ptBR.lessons as any)?.aiAssistant || {}, 'lessons.aiAssistant');
    const enMap = new Map(
      collectKeysAndValues((enUS.lessons as any)?.aiAssistant || {}, 'lessons.aiAssistant').map((e) => [
        e.key,
        e.value,
      ]),
    );
    const esMap = new Map(
      collectKeysAndValues((esES.lessons as any)?.aiAssistant || {}, 'lessons.aiAssistant').map((e) => [
        e.key,
        e.value,
      ]),
    );

    expect(ptEntries.length).toBeGreaterThan(0);
    expect(enMap.size).toBe(ptEntries.length);
    expect(esMap.size).toBe(ptEntries.length);

    for (const { key, value: ptValue } of ptEntries) {
      expect(enMap.has(key), `Key '${key}' present in pt-BR but missing in en-US`).toBe(true);
      expect(esMap.has(key), `Key '${key}' present in pt-BR but missing in es-ES`).toBe(true);

      const ptVars = extractVariables(ptValue);
      const enVars = extractVariables(enMap.get(key)!);
      const esVars = extractVariables(esMap.get(key)!);

      expect(
        enVars,
        `Interpolation variable discrepancy in '${key}' between pt-BR and en-US`,
      ).toEqual(ptVars);
      expect(
        esVars,
        `Interpolation variable discrepancy in '${key}' between pt-BR and es-ES`,
      ).toEqual(ptVars);
    }
  });

  it('renders translated keys with variable interpolation across locales', () => {
    // pt-BR
    const { unmount: unmountPt } = render(
      <LocaleProvider>
        <Probe
          translationKey="lessons.aiAssistant.quotaRemaining"
          vars={{ tokens: 45000, requests: 8 }}
        />
      </LocaleProvider>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent(
      'Cota mensal restante: 45000 tokens e 8 requisições',
    );
    unmountPt();

    // en-US
    localStorage.setItem('aletheia_locale', 'en-US');
    const { unmount: unmountEn } = render(
      <LocaleProvider>
        <Probe
          translationKey="lessons.aiAssistant.quotaRemaining"
          vars={{ tokens: 45000, requests: 8 }}
        />
      </LocaleProvider>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent(
      'Remaining monthly quota: 45000 tokens and 8 requests',
    );
    unmountEn();

    // es-ES
    localStorage.setItem('aletheia_locale', 'es-ES');
    render(
      <LocaleProvider>
        <Probe
          translationKey="lessons.aiAssistant.quotaRemaining"
          vars={{ tokens: 45000, requests: 8 }}
        />
      </LocaleProvider>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent(
      'Cuota mensual restante: 45000 tokens y 8 solicitudes',
    );
  });
});
