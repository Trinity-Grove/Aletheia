import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const USER_FACING_ATTRS = new Set([
  'placeholder',
  'title',
  'aria-label',
  'label',
  'helperText',
  'description',
  'alt',
]);

export function analyzeSourceCode(filePath, source) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const hasUseLocale = source.includes('useLocale');
  const hardcodedStrings = [];

  const lines = source.split('\n');
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const trimmed = line.trim();

    // Ignore imports, comments
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('import ')
    ) {
      continue;
    }

    // Check user-facing attributes: placeholder="...", title="...", etc.
    for (const attr of USER_FACING_ATTRS) {
      const regex = new RegExp(`(?:^|\\s)${attr}=["']([^"']+)["']`, 'g');
      let match;
      while ((match = regex.exec(line)) !== null) {
        const val = match[1].trim();
        if (val.length >= 3 && /[a-zA-ZÀ-ÿ]/.test(val) && !val.startsWith('http')) {
          hardcodedStrings.push({
            line: lineIndex + 1,
            text: val,
            type: `prop:${attr}`,
          });
        }
      }
    }

    // Check JSX text children: >Texto aqui<
    const jsxTextRegex = />([^<>{}\n]+)</g;
    let textMatch;
    while ((textMatch = jsxTextRegex.exec(line)) !== null) {
      const text = textMatch[1].trim();
      // Filter out symbols, pure numbers, and technical whitespace
      if (
        text.length >= 3 &&
        /[a-zA-ZÀ-ÿ]{2,}/.test(text) &&
        !text.startsWith('http') &&
        !text.startsWith('//')
      ) {
        hardcodedStrings.push({
          line: lineIndex + 1,
          text,
          type: 'jsx-text',
        });
      }
    }
  }

  return {
    filePath: normalizedPath,
    hasUseLocale,
    hardcodedStrings,
    isFullyLocalized: hasUseLocale && hardcodedStrings.length === 0,
  };
}

export async function scanDirectory(baseDir) {
  const results = [];
  const projectRoot = process.cwd();

  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch (err) {
      if (err?.code === 'ENOENT') return;
      throw err;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx')) &&
        !entry.name.endsWith('.test.tsx') &&
        !entry.name.endsWith('.test.jsx') &&
        !entry.name.endsWith('.spec.tsx') &&
        !entry.name.endsWith('.spec.jsx')
      ) {
        const content = await readFile(fullPath, 'utf-8');
        const displayPath = fullPath.startsWith(projectRoot)
          ? relative(projectRoot, fullPath).replace(/\\/g, '/')
          : fullPath.replace(/\\/g, '/');
        results.push(analyzeSourceCode(displayPath, content));
      }
    }
  }

  await walk(baseDir);
  return results;
}

export function formatMarkdownReport(results) {
  const pages = results.filter((r) => r.filePath.includes('/app/') || r.filePath.startsWith('apps/web/app/'));
  const components = results.filter((r) => r.filePath.includes('/components/') || r.filePath.startsWith('apps/web/src/components/'));

  const pageTotal = pages.length;
  const pageTranslated = pages.filter((p) => p.isFullyLocalized).length;
  const pagePending = pageTotal - pageTranslated;
  const pagePct = pageTotal > 0 ? ((pageTranslated / pageTotal) * 100).toFixed(1) : '100.0';

  const compTotal = components.length;
  const compTranslated = components.filter((c) => c.isFullyLocalized).length;
  const compPending = compTotal - compTranslated;
  const compPct = compTotal > 0 ? ((compTranslated / compTotal) * 100).toFixed(1) : '100.0';

  const totalFiles = results.length;
  const totalTranslated = results.filter((r) => r.isFullyLocalized).length;
  const totalPct = totalFiles > 0 ? ((totalTranslated / totalFiles) * 100).toFixed(1) : '100.0';

  const rows = results.map((item) => {
    const isPage = item.filePath.includes('/app/') || item.filePath.startsWith('apps/web/app/');
    const typeStr = isPage ? 'Página' : 'Componente';
    const statusStr = item.isFullyLocalized ? '✅ Traduzido' : '❌ Pendente';
    const literalsStr = `${item.hardcodedStrings.length} strings`;
    return `| ${typeStr} | \`${item.filePath}\` | ${statusStr} | ${literalsStr} |`;
  });

  return [
    '# Relatório de Cobertura de Internacionalização (i18n)',
    '',
    `- **Total de Páginas:** ${pageTotal} (${pageTranslated} traduzidas, ${pagePending} pendentes - ${pagePct}%)`,
    `- **Total de Componentes:** ${compTotal} (${compTranslated} traduzidos, ${compPending} pendentes - ${compPct}%)`,
    `- **Cobertura Total de Frontend:** ${totalTranslated} / ${totalFiles} arquivos (${totalPct}%)`,
    '',
    '| Tipo | Caminho | Status i18n | Literais Detectados |',
    '| :--- | :--- | :--- | :--- |',
    ...rows,
  ].join('\n');
}

