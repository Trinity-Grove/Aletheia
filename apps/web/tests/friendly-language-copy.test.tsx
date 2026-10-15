import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { LocaleProvider, type Locale, useLocale } from '../src/lib/i18n/locale-context';
import { ptBR } from '../src/lib/i18n/dictionaries/pt-BR';
import { enUS } from '../src/lib/i18n/dictionaries/en-US';
import { esES } from '../src/lib/i18n/dictionaries/es-ES';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function Probe({ translationKey }: { translationKey: string }) {
  const { t } = useLocale();
  return <span data-testid="probe">{t(translationKey)}</span>;
}

const titleExpectations: Record<Locale, Record<string, string>> = {
  'pt-BR': {
    'curriculum.pages.curriculum.title': 'Planejamento curricular',
    'curriculum.explore.title': 'Descobrir trilhas de aprendizagem',
    'shared.schedule.title': 'Agenda de estudos',
    'records.page.title': 'Diário de aprendizagem',
    'reports.pages.portfolio.title': 'Trabalhos e portfólio',
    'attendance.page.title': 'Frequência e horas de estudo',
    'reports.pages.reports.title': 'Relatórios e históricos',
    'devotional.page.title': 'Devocional em família',
    'legalGuide.header.title': 'Guia legal e primeiros passos',
  },
  'en-US': {
    'curriculum.pages.curriculum.title': 'Curriculum planning',
    'curriculum.explore.title': 'Discover learning paths',
    'shared.schedule.title': 'Study schedule',
    'records.page.title': 'Learning journal',
    'reports.pages.portfolio.title': 'Work portfolio',
    'attendance.page.title': 'Attendance and study hours',
    'reports.pages.reports.title': 'Reports and academic records',
    'devotional.page.title': 'Family devotional',
    'legalGuide.header.title': 'Legal guide and getting started',
  },
  'es-ES': {
    'curriculum.pages.curriculum.title': 'Planificación curricular',
    'curriculum.explore.title': 'Descubrir rutas de aprendizaje',
    'shared.schedule.title': 'Agenda de estudio',
    'records.page.title': 'Diario de aprendizaje',
    'reports.pages.portfolio.title': 'Portafolio de trabajos',
    'attendance.page.title': 'Asistencia y horas de estudio',
    'reports.pages.reports.title': 'Informes e historiales',
    'devotional.page.title': 'Devocional en familia',
    'legalGuide.header.title': 'Guía legal y primeros pasos',
  },
};

function readPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[segment];
  }, value);
}

describe('Friendly multilingual content', () => {
  it('uses the approved friendly titles in all supported locales', () => {
    for (const [locale, expectations] of Object.entries(titleExpectations) as [Locale, Record<string, string>][]) {
      localStorage.setItem('aletheia_locale', locale);

      for (const [translationKey, expected] of Object.entries(expectations)) {
        render(
          <LocaleProvider>
            <Probe translationKey={translationKey} />
          </LocaleProvider>,
        );

        expect(screen.getByTestId('probe')).toHaveTextContent(expected);
        cleanup();
      }
    }
  });

  it('keeps the new pack and portfolio message namespaces structurally identical', () => {
    const dictionaries = [ptBR, enUS, esES];
    const namespaces = [
      'curriculum.packs.gallery',
      'curriculum.packs.editor',
      'records.portfolio.messages',
    ];

    for (const namespace of namespaces) {
      const reference = readPath(dictionaries[0], namespace);
      expect(reference).toBeDefined();

      for (const dictionary of dictionaries.slice(1)) {
        expect(Object.keys(readPath(dictionary, namespace) as object)).toEqual(Object.keys(reference as object));
      }
    }
  });

  it('does not keep user-facing pack gallery copy in JSX', () => {
    const filePath = path.resolve(__dirname, '../src/components/curriculum/curriculum-packs-gallery.tsx');
    const source = fs.readFileSync(filePath, 'utf8');

    expect(source).toContain("t('curriculum.packs.gallery.galleryTitle')");
    expect(source).toContain("t('curriculum.packs.gallery.import')");
    expect(source).toContain("t('curriculum.packs.gallery.loading')");
    expect(source).toContain("t('curriculum.packs.gallery.empty')");

    for (const literal of [
      'Galeria de Pacotes Curriculares',
      'Importar Pacote Curricular',
      'Voltar ao Currículo',
      'Carregando pacotes curriculares',
      'Nenhum pacote curricular encontrado',
      'Gerenciar Pacote',
      'Instalar no Currículo',
      'Conhecer Pacote',
      'Exportar JSON',
    ]) {
      expect(source).not.toContain(literal);
    }
  });
});
