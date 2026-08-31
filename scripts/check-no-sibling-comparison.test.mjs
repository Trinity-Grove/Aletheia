import { readdir, readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

// README's "No Sibling Ranking / Comparisons" guardrail has no enforcement
// beyond this check: a plain-text scan for identifiers/strings that would
// signal a sibling-ranking or cross-learner-comparison feature landing in
// the codebase. It is a trip-wire, not a semantic guarantee — it can be
// defeated by sufficiently different naming, but it catches the obvious
// case (a component, function, or variable literally named for the thing
// the product promises never to build).
const projectRoot = resolve(import.meta.dirname, '..');
const scanRoots = ['apps/web/app', 'apps/web/src', 'apps/api/src'];
const scannedExtensions = new Set(['.ts', '.tsx']);

const deniedSubstrings = [
  'siblingrank',
  'ranksibling',
  'siblingcompar',
  'comparesibling',
  'learnerrank',
  'ranklearner',
  'siblingleaderboard',
  'learnerleaderboard',
];

// The one place "sibling" appears today is the guardrail documenting itself
// in a comment — an explicit statement that the feature must not exist, not
// an occurrence of it.
const allowedLines = new Set([
  'apps/web/src/components/records/records-journal-view.tsx:97',
]);

async function findSourceFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(directory, entry.name);
      if (entry.isDirectory()) return findSourceFiles(entryPath);
      return entry.isFile() && scannedExtensions.has(extname(entry.name))
        ? [entryPath]
        : [];
    }),
  );

  return files.flat();
}

test('no sibling-ranking or cross-learner-comparison identifiers exist in app source', async () => {
  const violations = [];

  for (const scanRoot of scanRoots) {
    const files = await findSourceFiles(resolve(projectRoot, scanRoot));

    for (const file of files) {
      const relativePath = file
        .slice(projectRoot.length + 1)
        .split('\\')
        .join('/');
      const content = await readFile(file, 'utf8');
      const lowerLines = content.split('\n').map((line) => line.toLowerCase());

      lowerLines.forEach((lowerLine, index) => {
        const lineKey = `${relativePath}:${index + 1}`;
        if (allowedLines.has(lineKey)) return;

        const hit = deniedSubstrings.find((needle) => lowerLine.includes(needle));
        if (hit) {
          violations.push(`${lineKey} matches "${hit}"`);
        }
      });
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Found sibling-ranking / cross-learner-comparison code, which the product guardrails prohibit:\n${violations.join('\n')}`,
  );
});