export function formatSummaryReport(results) {
  const pages = results.filter((r) => r.filePath.includes('/app/') || r.filePath.startsWith('apps/web/app/'));
  const components = results.filter((r) => r.filePath.includes('/components/') || r.filePath.startsWith('apps/web/src/components/'));

  const pageTotal = pages.length;
  const pageTranslated = pages.filter((p) => p.isFullyLocalized).length;
  const pagePct = pageTotal > 0 ? ((pageTranslated / pageTotal) * 100).toFixed(1) : '100.0';

  const compTotal = components.length;
  const compTranslated = components.filter((c) => c.isFullyLocalized).length;
  const compPct = compTotal > 0 ? ((compTranslated / compTotal) * 100).toFixed(1) : '100.0';

  const totalFiles = results.length;
  const totalTranslated = results.filter((r) => r.isFullyLocalized).length;
  const totalPending = totalFiles - totalTranslated;
  const totalPct = totalFiles > 0 ? ((totalTranslated / totalFiles) * 100).toFixed(1) : '100.0';

  return [
    '============================================================',
    'i18n Coverage Summary / Relatório de Cobertura i18n',
    '============================================================',
    `Páginas / Pages:         ${pageTranslated} / ${pageTotal} (${pagePct}%)`,
    `Componentes / Components: ${compTranslated} / ${compTotal} (${compPct}%)`,
    `Total:                   ${totalTranslated} / ${totalFiles} (${totalPct}%)`,
    `Pendentes / Pending:     ${totalPending}`,
    '============================================================',
  ].join('\n');
}

export function formatJsonReport(results) {
  return JSON.stringify(results, null, 2);
}

export async function runCli(argv = process.argv.slice(2)) {
  const projectRoot = process.cwd();
  const appDir = resolve(projectRoot, 'apps/web/app');
  const componentsDir = resolve(projectRoot, 'apps/web/src/components');

  const [appResults, compResults] = await Promise.all([
    scanDirectory(appDir),
    scanDirectory(componentsDir),
  ]);

  const allResults = [...appResults, ...compResults].sort((a, b) =>
    a.filePath.localeCompare(b.filePath),
  );

  if (argv.includes('--json')) {
    process.stdout.write(`${formatJsonReport(allResults)}\n`);
  } else if (argv.includes('--markdown')) {
    process.stdout.write(`${formatMarkdownReport(allResults)}\n`);
  } else {
    process.stdout.write(`${formatSummaryReport(allResults)}\n`);
  }
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try {
    const scriptPath = resolve(process.argv[1]).toLowerCase();
    const modulePath = fileURLToPath(import.meta.url).toLowerCase();
    return scriptPath === modulePath;
  } catch {
    return false;
  }
}

if (isMainModule()) {
  runCli().catch((err) => {
    process.stderr.write(`${err?.stack || err}\n`);
    process.exitCode = 1;
  });
}
