import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

function findSourceFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        results.push(...findSourceFiles(fullPath));
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Icon Governance in apps/web', () => {
  it('has zero direct imports from lucide-react in apps/web/app, apps/web/src, and apps/web/tests', () => {
    const rootDir = path.resolve(__dirname, '..');
    const appDir = path.join(rootDir, 'app');
    const srcDir = path.join(rootDir, 'src');
    const testsDir = path.join(rootDir, 'tests');

    const allFiles = [
      ...findSourceFiles(appDir),
      ...findSourceFiles(srcDir),
      ...findSourceFiles(testsDir),
    ];

    const violations: { file: string; line: string }[] = [];
    const lucideImportRegex = /from\s+['"]lucide-react['"]|require\(['"]lucide-react['"]\)/;

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? '';
        if (lucideImportRegex.test(line)) {
          violations.push({
            file: path.relative(rootDir, file).replace(/\\/g, '/'),
            line: `Line ${i + 1}: ${line.trim()}`,
          });
        }
      }
    }

    expect(
      violations,
      `Found direct lucide-react imports in apps/web:\n${violations
        .map((v) => `  - ${v.file}: ${v.line}`)
        .join('\n')}`
    ).toEqual([]);
  });

  it('does not include lucide-react in apps/web package.json dependencies or devDependencies', () => {
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const deps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};

    expect(deps['lucide-react']).toBeUndefined();
    expect(devDeps['lucide-react']).toBeUndefined();
  });
});
