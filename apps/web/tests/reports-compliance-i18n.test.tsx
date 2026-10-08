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

function Probe({ translationKey }: { translationKey: string }) {
  const { t } = useLocale();
  return <span data-testid="probe">{t(translationKey)}</span>;
}

function collectKeysAndValues(obj: Record<string, any>, prefix = ''): { key: string; value: string }[] {
  const entries: { key: string; value: string }[] = [];
  if (!obj || typeof obj !== 'object') return entries;
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

describe('Wave 4: Dicionários i18n Reports & Compliance', () => {
  describe('Existência e Registro no Objeto Raiz dos Dicionários', () => {
    it('reports e compliance estão definidos em ptBR, enUS e esES', () => {
      const pt = ptBR as any;
      const en = enUS as any;
      const es = esES as any;

      expect(pt.reports, 'ptBR.reports deve estar definido').toBeDefined();
      expect(pt.compliance, 'ptBR.compliance deve estar definido').toBeDefined();

      expect(en.reports, 'enUS.reports deve estar definido').toBeDefined();
      expect(en.compliance, 'enUS.compliance deve estar definido').toBeDefined();

      expect(es.reports, 'esES.reports deve estar definido').toBeDefined();
      expect(es.compliance, 'esES.compliance deve estar definido').toBeDefined();
    });
  });

  describe('Paridade de Chaves e Estrutura dos Dicionários', () => {
    it('garante que nenhuma chave de reports ou compliance seja vazia ou espaços', () => {
      const pt = ptBR as any;
      const en = enUS as any;
      const es = esES as any;

      const ptReports = collectKeysAndValues(pt.reports, 'reports');
      const enReports = collectKeysAndValues(en.reports, 'reports');
      const esReports = collectKeysAndValues(es.reports, 'reports');

      const ptCompliance = collectKeysAndValues(pt.compliance, 'compliance');
      const enCompliance = collectKeysAndValues(en.compliance, 'compliance');
      const esCompliance = collectKeysAndValues(es.compliance, 'compliance');

      const allEntries = [
        ...ptReports,
        ...enReports,
        ...esReports,
        ...ptCompliance,
        ...enCompliance,
        ...esCompliance,
      ];

      expect(allEntries.length).toBeGreaterThan(0);

      for (const entry of allEntries) {
        expect(entry.value.trim().length, `Chave vazia detectada: ${entry.key}`).toBeGreaterThan(0);
      }
    });

    it('garante 100% de simetria de chaves em reports entre pt-BR, en-US e es-ES', () => {
      const pt = ptBR as any;
      const en = enUS as any;
      const es = esES as any;

      const ptEntries = collectKeysAndValues(pt.reports, 'reports');
      const enMap = new Map(collectKeysAndValues(en.reports, 'reports').map((e) => [e.key, e.value]));
      const esMap = new Map(collectKeysAndValues(es.reports, 'reports').map((e) => [e.key, e.value]));

      expect(ptEntries.length).toBeGreaterThan(0);

      for (const { key, value: ptValue } of ptEntries) {
        expect(enMap.has(key), `Chave '${key}' presente em pt-BR mas ausente em en-US`).toBe(true);
        expect(esMap.has(key), `Chave '${key}' presente em pt-BR mas ausente em es-ES`).toBe(true);

        const ptVars = extractVariables(ptValue);
        const enVars = extractVariables(enMap.get(key) ?? '');
        const esVars = extractVariables(esMap.get(key) ?? '');

        expect(enVars, `Discrepância de variáveis em '${key}' entre pt-BR e en-US`).toEqual(ptVars);
        expect(esVars, `Discrepância de variáveis em '${key}' entre pt-BR e es-ES`).toEqual(ptVars);
      }

      expect(enMap.size).toBe(ptEntries.length);
      expect(esMap.size).toBe(ptEntries.length);
    });

    it('garante 100% de simetria de chaves em compliance entre pt-BR, en-US e es-ES', () => {
      const pt = ptBR as any;
      const en = enUS as any;
      const es = esES as any;

      const ptEntries = collectKeysAndValues(pt.compliance, 'compliance');
      const enMap = new Map(collectKeysAndValues(en.compliance, 'compliance').map((e) => [e.key, e.value]));
      const esMap = new Map(collectKeysAndValues(es.compliance, 'compliance').map((e) => [e.key, e.value]));

      expect(ptEntries.length).toBeGreaterThan(0);

      for (const { key, value: ptValue } of ptEntries) {
        expect(enMap.has(key), `Chave '${key}' presente em pt-BR mas ausente em en-US`).toBe(true);
        expect(esMap.has(key), `Chave '${key}' presente em pt-BR mas ausente em es-ES`).toBe(true);

        const ptVars = extractVariables(ptValue);
        const enVars = extractVariables(enMap.get(key) ?? '');
        const esVars = extractVariables(esMap.get(key) ?? '');

        expect(enVars, `Discrepância de variáveis em '${key}' entre pt-BR e en-US`).toEqual(ptVars);
        expect(esVars, `Discrepância de variáveis em '${key}' entre pt-BR e es-ES`).toEqual(ptVars);
      }

      expect(enMap.size).toBe(ptEntries.length);
      expect(esMap.size).toBe(ptEntries.length);
    });

    it('possui todas as seções obrigatórias de reports do brief', () => {
      const pt = ptBR as any;
      const r = pt.reports;
      expect(r).toBeDefined();
      expect(r.pages?.portfolio?.title).toBeDefined();
      expect(r.pages?.reports?.title).toBeDefined();
      expect(r.tracker?.emptyTitle).toBeDefined();
      expect(r.tracker?.batchTitle).toBeDefined();
      expect(r.gauge?.noDataTitle).toBeDefined();
      expect(r.gauge?.daysCompleted).toBeDefined();
      expect(r.generator?.emptyTitle).toBeDefined();
      expect(r.generator?.previewTitle).toBeDefined();
      expect(r.printable?.legalDisclaimer).toBeDefined();
      expect(r.printable?.guardianSignature).toBeDefined();
      expect(r.verification?.docIdLabel).toBeDefined();
      expect(r.verification?.legalDisclaimer).toBeDefined();
    });

    it('possui todas as chaves obrigatórias de compliance do brief', () => {
      const pt = ptBR as any;
      const c = pt.compliance;
      expect(c).toBeDefined();
      expect(c.panel?.selectLearner).toBeDefined();
      expect(c.panel?.evaluating).toBeDefined();
      expect(c.panel?.evaluationErrorTitle).toBeDefined();
      expect(c.panel?.periodLabel).toBeDefined();
      expect(c.panel?.jurisdictionLabel).toBeDefined();
      expect(c.panel?.engineDiagnosis).toBeDefined();
      expect(c.panel?.recordedLabel).toBeDefined();
      expect(c.panel?.minimumLabel).toBeDefined();
      expect(c.panel?.legalDisclaimerTitle).toBeDefined();
      expect(c.panel?.manualOverrideTitle).toBeDefined();
      expect(c.panel?.manualOverrideDescription).toBeDefined();
      expect(c.panel?.manualOverridePlaceholder).toBeDefined();
    });
  });

  describe('Integração com LocaleProvider e Tradução', () => {
    it('renderiza chaves de reports nos três idiomas', () => {
      // pt-BR
      const { unmount: unmountPt } = render(
        <LocaleProvider>
          <Probe translationKey="reports.pages.portfolio.title" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Portfólio Vivo de Evidências');
      unmountPt();

      // en-US
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount: unmountEn } = render(
        <LocaleProvider>
          <Probe translationKey="reports.pages.portfolio.title" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Living Portfolio of Evidence');
      unmountEn();

      // es-ES
      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <Probe translationKey="reports.pages.portfolio.title" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent('Portafolio Vivo de Evidencias');
    });

    it('renderiza chaves de compliance nos três idiomas', () => {
      // pt-BR
      const { unmount: unmountPt } = render(
        <LocaleProvider>
          <Probe translationKey="compliance.panel.selectLearner" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent(
        'Selecione um educando para avaliar a conformidade legal e curricular.'
      );
      unmountPt();

      // en-US
      localStorage.setItem('aletheia_locale', 'en-US');
      const { unmount: unmountEn } = render(
        <LocaleProvider>
          <Probe translationKey="compliance.panel.selectLearner" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent(
        'Select a learner to evaluate legal and curriculum compliance.'
      );
      unmountEn();

      // es-ES
      localStorage.setItem('aletheia_locale', 'es-ES');
      render(
        <LocaleProvider>
          <Probe translationKey="compliance.panel.selectLearner" />
        </LocaleProvider>
      );
      expect(screen.getByTestId('probe')).toHaveTextContent(
        'Seleccione un educando para evaluar la conformidad legal y curricular.'
      );
    });
  });
});
