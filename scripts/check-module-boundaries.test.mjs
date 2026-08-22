import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, test } from 'node:test';
import { spawnSync } from 'node:child_process';

const checkerPath = resolve('scripts/check-module-boundaries.mjs');
const fixtureRoots = [];

afterEach(async () => {
  await Promise.all(fixtureRoots.splice(0).map((fixtureRoot) => rm(fixtureRoot, { force: true, recursive: true })));
});

async function createFixture(files) {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'aletheia-boundaries-'));
  fixtureRoots.push(fixtureRoot);

  await Promise.all(
    Object.entries(files).map(async ([relativePath, content]) => {
      const filePath = join(fixtureRoot, 'apps/api/src/modules', relativePath);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, content);
    }),
  );

  return fixtureRoot;
}

function check(fixtureRoot) {
  return spawnSync(process.execPath, [checkerPath], {
    cwd: fixtureRoot,
    encoding: 'utf8',
  });
}

test('rejects a cross-module infrastructure import', async () => {
  const fixtureRoot = await createFixture({
    'curriculum/application/use-case.ts': "import { FamilyRepository } from '../../families/infrastructure/family.repository';\n",
  });

  const result = check(fixtureRoot);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /curriculum may not import families\/infrastructure/);
});

test('allows another module application public API import', async () => {
  const fixtureRoot = await createFixture({
    'curriculum/application/use-case.ts': "import { FamilyContract } from '../../families/application/public-api';\n",
    'families/application/public-api.ts': 'export interface FamilyContract {}\n',
  });

  const result = check(fixtureRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
});

test('rejects every cross-module static import outside the public application contract', async () => {
  const fixtureRoot = await createFixture({
    'curriculum/application/application-internal.ts':
      "import { FamilyUseCase } from '../../families/application/use-case';\n",
    'curriculum/application/presentation.ts':
      "import { FamilyController } from '../../families/presentation/family.controller';\n",
    'curriculum/application/module-root.ts':
      "import { FamiliesModule } from '../../families';\n",
    'curriculum/application/module-barrel.ts':
      "import { FamiliesModule } from '../../families/index';\n",
  });

  const result = check(fixtureRoot);

  assert.notEqual(result.status, 0);
  assert.equal(
    result.stderr
      .split('\n')
      .filter((line) => line === 'curriculum may only import families/application/public-api')
      .length,
    4,
  );
});

test('allows public application contracts with NodeNext file extensions', async () => {
  const fixtureRoot = await createFixture({
    'curriculum/application/use-case.ts':
      "import type { FamilyContract } from '../../families/application/public-api.js';\n",
    'families/application/public-api.ts': 'export interface FamilyContract {}\n',
  });

  const result = check(fixtureRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
});

test('rejects cross-module CommonJS require calls', async () => {
  const fixtureRoot = await createFixture({
    'curriculum/application/use-case.ts':
      "const familyContract = require('../../families/application/public-api');\n",
  });

  const result = check(fixtureRoot);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /curriculum may not require families/);
});

test('rejects TypeScript import-equals across modules', async () => {
  const fixtureRoot = await createFixture({
    'curriculum/application/use-case.ts':
      "import FamilyContract = require('../../families/application/public-api');\n",
  });

  const result = check(fixtureRoot);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /curriculum may not use import-equals for families/);
});

test('rejects a dynamic cross-module import', async () => {
  const fixtureRoot = await createFixture({
    'curriculum/application/use-case.ts': "export const loadFamily = () => import('../../families/application/public-api');\n",
    'families/application/public-api.ts': 'export interface FamilyContract {}\n',
  });

  const result = check(fixtureRoot);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /curriculum may not dynamically import families/);
});

test('rejects an aliased cross-module domain import', async () => {
  const fixtureRoot = await createFixture({
    'curriculum/application/use-case.ts': "import { Family } from '@modules/families/domain/family';\n",
  });

  const result = check(fixtureRoot);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /curriculum may not import families\/domain/);
});

test('normalizes dot and parent path segments in aliased imports', async () => {
  const fixtureRoot = await createFixture({
    'curriculum/application/dot-segment.ts': "import { Family } from '@modules/families/./domain/family';\n",
    'curriculum/application/parent-segment.ts': "import { Family } from '@modules/families/application/../domain/family';\n",
  });

  const result = check(fixtureRoot);

  assert.notEqual(result.status, 0);
  assert.equal(result.stderr.split('\n').filter((line) => line === 'curriculum may not import families/domain').length, 2);
});

test('rejects a template-literal dynamic import with comments and options', async () => {
  const fixtureRoot = await createFixture({
    'curriculum/application/use-case.ts': `
      export const loadFamily = () => import(
        /* load the public contract */ \`../../families/application/public-api\`,
        { with: { type: 'json' } },
      );
    `,
  });

  const result = check(fixtureRoot);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /curriculum may not dynamically import families/);
});

test('ignores import-shaped text in comments and strings', async () => {
  const fixtureRoot = await createFixture({
    'curriculum/application/use-case.ts': `
      const example = "import { Family } from '../../families/infrastructure/family.repository'";
      const lazyExample = "import('../../families/application/public-api')";
      /* export { Family } from '../../families/domain/family'; */
    `,
  });

  const result = check(fixtureRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
});
