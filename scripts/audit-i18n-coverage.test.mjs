import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { analyzeSourceCode, scanDirectory, formatMarkdownReport, formatSummaryReport } from './audit-i18n-coverage.mjs';

describe('audit-i18n-coverage', () => {
  it('detecta ausência de useLocale e lista textos literais em JSX', () => {
    const code = `
      export default function TestPage() {
        return (
          <div>
            <h1>Bem-vindo ao Sistema</h1>
            <p>Texto fixo em português</p>
            <input placeholder="Digite seu nome" />
          </div>
        );
      }
    `;

    const result = analyzeSourceCode('apps/web/app/test/page.tsx', code);
    assert.equal(result.hasUseLocale, false);
    assert.equal(result.isFullyLocalized, false);
    assert.ok(result.hardcodedStrings.length >= 3);
    assert.ok(result.hardcodedStrings.some((s) => s.text.includes('Bem-vindo')));
    assert.ok(result.hardcodedStrings.some((s) => s.text.includes('Digite seu nome')));
  });

  it('reconhece componente com useLocale e ignora chamadas a t(...)', () => {
    const code = `
      import { useLocale } from '@/lib/i18n/locale-context';
      export function LocalizedComponent() {
        const { t } = useLocale();
        return (
          <div>
            <h1>{t('common.home')}</h1>
            <input placeholder={t('common.search')} />
          </div>
        );
      }
    `;

    const result = analyzeSourceCode('apps/web/src/components/test.tsx', code);
    assert.equal(result.hasUseLocale, true);
    assert.equal(result.hardcodedStrings.length, 0);
    assert.equal(result.isFullyLocalized, true);
  });

  it('detecta atributos voltados ao usuário e ignora atributos técnicos', () => {
    const code = `
      export function FormField() {
        return (
          <div className="container" data-testid="field-test" id="field-1">
            <input
              placeholder="Digite aqui"
              title="Dica de ajuda"
              aria-label="Campo de busca"
              alt="Imagem do perfil"
            />
          </div>
        );
      }
    `;

    const result = analyzeSourceCode('apps/web/src/components/form-field.tsx', code);
    assert.equal(result.hasUseLocale, false);
    const types = result.hardcodedStrings.map((item) => item.type);
    assert.ok(types.includes('prop:placeholder'));
    assert.ok(types.includes('prop:title'));
    assert.ok(types.includes('prop:aria-label'));
    assert.ok(types.includes('prop:alt'));
    assert.ok(!types.includes('prop:className'));
    assert.ok(!types.includes('prop:data-testid'));
    assert.ok(!types.includes('prop:id'));
  });

  it('ignora números puros, pontuação isolada, links http e comentários', () => {
    const code = `
      // Comentário de linha em português
      /* Comentário de bloco em português */
      import { Something } from './something';

      export function TechnicalStuff() {
        return (
          <div>
            <span>123</span>
            <span>--</span>
            <span>https://example.com</span>
            <p>Texto legítimo aqui</p>
          </div>
        );
      }
    `;

    const result = analyzeSourceCode('apps/web/src/components/tech.tsx', code);
    assert.equal(result.hardcodedStrings.length, 1);
    assert.equal(result.hardcodedStrings[0].text, 'Texto legítimo aqui');
  });

  it('scanDirectory percorre recursivamente e ignora arquivos de teste', async () => {
    const testDir = await mkdtemp(join(tmpdir(), 'aletheia-audit-test-'));
    try {
      const subDir = join(testDir, 'nested');
      await mkdir(subDir, { recursive: true });

      await writeFile(
        join(testDir, 'page.tsx'),
        'export default function Page() { return <h1>Título da Página</h1>; }',
      );
      await writeFile(
        join(subDir, 'widget.tsx'),
        'export function Widget() { return <p>Conteúdo do Widget</p>; }',
      );
      await writeFile(
        join(subDir, 'widget.test.tsx'),
        'it("test", () => {});',
      );

      const results = await scanDirectory(testDir);
      assert.equal(results.length, 2);
      assert.ok(results.some((r) => r.filePath.includes('page.tsx')));
      assert.ok(results.some((r) => r.filePath.includes('widget.tsx')));
      assert.ok(!results.some((r) => r.filePath.includes('widget.test.tsx')));
    } finally {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  it('formata relatórios markdown e summary com contadores e percentuais', () => {
    const mockResults = [
      {
        filePath: 'apps/web/app/home/page.tsx',
        hasUseLocale: true,
        hardcodedStrings: [],
        isFullyLocalized: true,
      },
      {
        filePath: 'apps/web/app/attendance/page.tsx',
        hasUseLocale: false,
        hardcodedStrings: [{ line: 10, text: 'Chamada Escolar', type: 'jsx-text' }],
        isFullyLocalized: false,
      },
      {
        filePath: 'apps/web/src/components/badge.tsx',
        hasUseLocale: false,
        hardcodedStrings: [{ line: 5, text: 'Ativo', type: 'jsx-text' }],
        isFullyLocalized: false,
      },
    ];

    const md = formatMarkdownReport(mockResults);
    assert.ok(md.includes('# Relatório de Cobertura de Internacionalização (i18n)'));
    assert.ok(md.includes('Total de Páginas'));
    assert.ok(md.includes('Total de Componentes'));
    assert.ok(md.includes('apps/web/app/home/page.tsx'));
    assert.ok(md.includes('✅ Traduzido'));
    assert.ok(md.includes('❌ Pendente'));

    const summary = formatSummaryReport(mockResults);
    assert.ok(summary.includes('i18n Coverage Summary'));
  });
});
