import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  partitionTargets,
  runTargetedTests,
  TargetRoutingError,
} from './run-targeted-tests.mjs';

const testIndex = [
  {
    packageName: '@aletheia/web',
    packageRoot: 'apps/web',
    relativePath: 'tests/curriculum-explore.test.tsx',
  },
  {
    packageName: '@aletheia/web',
    packageRoot: 'apps/web',
    relativePath: 'tests/product-shell.test.tsx',
  },
  {
    packageName: '@aletheia/api',
    packageRoot: 'apps/api',
    relativePath: 'src/modules/curriculum/application/curriculum.service.spec.ts',
  },
  {
    packageName: '@aletheia/api',
    packageRoot: 'apps/api',
    relativePath: 'src/modules/curriculum/infrastructure/curriculum.repository.spec.ts',
  },
  {
    packageName: '@aletheia/contracts',
    packageRoot: 'packages/contracts',
    relativePath: 'src/pedagogical-model-definition.test.ts',
  },
];

test('partitions the B07 target set by owning package', () => {
  const result = partitionTargets(
    [
      'curriculum-explore.test.tsx',
      'curriculum.service.spec.ts',
      'curriculum.repository.spec.ts',
      'pedagogical-model-definition.test.ts',
    ],
    testIndex,
  );

  assert.deepEqual(result, [
    {
      packageName: '@aletheia/web',
      packageRoot: 'apps/web',
      targets: ['tests/curriculum-explore.test.tsx'],
    },
    {
      packageName: '@aletheia/api',
      packageRoot: 'apps/api',
      targets: [
        'src/modules/curriculum/application/curriculum.service.spec.ts',
        'src/modules/curriculum/infrastructure/curriculum.repository.spec.ts',
      ],
    },
    {
      packageName: '@aletheia/contracts',
      packageRoot: 'packages/contracts',
      targets: ['src/pedagogical-model-definition.test.ts'],
    },
  ]);
});

test('preserves input order inside each package and uses stable package ordering', () => {
  const result = partitionTargets(
    [
      'curriculum.repository.spec.ts',
      'product-shell.test.tsx',
      'curriculum.service.spec.ts',
      'curriculum-explore.test.tsx',
    ],
    testIndex,
  );

  assert.deepEqual(result.map(({ packageName, targets }) => ({ packageName, targets })), [
    {
      packageName: '@aletheia/web',
      targets: ['tests/product-shell.test.tsx', 'tests/curriculum-explore.test.tsx'],
    },
    {
      packageName: '@aletheia/api',
      targets: [
        'src/modules/curriculum/infrastructure/curriculum.repository.spec.ts',
        'src/modules/curriculum/application/curriculum.service.spec.ts',
      ],
    },
  ]);
});

test('accepts explicit workspace paths and normalizes them for the package runner', () => {
  const result = partitionTargets(['apps/web/tests/product-shell.test.tsx'], testIndex);

  assert.deepEqual(result[0].targets, ['tests/product-shell.test.tsx']);
});

test('preserves a same-package glob so the package runner can select multiple files', () => {
  const patternIndex = [
    ...testIndex,
    {
      packageName: '@aletheia/web',
      packageRoot: 'apps/web',
      relativePath: 'tests/curriculum-planning.test.tsx',
    },
  ];

  const result = partitionTargets(['curriculum*.test.tsx'], patternIndex);

  assert.deepEqual(result[0].targets, ['curriculum*.test.tsx']);
});

test('rejects an unknown target before any process is started', () => {
  assert.throws(
    () => partitionTargets(['missing.test.ts'], testIndex),
    (error) => {
      assert.ok(error instanceof TargetRoutingError);
      assert.match(error.message, /Unable to resolve targeted test/);
      assert.match(error.message, /missing\.test\.ts/);
      return true;
    },
  );
});

test('rejects an ambiguous bare target and asks for an explicit path', () => {
  const ambiguousIndex = [
    ...testIndex,
    {
      packageName: '@aletheia/api',
      packageRoot: 'apps/api',
      relativePath: 'test/pedagogical-model-definition.test.ts',
    },
  ];

  assert.throws(
    () => partitionTargets(['pedagogical-model-definition.test.ts'], ambiguousIndex),
    (error) => {
      assert.ok(error instanceof TargetRoutingError);
      assert.match(error.message, /ambiguous/i);
      assert.match(error.message, /explicit workspace path/i);
      return true;
    },
  );
});

test('invokes only the owning package and stops after the first failure', () => {
  const calls = [];
  const result = runTargetedTests({
    targets: ['curriculum.service.spec.ts', 'curriculum-explore.test.tsx'],
    testIndex,
    repoRoot: 'repo-root',
    platform: 'linux',
    spawn(executable, args, options) {
      calls.push({ executable, args, options });
      return { status: 7, signal: null };
    },
  });

  assert.equal(result, 7);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    executable: 'pnpm',
    args: [
      '--filter',
      '@aletheia/web',
      'test',
      '--',
      'tests/curriculum-explore.test.tsx',
    ],
    options: { cwd: 'repo-root', stdio: 'inherit', windowsHide: true },
  });
});

test('rejects an empty target list before spawning a package runner', () => {
  let spawned = false;

  assert.throws(
    () => runTargetedTests({
      targets: [],
      testIndex,
      spawn() {
        spawned = true;
        return { status: 0, signal: null };
      },
    }),
    TargetRoutingError,
  );

  assert.equal(spawned, false);
});

test('uses pnpm.cmd on Windows', () => {
  const calls = [];
  const result = runTargetedTests({
    targets: ['pedagogical-model-definition.test.ts'],
    testIndex,
    repoRoot: 'repo-root',
    platform: 'win32',
    comSpec: 'cmd.exe',
    spawn(executable, args) {
      calls.push({ executable, args });
      return { status: 0, signal: null };
    },
  });

  assert.equal(result, 0);
  assert.deepEqual(calls[0], {
    executable: 'cmd.exe',
    args: ['/d', '/s', '/c', 'pnpm.cmd', '--filter', '@aletheia/contracts', 'test', 'src/pedagogical-model-definition.test.ts'],
  });
});

test('exposes a dedicated root command without changing the full-suite scripts', () => {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

  assert.equal(packageJson.scripts['test:targeted'], 'node scripts/run-targeted-tests.mjs');
  assert.equal(packageJson.scripts.test, 'pnpm -r --if-present test');
  assert.equal(packageJson.scripts['test:ci'], 'pnpm -r --if-present test');
});
